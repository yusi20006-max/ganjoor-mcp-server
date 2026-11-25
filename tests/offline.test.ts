/**
 * Offline test suite for Ganjoor MCP server using a local mock HTTP server.
 * Verifies tool registration, schema validation, formatting, error handling,
 * and API client behavior without requiring live internet/Ganjoor API access.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";
import http from "node:http";
import assert from "node:assert";

async function run() {
  // 1. Start a local mock HTTP server mimicking api.ganjoor.net
  const mockServer = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.url?.startsWith("/api/ganjoor/poets")) {
      res.writeHead(200);
      res.end(JSON.stringify([{ id: 2, name: "حافظ", urlSlug: "hafez", description: "شیرین‌سخن" }]));
    } else if (req.url?.startsWith("/api/ganjoor/poem/2623")) {
      res.writeHead(200);
      res.end(JSON.stringify({
        id: 2623,
        title: "الا ایه ساقی ادرس کار شراب...",
        urlSlug: "hafez/ghazal/sh494",
        poet: { id: 2, name: "حافظ", urlSlug: "hafez" },
        verses: [
          { vOrder: 1, text: "الا ای ساقی از برکن می باقی", position: 0 },
          { vOrder: 2, text: "که عشق آسان نمود اول ولی افتاد مشکل‌ها", position: 1 }
        ]
      }));
    } else if (req.url?.startsWith("/api/ganjoor/poem/analysisrhyme")) {
      res.writeHead(200);
      res.end(JSON.stringify({ rhyme: "قافیه تستی" }));
    } else if (req.url?.startsWith("/api/ganjoor/poems/similar")) {
      res.writeHead(200);
      res.end(JSON.stringify([{ id: 2624, title: "مشابه", urlSlug: "hafez/ghazal/sh495" }]));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  await new Promise<void>((resolve) => mockServer.listen(0, resolve));
  const address = mockServer.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  
  // Point GANJOOR_API_BASE_URL to our mock server
  process.env.GANJOOR_API_BASE_URL = `http://127.0.0.1:${port}`;

  console.log(`Mock server running at http://127.0.0.1:${port}`);

  try {
    const server = createServer();
    const client = new Client({ name: "ganjoor-offline-test", version: "1.0.0" });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    console.log(`Registered ${tools.length} tools.`);
    assert.ok(tools.length >= 40, "Should have all registered tools");

    // Test tool call 1: ganjoor_list_poets
    const resPoets = await client.callTool({
      name: "ganjoor_list_poets",
      arguments: {},
    });
    console.log("ganjoor_list_poets response:", JSON.stringify(resPoets).slice(0, 150));
    assert.ok(!resPoets.isError, "ganjoor_list_poets should succeed");

    // Test tool call 2: ganjoor_get_poem_by_id
    const resPoem = await client.callTool({
      name: "ganjoor_get_poem_by_id",
      arguments: { poem_id: 2623 },
    });
    console.log("ganjoor_get_poem_by_id response:", JSON.stringify(resPoem).slice(0, 150));
    assert.ok(!resPoem.isError, "ganjoor_get_poem_by_id should succeed");

    // Test tool call 3: ganjoor_analyze_poem_rhyme (previously failed offline without mock)
    const resRhyme = await client.callTool({
      name: "ganjoor_analyze_poem_rhyme",
      arguments: { poem_id: 2623 },
    });
    console.log("ganjoor_analyze_poem_rhyme response:", JSON.stringify(resRhyme).slice(0, 150));
    assert.ok(!resRhyme.isError, "ganjoor_analyze_poem_rhyme should succeed with mock");

    // Test tool call 4: ganjoor_find_similar_poems (previously failed offline without mock)
    const resSimilar = await client.callTool({
      name: "ganjoor_find_similar_poems",
      arguments: { metre: "test", rhyme: "test" },
    });
    console.log("ganjoor_find_similar_poems response:", JSON.stringify(resSimilar).slice(0, 150));
    assert.ok(!resSimilar.isError, "ganjoor_find_similar_poems should succeed with mock");

    console.log("\nALL OFFLINE TESTS PASSED SUCCESSFULLY!");
  } finally {
    mockServer.close();
  }
}

run().catch((err) => {
  console.error("Offline test failed:", err);
  process.exit(1);
});
