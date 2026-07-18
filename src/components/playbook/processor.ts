import type { IncomingTriggerPayload } from '@composio/core';
import { findPlaybooksByTrigger } from '../playbook-config/repo';
import { evaluateTriggerGate } from './gate';
import { runPlaybookPrompt } from './executor';
import { createRun, updateRun } from './runsRepo';

/**
 * YOUR TASK — implement `processPlaybooksForTrigger`: the orchestration entry point run by
 * the async worker Lambda. Match the playbooks subscribed to this trigger and process each
 * one INDEPENDENTLY — one playbook's failure must never stop the others.
 *
 * For the incoming `payload`:
 * - Find matches via `findPlaybooksByTrigger(payload.userId, payload.triggerSlug)`.
 * - For each matched playbook:
 *   1. `createRun({ playbookId, userId, triggerSlug, toolkitSlug, webhookEventId: payload.id,
 *      triggerPayload: payload.payload ?? {}, model, createdAt: new Date() })` — created in
 *      'running' status BEFORE the gate runs, so a record exists from the start. If
 *      createRun itself throws, skip this playbook entirely (no run to update) but continue
 *      with the rest.
 *   2. `evaluateTriggerGate(playbook.userId, playbook.triggerDescription, payload)`.
 *      - Not passed → `updateRun(run.id, { status: 'gated_out', gateReasoning,
 *        completedAt })` and skip execution.
 *      - Passed → record the reasoning first (`updateRun(run.id, { gateReasoning })`), then
 *        `runPlaybookPrompt(playbook, payload)` and `updateRun(run.id, { status: 'completed',
 *        response, toolCalls, completedAt })`. If execution throws, mark the run
 *        `{ status: 'failed', error: String(error), completedAt }` (do not rethrow).
 *   3. If the gate itself throws, mark the (already-created) run failed the same way. A
 *      further failure while recording the failure must also be swallowed.
 */
export async function processPlaybooksForTrigger(_payload: IncomingTriggerPayload): Promise<void> {
  void findPlaybooksByTrigger;
  void evaluateTriggerGate;
  void runPlaybookPrompt;
  void createRun;
  void updateRun;
  throw new Error('NotImplemented');
}
