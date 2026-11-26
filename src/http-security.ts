import { timingSafeEqual } from "node:crypto";

/** Require a configured bearer token for the HTTP MCP endpoint. */
export function hasValidBearerToken(header: string | undefined, expectedToken: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7), "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/** Fail closed when HTTP is enabled without an explicit secret. */
export function requireHttpToken(token: string | undefined): string {
  if (!token || token.trim().length < 32) {
    throw new Error("HTTP transport requires MCP_AUTH_TOKEN with at least 32 characters. Generate one with: openssl rand -hex 32");
  }
  return token;
}
