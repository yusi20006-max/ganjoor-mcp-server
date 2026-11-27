# Dependency Security Audit

## Latest automated result

- Date: 2026-11-27
- Workflow: GitHub Actions, `Dependency Audit`
- Run: https://github.com/yusi20006-max/ganjoor-mcp-server/actions/runs/45947771428
- Runtime: Node.js 22.23.5, npm 10.9.9
- Install result: `npm ci` installed and audited 110 packages
- Audit command: `npm audit --audit-level=moderate`
- Result: **0 vulnerabilities**

The same workflow run also passed typecheck, build, and the offline MCP test suite. The dependency audit is scheduled weekly and runs on pull requests and pushes to `main`.

## Scope and limitations

This report records the automated dependency audit only. It does not claim that the full application security baseline in Issue #6 is complete. Secrets handling, error disclosure, input validation, outbound API behavior, and container/deployment configuration still require explicit review and evidence before that issue can be closed.

## Previous findings

The earlier Zod 3 dependency graph reported moderate and high advisories, including a high-severity Zod advisory. The focused Zod 4 migration updated the npm lockfile, and the current audit now reports zero vulnerabilities. The MCP SDK minimum was also raised to `^1.23.0` so the declared dependency range supports Zod 4 schemas.
