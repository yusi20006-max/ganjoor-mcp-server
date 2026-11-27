import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { hasValidBearerToken, requireHttpToken, createBearerAuthMiddleware } from "../src/http-security.js";

const token = "0123456789abcdef0123456789abcdef";
assert.equal(hasValidBearerToken(`Bearer ${token}`, token), true);
assert.equal(hasValidBearerToken(undefined, token), false);
assert.equal(hasValidBearerToken("Basic abc", token), false);
assert.equal(hasValidBearerToken("Bearer wrong", token), false);
assert.equal(hasValidBearerToken(`Bearer ${token}x`, token), false);
assert.equal(requireHttpToken(token), token);
assert.throws(() => requireHttpToken(undefined), /requires MCP_AUTH_TOKEN/);
assert.throws(() => requireHttpToken("short"), /at least 32 characters/);

const app = express();
app.all("/mcp", createBearerAuthMiddleware(token), (_req, res) => res.status(200).send("authorized"));
const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
assert.ok(address && typeof address === "object");
const url = `http://127.0.0.1:${address.port}/mcp`;
try {
  const missing = await fetch(url);
  assert.equal(missing.status, 401);
  assert.equal(missing.headers.get("www-authenticate"), "Bearer");
  const wrong = await fetch(url, { headers: { Authorization: "Bearer invalid" } });
  assert.equal(wrong.status, 401);
  const valid = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(valid.status, 200);
  assert.equal(await valid.text(), "authorized");
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
console.log("HTTP security unit and middleware integration tests passed.");
