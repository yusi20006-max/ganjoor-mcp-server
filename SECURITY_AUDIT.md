# Dependency Security Audit

## Evidence

The GitHub Actions `Dependency Audit` workflow was added to run `npm audit --audit-level=moderate`,
typecheck, and build on PRs. Its first run failed at `npm audit`, which is a finding, not a pass.

The audit output reported 7 vulnerabilities (5 moderate, 2 high) in the tested dependency graph:
- `@hono/node-server`: moderate advisories (fix available with non-breaking update)
- `body-parser`: high advisory (fix available with non-breaking update)
- `fast-uri`: moderate advisories (fix available with non-breaking update)
- `hono`: moderate advisories (fix available with non-breaking update)
- `ip-address`: moderate advisory (fix available with non-breaking update)
- `qs`: moderate advisory (fix available with non-breaking update)
- `zod`: high advisory; audit reports fixed version in Zod 4.6.6+, requiring a major-version migration

The lockfile on this branch contains newer versions for the first six dependency entries, but the audit
workflow still reports vulnerabilities. The high-severity Zod finding is not resolved by a safe
non-breaking `npm audit fix`.

## Decision

Do not claim Issue #6 is complete. A Zod major upgrade must be evaluated separately with compatibility
review of schema definitions and the MCP SDK, then tested on the supported Node matrix. No
`npm audit fix --force` was run because that would make a breaking dependency change without
runtime validation.

## Required follow-up

- [ ] Resolve moderate advisories in the lockfile and confirm audit output.
- [ ] Evaluate and implement Zod 4 migration in a focused PR, or document an accepted risk with rationale.
- [ ] Run `npm audit`, typecheck, build, and offline tests after changes.
- [ ] Record final audit evidence and close Issue #6 only when the criteria are satisfied.
