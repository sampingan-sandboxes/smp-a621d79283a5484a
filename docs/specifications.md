# Module Specification — playbook

## Files you implement

```
src/components/playbook/
├── anthropicClient.ts     getAnthropicClient(): Anthropic                         (cached)
├── tools.ts               getActiveToolkitSlugs / getAnthropicToolsForToolkits
├── blocknoteText.ts       blocksToPlainText(blocks): string                       (PURE)
├── gate.ts                evaluateTriggerGate(userId, triggerDescription, payload)
├── executor.ts            runPlaybookPrompt(playbook, payload)
├── processor.ts           processPlaybooksForTrigger(payload)
├── processorInvoker.ts    invokePlaybookProcessorAsync(payload)
├── runsRepo.ts            createRun / updateRun / listRunsForPlaybook / getRun      (coll 'playbook_runs')
├── triggerActivation.ts   syncPlaybookTrigger / deactivatePlaybookTrigger
├── triggers.ts            searchConnectedTriggers / resolvePlaybookTrigger / resolvePlaybookTriggers
└── handlers/
    ├── triggers.ts             GET  /triggers
    ├── playbookProcessorWorker.ts (async Lambda invoke target)
    ├── playbookRunsList.ts        GET  /playbooks/{id}/runs
    └── playbookRunsGet.ts         GET  /playbooks/{id}/runs/{runId}
```

## Provided — do not modify

| File | Role |
|------|------|
| `src/base/http.ts` | `jsonResponse(statusCode, body)` |
| `src/base/handlers/health.ts` | `GET /health` (keeps `npm run dev` bootable) |
| `src/interfaces/playbook.ts` | `PlaybookRun`, `StoredPlaybookRun`, `PlaybookRunToolCall`, `PlaybookRunStatus`, `GateDecision`, BlockNote inline shapes, `ToolkitTriggerEntries`, `RawTriggerTypesPage` |
| `src/interfaces/playbook-config.ts` | `Playbook`, `StoredPlaybook`, `PlaybookTrigger`, `PlaybookModel` |
| `src/interfaces/connectors.ts` | `ConnectorConnection`, `ToolkitCatalogEntry`, `TriggerTypeEntry`, … |
| `src/components/auth/verifyToken.ts` | **stub** `getAuthenticatedUserId`, `getAuthHeader` |
| `src/components/mongo/client.ts` | **stub** `getDb(): Promise<Db>` |
| `src/components/connectors/composioClient.ts` | **stub** `getComposioClient()` (cached real client) |
| `src/components/connectors/connectorsRepo.ts` | **stub** `listConnections` |
| `src/components/connectors/toolkitsRepo.ts` | **stub** `getStaleToolkits`, `upsertTriggerEntries`, `getTriggersForToolkits` |
| `src/components/connectors/toolkitCatalog.ts` | **stub** `CACHE_TTL_MS`, `getToolkitCatalog` |
| `src/components/connectors/composioTriggers.ts` | **stub** `createTriggerInstance`, `deleteTriggerInstance` |
| `src/components/playbook-config/repo.ts` | **stub** `findPlaybook`, `findPlaybooksByTrigger` |

The connectors / playbook-config stubs expose only the members this module imports, with minimal
bodies. The acceptance suites mock them, so their bodies only run under `npm run dev`.

## Anthropic calls (via `@anthropic-ai/sdk`)

| Function | Call |
|----------|------|
| `getAnthropicClient` | `new Anthropic({ apiKey: ANTHROPIC_API_KEY })`, cached |
| gate turn | `messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages, tools, tool_choice: { type: 'any' } })` |
| executor turn | `messages.create({ model: playbook.model, max_tokens: 4096, messages, tools })` |

## Composio calls (via `@composio/core`)

| Function | Call |
|----------|------|
| `getAnthropicToolsForToolkits` | `getComposioClient().tools.getRawComposioTools({ toolkits })` → map to `Anthropic.Tool` |
| gate / executor tool exec | `getComposioClient().tools.execute(name, { userId, arguments, dangerouslySkipVersionCheck: true })` |
| trigger-type paging | `getComposioClient().triggers.listTypes({ toolkits, limit, cursor })` following `nextCursor` |
| `createTriggerInstance` / `deleteTriggerInstance` | provided stub |

`ComposioToolNotFoundError` (a `@composio/core` export) is caught by the gate via `instanceof`
to treat a declared-but-unfindable tool as a non-budget-consuming attempt.

## Mongo collections

| Collection | Module | Key |
|------------|--------|-----|
| `playbook_runs` | runsRepo | `id` (generated UUID); reads scoped by `userId` |

## Budgets / constants

| Constant | Value | Where |
|----------|-------|-------|
| gate max investigative tool calls | 4 | `gate.ts` |
| gate max loop passes (incl. free retries) | 12 | `gate.ts` |
| executor max tool-use iterations | 8 | `executor.ts` |
| trigger cache TTL | `CACHE_TTL_MS` (1h) | `connectors/toolkitCatalog` |

## Response contract summary

| Endpoint | Success | Notable errors |
|----------|---------|----------------|
| GET /triggers | 200 `{ triggers }` | 401, 502 `Failed to search triggers` |
| GET /playbooks/{id}/runs | 200 `{ runs }` | 401, 404 `Not found` |
| GET /playbooks/{id}/runs/{runId} | 200 `{ run }` | 401, 404 `Not found` (missing playbook, missing run, or run not owned by the playbook) |

## Acceptance

The features in [features/](features/) run via jest-cucumber suites under
`tests/`, mocking the collaborating modules so no real Anthropic /
Composio / Mongo is required. They cover the interesting behavior (pure flattening, the gate
and executor loops, processor orchestration, run persistence, trigger resolution, and the HTTP
handlers). Your own `*.test.ts` unit tests must cover the rest to reach **100%** coverage.
