import assert from "node:assert/strict";
import { hasValidBearerToken, requireHttpToken } from "../src/http-security.js";

const token = "0123456789abcdef0123456789abcdef";
assert.equal(hasValidBearerToken(`Bearer ${token}`, token), true);
assert.equal(hasValidBearerToken(undefined, token), false);
assert.equal(hasValidBearerToken("Basic abc", token), false);
assert.equal(hasValidBearerToken("Bearer wrong", token), false);
assert.equal(hasValidBearerToken(`Bearer ${token}x`, token), false);
assert.equal(requireHttpToken(token), token);
assert.throws(() => requireHttpToken(undefined), /requires MCP_AUTH_TOKEN/);
assert.throws(() => requireHttpToken("short"), /at least 32 characters/);
console.log("HTTP security tests passed.");
