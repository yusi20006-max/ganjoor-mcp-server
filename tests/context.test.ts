/**
 * Unit tests for context management, truncation, and formatting.
 */
import assert from "node:assert";
import { render, safeJson, compact, lines, md, bullets } from "../src/format.js";
import { ResponseFormat } from "../src/schemas.js";
import { CHARACTER_LIMIT } from "../src/constants.js";

async function testContextManagement() {
  console.log("Running context management & formatting tests...");

  // Test compact
  const cleaned = compact({ a: 1, b: null, c: undefined, d: "hello" });
  assert.deepStrictEqual(cleaned, { a: 1, d: "hello" });

  // Test md / lines
  const text = md("Line 1", null, "", "Line 3");
  assert.strictEqual(text, "Line 1\n\nLine 3");

  // Test bullets
  const b = bullets(["one", "two"]);
  assert.strictEqual(b, "- one\n- two");

  // Test render and truncation check
  const rendered = render(
    ResponseFormat.Markdown,
    { foo: "bar" },
    "# Test header\nSome content"
  );
  assert.strictEqual(rendered.content.length, 1);
  assert.strictEqual(rendered.structuredContent.foo, "bar");

  const hugeMarkdown = "line\\n".repeat(CHARACTER_LIMIT);
  const clipped = render(ResponseFormat.Markdown, { hugeMarkdown }, hugeMarkdown);
  assert.equal(clipped.structuredContent.truncated, true);
  assert.match(String(clipped.structuredContent.truncation_message), /exceeded/);
  assert.ok(clipped.content[0].text.length <= CHARACTER_LIMIT);
  assert.match(clipped.content[0].text, /response truncated/);
  assert.ok(JSON.stringify(clipped.structuredContent).length <= CHARACTER_LIMIT);
  assert.ok(String(clipped.structuredContent.hugeMarkdown).length < 600, "structured payload should be compacted");

  const jsonClipped = render(ResponseFormat.JSON, { payload: "x".repeat(CHARACTER_LIMIT + 10) }, "unused");
  assert.equal(jsonClipped.structuredContent.truncated, true);
  assert.ok(jsonClipped.content[0].text.length <= CHARACTER_LIMIT);
  assert.doesNotThrow(() => JSON.parse(jsonClipped.content[0].text), "truncated JSON response should remain valid JSON");
  assert.ok(JSON.stringify(jsonClipped.structuredContent).length <= CHARACTER_LIMIT);

  console.log("Context management, clipping, and structured truncation tests passed successfully!");
}

testContextManagement().catch((err) => {
  console.error("Context management test failed:", err);
  process.exit(1);
});
