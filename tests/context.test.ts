/**
 * Unit tests for context management, truncation, and formatting.
 */
import assert from "node:assert";
import { render, safeJson, compact, lines, md, bullets } from "../src/format.js";
import { ResponseFormat } from "../src/schemas.js";

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

  console.log("Context management & formatting tests passed successfully!");
}

testContextManagement().catch((err) => {
  console.error("Context management test failed:", err);
  process.exit(1);
});
