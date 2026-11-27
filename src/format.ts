import { CHARACTER_LIMIT, SITE_BASE_URL } from "./constants.js";
import { ResponseFormat } from "./schemas.js";

/** Marker appended when a response is cut down to fit the character limit. */
export interface TruncationInfo {
  truncated: boolean;
  truncation_message?: string;
}

/**
 * Render a tool response in the requested format.
 * Returns text content plus structured JSON so modern MCP clients can consume
 * either representation without a second round trip.
 */
export function render(
  format: ResponseFormat,
  data: Record<string, unknown>,
  markdown: string,
): {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: Record<string, unknown>;
} {
  const originalText = format === ResponseFormat.JSON ? safeJson(data) : markdown;
  const structuredOverLimit = safeJson(data).length > CHARACTER_LIMIT;
  const textOverLimit = originalText.length > CHARACTER_LIMIT;
  let text = originalText;
  let payload: Record<string, unknown> = data;

  if (structuredOverLimit || textOverLimit) {
    const message =
      `Response exceeded ${CHARACTER_LIMIT} characters and was clipped. ` +
      "Narrow the request with page/page_size, items_count, or an `exclude_fields` argument.";
    payload = {
      ...boundedStructured(data),
      truncated: true,
      truncation_message: message,
    };
  }

  if (textOverLimit) {
    if (format === ResponseFormat.JSON) {
      text = safeJson(payload);
      if (text.length > CHARACTER_LIMIT) {
        payload = { truncated: true, truncation_message: "Response was truncated." };
        text = safeJson(payload);
      }
    } else {
      text = clipMarkdown(markdown);
    }
  }

  return {
    content: [{ type: "text", text }],
    structuredContent: payload,
  };
}


/** Bound structured payloads as well as the rendered text to prevent context overflow. */
function boundedStructured(data: Record<string, unknown>): Record<string, unknown> {
  const compactValue = (value: unknown, depth = 0): unknown => {
    if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}…` : value;
    if (value === null || typeof value !== "object") return value;
    if (depth >= 4) return "[nested content omitted]";
    if (Array.isArray(value)) {
      const items = value.slice(0, 5).map((item) => compactValue(item, depth + 1));
      if (value.length > 5) items.push(`… ${value.length - 5} more items` as never);
      return items;
    }
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 25);
    return Object.fromEntries(entries.map(([key, item]) => [key, compactValue(item, depth + 1)]));
  };
  const compacted = compactValue(data) as Record<string, unknown>;
  if (safeJson(compacted).length <= CHARACTER_LIMIT) return compacted;
  const summary = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => [key, typeof value === "string" && value.length > 200 ? `${value.slice(0, 200)}…` : value]),
  );
  return summary;
}

/** Clip overlong markdown while keeping whole lines. */
function clipMarkdown(text: string): string {
  const budget = Math.floor(CHARACTER_LIMIT * 0.9);
  const clipped = text.slice(0, budget);
  const lastNewline = clipped.lastIndexOf("\n");
  const body = lastNewline > budget * 0.5 ? clipped.slice(0, lastNewline) : clipped;
  return `${body}\n\n… [response truncated]`;
}

export function safeJson(data: Record<string, unknown>): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return JSON.stringify({ error: "Unable to serialize response", raw: String(data) });
  }
}

/** Absolute, clickable Ganjoor web URL for a path-style slug. */
export function siteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${SITE_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}

/** Drop null/undefined values so responses stay compact. */
export function compact<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) output[key] = value;
  }
  return output as Partial<T>;
}

/**
 * Collect markdown lines for a document.
 *
 * Drops `null`, `undefined` and `false` (the usual result of an inline
 * `condition ? text : ""`) but **preserves explicit empty strings**, because
 * markdown needs real blank lines between a paragraph and the next heading.
 * Callers render conditional fragments as `cond ? text : null`.
 */
export function lines(...parts: Array<string | false | null | undefined>): string[] {
  return parts.filter((part): part is string => part !== false && part !== null && part !== undefined);
}

/** Join markdown lines with newlines, preserving intentional blank lines. */
export function md(...parts: Array<string | false | null | undefined>): string {
  return lines(...parts).join("\n");
}

/** Render a bulleted list, or a fallback dash when empty. */
export function bullets(items: string[], emptyLabel = "none"): string {
  if (!items.length) return `- ${emptyLabel}`;
  return items.map((item) => `- ${item}`).join("\n");
}

/** Format a possibly-null number for display. */
export function num(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : String(value);
}

/** Format a possibly-null boolean for display. */
export function bool(value: boolean | null | undefined): string {
  return value === null || value === undefined ? "—" : value ? "yes" : "no";
}

/** Format an ISO-ish date string, or a placeholder. */
export function date(value: string | null | undefined): string {
  return value ? value : "—";
}

/**
 * Convert a Hijri (Islamic) year to an approximate Gregorian year.
 * Purely for reader context; never used for any computation on the server side.
 */
export function hijriToGregorianApprox(hijriYear: number): string {
  return String(Math.floor(hijriYear * 0.970224 + 622));
}

/** Persian numeral-aware digit rendering is intentionally skipped; digits stay ASCII. */
export const enum Labels {
  Poet = "Poet",
  Cat = "Category",
  Poem = "Poem",
}
