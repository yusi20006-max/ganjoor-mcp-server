import assert from "node:assert/strict";
import { fetchPaged, applySkipPaging } from "../src/client.js";

async function testPagination() {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.deepEqual(applySkipPaging(items, 0, 3), { items: [1, 2, 3], hasMore: true, nextSkip: 3 });
  assert.deepEqual(applySkipPaging(items, 9, 3), { items: [10], hasMore: false, nextSkip: null });
  assert.deepEqual(applySkipPaging(items, 15, 3), { items: [], hasMore: false, nextSkip: null });
  assert.deepEqual(applySkipPaging(items, 0, 0), { items: [], hasMore: false, nextSkip: null });
  assert.deepEqual(applySkipPaging(items, -2, 3).items, [1, 2, 3], "negative skip is not used by callers; slice clamps it");

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("PageNumber"), "2");
      assert.equal(url.searchParams.get("PageSize"), "3");
      return new Response(JSON.stringify([{ id: 3 }, { id: 4 }, { id: 5 }]), { status: 200 });
    };
    const paged = await fetchPaged<{ id: number }>("/api/ganjoor/poems", 2, 2);
    assert.deepEqual(paged.items, [{ id: 3 }, { id: 4 }]);
    assert.equal(paged.page, 2);
    assert.equal(paged.page_size, 2);
    assert.equal(paged.has_more, true);
    assert.equal(paged.next_page, 3);

    globalThis.fetch = async () => new Response(JSON.stringify([{ id: 1 }, { id: 2 }]), { status: 200 });
    const last = await fetchPaged<{ id: number }>("/api/ganjoor/poems", 1, 2);
    assert.deepEqual(last.items, [{ id: 1 }, { id: 2 }]);
    assert.equal(last.has_more, false);
    assert.equal(last.next_page, null);

    // Full-collection mode: the endpoint ignores PageNumber/PageSize and returns all rows.
    globalThis.fetch = async () => new Response(JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]), { status: 200 });
    const ignoredPaging = await fetchPaged<{ id: number }>("/api/ganjoor/poets", 2, 2);
    assert.deepEqual(ignoredPaging.items, [{ id: 3 }, { id: 4 }], "full collection is sliced locally");
    assert.equal(ignoredPaging.has_more, true);
    assert.equal(ignoredPaging.next_page, 3);

    // Upstream-paged mode: the endpoint returns only the requested window plus one extra row.
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const page = Number(url.searchParams.get("PageNumber"));
      assert.equal(url.searchParams.get("PageSize"), "3");
      const rows = page === 1
        ? [{ id: 1 }, { id: 2 }, { id: 3 }]
        : [{ id: 3 }, { id: 4 }, { id: 5 }];
      return new Response(JSON.stringify(rows), { status: 200 });
    };
    const upstreamFirst = await fetchPaged<{ id: number }>("/api/ganjoor/poets", 1, 2);
    assert.deepEqual(upstreamFirst.items, [{ id: 1 }, { id: 2 }]);
    assert.equal(upstreamFirst.has_more, true);
    const upstreamSecond = await fetchPaged<{ id: number }>("/api/ganjoor/poets", 2, 2);
    assert.deepEqual(upstreamSecond.items, [{ id: 3 }, { id: 4 }]);
    assert.equal(upstreamSecond.has_more, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
  console.log("Pagination helper and fetchPaged tests passed.");
}
testPagination().catch((error) => { console.error(error); process.exit(1); });
