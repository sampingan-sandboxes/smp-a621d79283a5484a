import type { IncomingTriggerPayload } from '@composio/core';
import { ComposioToolNotFoundError } from '@composio/core';
import { getAnthropicClient } from './anthropicClient';
import { getComposioClient } from '../connectors/composioClient';
import { getActiveToolkitSlugs, getAnthropicToolsForToolkits } from './tools';

/**
 * YOUR TASK — implement `evaluateTriggerGate`: a cheap pre-filter that decides whether an
 * incoming trigger event actually matches the user's stated criteria before the (more
 * expensive) executor runs. It drives a bounded Claude tool-use loop.
 *
 * Contract:
 * - If `triggerDescription` is empty / whitespace-only, return
 *   `{ passed: true, reasoning: 'No trigger description set — treated as always matching.' }`
 *   WITHOUT calling any client (no toolkit lookup, no Anthropic call).
 * - Otherwise gather the investigative tools: `getActiveToolkitSlugs(userId)` filtered to
 *   ONLY the toolkit the event came from (`payload.toolkitSlug`, compared case-insensitively),
 *   then `getAnthropicToolsForToolkits(...)`. Append a `submit_gate_decision` tool whose
 *   input is `{ matches: boolean, reasoning: string }`.
 * - Loop, calling `getAnthropicClient().messages.create({ model, max_tokens, messages,
 *   tools, tool_choice: { type: 'any' } })` with a Haiku model. On each turn:
 *   - If the model calls `submit_gate_decision`, validate the input has boolean `matches`
 *     and string `reasoning` (throw if not) and return `{ passed: matches, reasoning }`.
 *   - Otherwise execute each requested investigative tool via
 *     `getComposioClient().tools.execute(name, { userId, arguments, dangerouslySkipVersionCheck: true })`,
 *     feeding results back as `tool_result` blocks. A tool name that was never declared
 *     (hallucinated), or one Composio reports as not-found (`ComposioToolNotFoundError`),
 *     is answered locally and must NOT consume the investigative budget; genuine tool
 *     results / errors DO consume it.
 * - Cap the investigative budget (a handful of real tool calls). If it is exhausted with
 *   no decision, FAIL CLOSED: `{ passed: false, reasoning: 'Could not confirm the match
 *   within N investigative tool call(s).' }`.
 * - Propagate an error thrown by the Anthropic client (do not swallow it).
 *
 * (See the accompanying spec/diagrams for the exact prompt wording and budget constants;
 * the `GateDecision` shape lives in `../../interfaces/playbook`.)
 */
export async function evaluateTriggerGate(
  _userId: string,
  _triggerDescription: string,
  _payload: IncomingTriggerPayload,
): Promise<{ passed: boolean; reasoning: string }> {
  void ComposioToolNotFoundError;
  void getAnthropicClient;
  void getComposioClient;
  void getActiveToolkitSlugs;
  void getAnthropicToolsForToolkits;
  throw new Error('NotImplemented');
}
