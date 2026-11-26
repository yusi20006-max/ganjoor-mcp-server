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
    res.end(JSON.stringify([
      { id: 1, title: "Edition A", author: "Editor A", url: "https://example.org/a" },
      { id: 2, title: "Edition B", author: "Editor B", url: "https://example.org/b" },
    ]));
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
  assert.ok(!result.isError, "tool should return a successful result");
  const data = result.structuredContent as Record<string, unknown>;
  assert.equal(data.category_id, 24);
  assert.equal(data.returned, 2);
  assert.equal(data.total, 2);
  assert.equal(data.truncated, false);
  assert.deepEqual(data.paper_sources, [
    { id: 1, title: "Edition A", author: "Editor A", url: "https://example.org/a" },
    { id: 2, title: "Edition B", author: "Editor B", url: "https://example.org/b" },
  ]);
  assert.deepEqual(requests, ["/api/ganjoor/cat/24/papersources"]);
  await client.close();
  await server.close();
} finally {
  if (previous === undefined) delete process.env.GANJOOR_API_BASE_URL;
  else process.env.GANJOOR_API_BASE_URL = previous;
  await new Promise<void>((resolve, reject) => mock.close((error) => error ? reject(error) : resolve()));
}
console.log("Category paper-source MCP fixture test passed.");
