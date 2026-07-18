# Project Brief — Playbook (Trigger → Gate → Execute) Module

This project is a self-contained slice of a production serverless backend. The goal of this
engagement is to build its **playbook** module: the automation pipeline that turns an incoming
Composio trigger event into a gated, tool-using Claude run, plus the read APIs around it.

## Scope of work

Everything under `src/components/playbook/` (currently skeletons that throw `NotImplemented`):
the cached Anthropic client, tool resolution, the pure BlockNote-to-text flattener, the gate
(a cheap Haiku pre-filter with a bounded investigative tool loop), the executor (the prompt
tool-use loop), the processor orchestration, the async worker + invoker, the run repository,
trigger activation/search, and the HTTP handlers.

The full contract is documented in:

- [docs/requirements.md](docs/requirements.md) — context, surface, functional requirements
- [docs/specifications.md](docs/specifications.md) — file map, exact Anthropic/Composio/Mongo calls, budgets, response table
- [docs/diagrams.md](docs/diagrams.md) — pipeline flow, gate/executor sequences, processor swimlane
- [docs/features/](docs/features/) — the executable acceptance scenarios (Gherkin)

Auth (`getAuthenticatedUserId`), Mongo (`getDb`), and trimmed stand-ins for the connectors and
playbook-config modules (`composioClient`, `connectorsRepo`, `toolkitsRepo`, `toolkitCatalog`,
`composioTriggers`, `playbook-config/repo`) are **provided** — you import them but do not modify
or fully implement them.

## Getting started

```bash
npm install
npm test               # runs the acceptance suites (they fail until you implement)
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Boots the service locally with serverless-offline |
| `npm test` | Runs all tests, including the jest-cucumber acceptance suites |
| `npm run test:coverage` | Runs tests with coverage |
| `npm run lint` / `npm run typecheck` | Should both pass cleanly |

`.env.test` already contains safe test values. Real values are only needed to exercise
`npm run dev` against live Anthropic/Composio/Mongo.

## Definition of done

1. **All acceptance scenarios should pass.** The suites under
   `tests/` execute the Gherkin features in `docs/features/` against
   your code (with collaborating modules mocked). Please leave the feature files and the step
   definitions alone.
2. **Write your own tests too.** The acceptance suites cover the interesting behavior but not
   every branch. Add your own unit tests (`*.test.ts`) alongside the acceptance suite to reach
   solid coverage (branches, functions, lines, statements) of the files you write — check with
   `npm run test:coverage`.
3. **Implement every skeleton file.** Coverage is collected across the whole module, so it helps
   to leave no file sitting as `NotImplemented`.
4. **Keep the public surface and file paths as given.** The work is intended to drop straight
   into the parent repository, so renamed files, moved exports, or changed signatures break that
   drop-in compatibility.
5. **Please leave the provided files alone** — configs, docs, acceptance suites, `src/base/**`,
   `src/interfaces/**`, and the provided stubs (`auth/verifyToken`, `mongo/client`, and the
   `connectors/*` + `playbook-config/repo` stand-ins).
6. **Avoid new runtime dependencies** unless there's a clear reason (note it in your handover).
   Dev-dependencies for testing are fine. The runtime deps in play are `@anthropic-ai/sdk`,
   `@composio/core`, `@aws-sdk/client-lambda`, and `mongodb`.
7. `npm run lint` and `npm run typecheck` should pass with zero errors.

## Delivery

Push the sandbox to a repository and share access, or send it as a zip (without `node_modules/`),
including a short note on any decisions or trade-offs you made.
