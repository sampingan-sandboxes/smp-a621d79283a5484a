# Requirements — Playbook (Trigger → Gate → Execute) Module

## Context

A **Playbook** is a user-authored automation: a prompt (authored in a BlockNote editor) plus a
**trigger** (a Composio trigger type on one of the user's connected toolkits) and an optional
free-text **trigger description** describing when it should actually run.

When a connected toolkit emits an event, [Composio](https://composio.dev) delivers a webhook
to the connectors module, which hands the event off to this module's **async worker**. The
worker runs the pipeline once per matching Playbook:

1. **create run** — a `playbook_runs` record in `running` status, immediately (before anything
   else), so the History tab shows the run from the moment the event matched.
2. **gate** — a cheap Claude (Haiku) pre-filter that decides whether the event actually
   matches the user's trigger description, using a bounded, tool-assisted investigation.
3. **execute** — if the gate passes, run the Playbook's prompt against its configured Claude
   model with the user's connected tools, in a bounded tool-use loop.
4. **persist** — the run ends `gated_out`, `completed`, or `failed`.

Users also **browse** the trigger types available on their connections (`GET /triggers`) and
**read** a Playbook's run history (`GET /playbooks/{id}/runs` and `.../{runId}`).

This is an AWS Lambda service behind API Gateway HTTP API v2. You implement the whole
`src/components/playbook/` module. Everything outside it is **provided** — do not modify:
auth (`getAuthenticatedUserId`), Mongo (`getDb`), and trimmed stand-ins for the connectors
and playbook-config modules (`composioClient`, `connectorsRepo`, `toolkitsRepo`,
`toolkitCatalog`, `composioTriggers`, `playbook-config/repo`).

## HTTP + invocation surface

| Trigger | Handler | Summary |
|---------|---------|---------|
| `GET /triggers?search=` | `handlers/triggers.ts` | Search the caller's connected trigger types |
| async Lambda invoke | `handlers/playbookProcessorWorker.ts` | Run the pipeline for one delivered trigger event |
| `GET /playbooks/{id}/runs` | `handlers/playbookRunsList.ts` | List a Playbook's run history |
| `GET /playbooks/{id}/runs/{runId}` | `handlers/playbookRunsGet.ts` | Fetch one run |

The worker is invoked asynchronously (never behind API Gateway) via `invokePlaybookProcessorAsync`
(`processorInvoker.ts`, which the connectors webhook calls) so it can run the full multi-minute
Claude + tool-use loop without racing API Gateway's 30s integration timeout.

## Functional requirements

### FR-1 — Authentication
Every HTTP handler authenticates via `getAuthenticatedUserId(event)` and returns
`401 { message: 'Unauthorized' }` when it resolves `null`. The run handlers start `getDb()`
**before** authenticating so the Mongo connection overlaps JWT work on a cold start.

### FR-2 — Trigger search (`GET /triggers`)
`searchConnectedTriggers(userId, search)` returns the trigger types on the user's **ACTIVE**
connections, filtered by `search` (case-insensitive, over name or slug). No active
connections → `[]`. Stale per-toolkit trigger caches are refreshed from Composio at most
once per `CACHE_TTL_MS` and re-named from the live toolkit catalog. The handler defaults a
missing `search` to `''`; any thrown error → `502 { message: 'Failed to search triggers' }`
(without leaking the cause). Success → `200 { triggers }`.

### FR-3 — Prompt flattening (`blocknoteText.ts`)
`blocksToPlainText(blocks)` is a **pure** extractor turning a BlockNote block-array prompt
into plain text for Claude: visible text of each block's `content` (string or inline-item
array), a link's visible text but **never** its href, `children` blocks recursed and
newline-joined, empty/malformed blocks dropped.

### FR-4 — Gate (`gate.ts`)
`evaluateTriggerGate(userId, triggerDescription, payload)`:
- An empty / whitespace description → `{ passed: true, reasoning: 'No trigger description set
  — treated as always matching.' }`, calling no client.
- Otherwise offer Claude (Haiku, `tool_choice: 'any'`) the investigative tools of **only the
  toolkit the event came from** (case-insensitive) plus a `submit_gate_decision` tool. Execute
  requested tools via Composio and feed results back. Hallucinated tool names and Composio
  "not found" results are answered locally and do **not** consume the investigation budget;
  genuine results / errors do. On `submit_gate_decision`, return `{ passed, reasoning }`
  (throwing on a malformed decision payload). If the budget is exhausted with no decision,
  **fail closed**. An Anthropic client error propagates.

### FR-5 — Executor (`executor.ts`)
`runPlaybookPrompt(playbook, payload)` drives a bounded tool-use loop against `playbook.model` with
the user's connected tools (or none). It stops and returns `{ response, toolCalls }` on the
first non-`tool_use` turn; dispatches declared tool calls to Composio (recording each as
`{ name, input, output }`); answers hallucinated tool names locally without calling Composio;
records Composio/thrown errors as the tool `output` rather than throwing; propagates an
Anthropic client error; and at the iteration cap degrades to `{ response: '', toolCalls }`.

### FR-6 — Processor (`processor.ts`)
`processPlaybooksForTrigger(payload)` matches playbooks (`findPlaybooksByTrigger`) and processes each
**independently** — one playbook's failure never stops the others. Per playbook: `createRun` in
`running` (skip the playbook entirely if createRun throws); gate; on not-passed → `gated_out`; on
passed → record `gateReasoning`, execute, → `completed`, or on execution error → `failed`. A
gate that itself throws marks the existing run `failed`; a failure while recording the failure
is swallowed.

### FR-7 — Run persistence (`runsRepo.ts`, collection `playbook_runs`)
`createRun` inserts a `running` run with a generated `id` and empty `toolCalls`. `updateRun`
applies a `$set` by `id` and returns the stripped doc (or null). `listRunsForPlaybook(userId,
playbookId)` returns the user's runs for that playbook, newest first. `getRun(userId, id)` is scoped
to the caller. All reads strip Mongo's `_id`.

### FR-8 — Run history (`GET /playbooks/{id}/runs[/{runId}]`)
Both resolve the Playbook via `findPlaybook(userId, id)` (a missing path param short-circuits to
404 without a repo call; a null Playbook → `404 { message: 'Not found' }`). List returns
`200 { runs }`. Get additionally requires the run to exist **and** belong to the Playbook
(`run.playbookId === playbook.id`) — otherwise `404` — guarding against reading a run through the
wrong Playbook's URL. Success → `200 { run }`.

### FR-9 — Async worker + invoker
`playbookProcessorWorker` delegates the payload to `processPlaybooksForTrigger` and is **left to
throw** on failure so Lambda retries the async invocation. `invokePlaybookProcessorAsync` throws
if `PLAYBOOK_PROCESSOR_FUNCTION_NAME` is unset, else sends an `InvocationType: 'Event'` invoke.

### FR-10 — Trigger activation (`triggerActivation.ts`)
`syncPlaybookTrigger` / `deactivatePlaybookTrigger` reconcile a Playbook's live Composio trigger
instance. Instances are shared per `(user, slug)`, so an instance is only torn down once no
other live Playbook references the slug (ignoring the Playbook's own id). Creating a new instance
propagates failures; deleting an old one swallows them.

## Non-functional requirements

- TypeScript strict; `npm run typecheck` and `npm run lint` clean.
- Keep every file path and export signature. Do not add or remove exports.
- Do not modify the provided files, `src/base/**`, or `src/interfaces/**`.
- No new runtime dependencies without written justification.

See [specifications.md](specifications.md) for exact Anthropic/Composio/Mongo calls and
[features/](features/) for the executable acceptance scenarios.
