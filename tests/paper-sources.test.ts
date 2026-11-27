import assert from "node:assert/strict";
import http from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const requests: string[] = [];
const mock = http.createServer((req, res) => {
  requests.push(req.url ?? "");
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/api/ganjoor/cat/24/papersources") {
    res.writeHead(200);
    res.end(JSON.stringify(Array.from({ length: 102 }, (_, id) => ({
      id, title: "Source " + id, author: "Editor " + id, url: id === 0 ? "javascript:alert(1)" : "https://example.org/" + id,
    }))));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  }
});
await new Promise<void>((resolve) => mock.listen(0, "127.0.0.1", resolve));
const address = mock.address();
assert.ok(address && typeof address === "object");
const previous = process.env.GANJOOR_API_BASE_URL;
process.env.GANJOOR_API_BASE_URL = `http://127.0.0.1:${address.port}`;

try {
  const { createServer } = await import("../src/server.js");
  const server = createServer();
  const client = new Client({ name: "paper-sources-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const listed = await client.listTools();
  assert.ok(listed.tools.some((tool) => tool.name === "ganjoor_get_category_paper_sources"));
  const result = await client.callTool({
    name: "ganjoor_get_category_paper_sources",
    arguments: { cat_id: 24, response_format: "json" },
  });
  assert.ok(!result.isError, "successful tool result should not be marked as error");
  const data = result.structuredContent as Record<string, unknown>;
  assert.equal(data.category_id, 24);
  assert.equal(data.returned, 100);
  assert.equal(data.total, 102);
  assert.equal(data.truncated, true);
  const sources = data.paper_sources as Array<Record<string, unknown>>;
  assert.equal(sources.length, 100);
  assert.equal(sources[0].url, null, "unsafe non-http URL is nulled");
  assert.equal(sources[1].url, "https://example.org/1");
  assert.deepEqual(requests, ["/api/ganjoor/cat/24/papersources"]);
  await client.close();
  await server.close();
} finally {
  if (previous === undefined) delete process.env.GANJOOR_API_BASE_URL;
  else process.env.GANJOOR_API_BASE_URL = previous;
  await new Promise<void>((resolve, reject) => mock.close((error) => error ? reject(error) : resolve()));
}
console.log("Category paper-source MCP fixture test passed.");
