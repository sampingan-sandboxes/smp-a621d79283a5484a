import type { IncomingTriggerPayload } from '@composio/core';
import { getAnthropicClient } from './anthropicClient';
import { getComposioClient } from '../connectors/composioClient';
import { getActiveToolkitSlugs, getAnthropicToolsForToolkits } from './tools';
import { blocksToPlainText } from './blocknoteText';
import type { Playbook } from '../../interfaces/playbook-config';
import type { PlaybookRunToolCall } from '../../interfaces/playbook';

/**
 * YOUR TASK — implement `runPlaybookPrompt`: run the Playbook's prompt against Claude with the
 * user's connected tools, driving a bounded tool-use loop, and return the final assistant
 * text plus the list of tool calls made.
 *
 * Contract:
 * - Resolve the user's tools: `getActiveToolkitSlugs(playbook.userId)` →
 *   `getAnthropicToolsForToolkits(...)`. Pass them to the API as the `tools` array, or
 *   `undefined` when there are none.
 * - Build the first user turn from `blocksToPlainText(playbook.prompt)` plus the trigger
 *   event context (`payload.payload ?? {}`, JSON-stringified — default to `{}` when absent).
 * - Loop up to a fixed iteration cap, calling
 *   `getAnthropicClient().messages.create({ model: playbook.model, max_tokens, messages, tools })`:
 *   - When `stop_reason !== 'tool_use'`, return `{ response: <joined text blocks>, toolCalls }`.
 *   - Otherwise dispatch every `tool_use` block to
 *     `getComposioClient().tools.execute(name, { userId: playbook.userId, arguments,
 *     dangerouslySkipVersionCheck: true })`, appending `{ name, input, output }` to
 *     `toolCalls` and feeding a matching `tool_result` back into the conversation. A tool
 *     name that was never declared (hallucinated) is answered locally WITHOUT calling
 *     Composio; a Composio-reported error or a thrown execution error is recorded as the
 *     tool's `output` (never thrown out of the loop).
 * - Propagate an error thrown by the Anthropic `messages.create` call itself.
 * - If the iteration cap is hit without a natural stop, degrade to a partial result:
 *   `{ response: '', toolCalls }` (do NOT throw).
 */
export async function runPlaybookPrompt(
  _playbook: Playbook,
  _payload: IncomingTriggerPayload,
): Promise<{ response: string; toolCalls: PlaybookRunToolCall[] }> {
  void getAnthropicClient;
  void getComposioClient;
  void getActiveToolkitSlugs;
  void getAnthropicToolsForToolkits;
  void blocksToPlainText;
  throw new Error('NotImplemented');
}
