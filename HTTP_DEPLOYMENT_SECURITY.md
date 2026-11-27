# HTTP Deployment Security

## Supported exposure modes

- **stdio (recommended for desktop/local MCP clients):** default transport. No HTTP listener is created.
- **HTTP on loopback:** enable `HTTP=true`; bind `HOST=127.0.0.1` (default) and use a strong `MCP_AUTH_TOKEN`.
- **Container on a local host:** the Compose file binds the published port to `127.0.0.1:3000` on the host. The container listens on `0.0.0.0` internally; this does not mean the host port is public.
- **Remote/shared access:** do not publish the container port directly to the public Internet. Put it behind a TLS reverse proxy or private network, retain bearer authentication, and apply proxy-level rate limits and access controls.

## Authentication

HTTP startup fails closed unless `MCP_AUTH_TOKEN` is at least 32 characters. Generate a secret:

```bash
openssl rand -hex 32
```

Set the generated value in a secret manager or protected environment variable. Never commit it to `.env`, compose files, logs, or issue comments. Every `/mcp` request requires:

```http
Authorization: Bearer <token>
```

## Origin checks

`ALLOWED_ORIGINS` is an exact comma-separated allow-list for browser origins. Loopback origins are allowed by default. Origin checks mitigate DNS-rebinding/browser risks; they are **not authentication** and do not replace the bearer token.

## Health endpoint

`/health` is intentionally unauthenticated for container health checks and returns upstream health status. It does not expose the MCP tools or bypass `/mcp` bearer authentication. If deploying publicly, restrict health access at the proxy if operational policy requires it.

## Docker Compose

1. Create a local `.env` file (do not commit it) containing `MCP_AUTH_TOKEN=<generated-secret>`.
2. Run `docker compose up -d`.
3. The published port remains loopback-only by default. Do not change it to `0.0.0.0:3000:3000` without a reviewed network/proxy plan.

## Reverse proxy requirements

- TLS termination with modern TLS configuration.
- Preserve the `Authorization` header to `/mcp`.
- Restrict upstream access to the proxy/private network; do not expose the container listener.
- Configure request rate limits, connection limits, and access logging that redacts bearer tokens.
- Configure `ALLOWED_ORIGINS` only for exact trusted browser origins; leave empty for non-browser clients unless needed.
- Keep the upstream bind address and published port consistent with the proxy network.

## Security tests

CI covers bearer-token required/invalid/valid cases, timing-safe token comparison, minimum token length, authentication before JSON parsing, and unauthenticated malformed/oversized body handling. Origin checks are separate from authentication.

