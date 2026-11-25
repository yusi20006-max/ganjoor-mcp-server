/**
 * Unit tests for pagination helpers and edge cases.
 */
import assert from "node:assert";
import { fetchPaged, applySkipPaging } from "../src/client.js";

async function testPagination() {
  console.log("Running pagination unit tests...");

  // Test applySkipPaging
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  // Normal page
  const page1 = applySkipPaging(data, 0, 3);
  assert.deepStrictEqual(page1.items, [1, 2, 3]);
  assert.strictEqual(page1.hasMore, true);
  assert.strictEqual(page1.nextSkip, 3);

  // Last page / exact boundary
  const pageLast = applySkipPaging(data, 9, 3);
  assert.deepStrictEqual(pageLast.items, [10]);
  assert.strictEqual(pageLast.hasMore, false);
  assert.strictEqual(pageLast.nextSkip, null);

  // Out of bounds / empty result
  const pageEmpty = applySkipPaging(data, 15, 3);
  assert.deepStrictEqual(pageEmpty.items, []);
  assert.strictEqual(pageEmpty.hasMore, false);
  assert.strictEqual(pageEmpty.nextSkip, null);

  console.log("Pagination unit tests passed successfully!");
}

testPagination().catch((err) => {
  console.error("Pagination test failed:", err);
  process.exit(1);
});
