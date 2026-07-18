// Provided acceptance suite — do not modify.
// Executes docs/features/prompt-execution.feature against your runPlaybookPrompt.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { jest, expect, beforeEach } from '@jest/globals';
import type { IncomingTriggerPayload } from '@composio/core';
import type { Playbook } from '../src/interfaces/playbook-config';
import type { PlaybookRunToolCall } from '../src/interfaces/playbook';

const feature = loadFeature('docs/features/prompt-execution.feature');

const mockCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockExecute = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetActiveToolkitSlugs = jest.fn<(userId: string) => Promise<string[]>>();
const mockGetAnthropicToolsForToolkits = jest.fn<(slugs: string[]) => Promise<unknown[]>>();
const mockBlocksToPlainText = jest.fn<(blocks: unknown[]) => string>();

jest.mock('../src/components/playbook/anthropicClient', () => ({
  getAnthropicClient: jest.fn(() => ({ messages: { create: mockCreate } })),
}));
jest.mock('../src/components/connectors/composioClient', () => ({
  getComposioClient: jest.fn(() => ({ tools: { execute: mockExecute } })),
}));
jest.mock('../src/components/playbook/tools', () => ({
  getActiveToolkitSlugs: mockGetActiveToolkitSlugs,
  getAnthropicToolsForToolkits: mockGetAnthropicToolsForToolkits,
}));
jest.mock('../src/components/playbook/blocknoteText', () => ({ blocksToPlainText: mockBlocksToPlainText }));

import { runPlaybookPrompt } from '../src/components/playbook/executor';

const playbook: Playbook = {
  id: 'playbook-1',
  userId: 'user-1',
  title: 'Reply to urgent emails',
  trigger: { slug: 'GMAIL_NEW_GMAIL_MESSAGE', toolkit: 'GMAIL', name: 'New email' },
  triggerInstanceId: 'ti-1',
  triggerDescription: '',
  prompt: [{ type: 'paragraph', content: 'Do the thing.' }],
  model: 'claude-sonnet-5',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

const payload = {
  id: 'evt_1',
  triggerSlug: 'GMAIL_NEW_GMAIL_MESSAGE',
  toolkitSlug: 'GMAIL',
  userId: 'user-1',
  payload: { subject: 'Urgent!' },
} as unknown as IncomingTriggerPayload;

function textMessage(text: string) {
  return { stop_reason: 'end_turn', content: [{ type: 'text', text }] };
}
function toolUseMessage(id: string, name: string, input: Record<string, unknown>) {
  return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id, name, input }] };
}

const ctx: { result: { response: string; toolCalls: PlaybookRunToolCall[] } | null } = { result: null };

beforeEach(() => {
  mockCreate.mockReset();
  mockExecute.mockReset().mockResolvedValue({ data: { messageId: 'm_1' }, error: undefined });
  mockGetActiveToolkitSlugs.mockReset().mockResolvedValue([]);
  mockGetAnthropicToolsForToolkits.mockReset().mockResolvedValue([]);
  mockBlocksToPlainText.mockReset().mockReturnValue('Do the thing.');
  ctx.result = null;
});

// ---- reusable step callbacks ----
const noActiveToolkits = () => {
  mockGetActiveToolkitSlugs.mockResolvedValue([]);
  mockGetAnthropicToolsForToolkits.mockResolvedValue([]);
};
const toolAvailable = (name: string) => {
  mockGetActiveToolkitSlugs.mockResolvedValue(['GMAIL']);
  mockGetAnthropicToolsForToolkits.mockResolvedValue([
    { name, description: '', input_schema: { type: 'object', properties: {} } },
  ]);
};
const modelRepliesStops = (text: string) => {
  mockCreate.mockResolvedValue(textMessage(text));
};
const modelCallsThenReplies = (toolName: string, text: string) => {
  mockCreate
    .mockResolvedValueOnce(toolUseMessage('tu_1', toolName, { to: 'a@b.com' }))
    .mockResolvedValueOnce(textMessage(text));
};
const modelAlwaysRequests = () => {
  mockCreate.mockImplementation(async () =>
    toolUseMessage(`tu_${mockCreate.mock.calls.length}`, 'GMAIL_SEND_EMAIL', {}),
  );
};
const toolReturnsData = () => {
  mockExecute.mockResolvedValue({ data: { messageId: 'm_1' }, error: undefined });
};
const runPrompt = async () => {
  ctx.result = await runPlaybookPrompt(playbook, payload);
};
const assertResponse = (text: string) => {
  expect(ctx.result?.response).toBe(text);
};
const assertNoToolsExecuted = () => {
  expect(mockExecute).not.toHaveBeenCalled();
};
const assertOneToolFor = (name: string) => {
  expect(ctx.result?.toolCalls).toHaveLength(1);
  expect(ctx.result?.toolCalls[0]?.name).toBe(name);
};
const assertModelTimes = (n: string) => {
  expect(mockCreate).toHaveBeenCalledTimes(Number(n));
};
const assertToolErrorNames = (name: string) => {
  expect(ctx.result?.toolCalls).toHaveLength(1);
  const output = ctx.result?.toolCalls[0]?.output as { error: string };
  expect(output.error).toContain(name);
};
const assertNToolCalls = (n: string) => {
  expect(ctx.result?.toolCalls).toHaveLength(Number(n));
};

const NO_TOOLKITS = 'the user has no active toolkits';
const TOOL_AVAILABLE = /^the user has the "([^"]*)" tool available$/;
const MODEL_STOPS = /^the model replies "([^"]*)" and stops$/;
const CALLS_THEN_REPLIES = /^the model calls "([^"]*)" then replies "([^"]*)" and stops$/;
const ALWAYS_REQUESTS = 'the model always requests the tool and never stops';
const TOOL_RETURNS = 'the tool returns data';
const RUN = 'the playbook prompt is run';
const RESPONSE = /^the run response is "([^"]*)"$/;
const NO_TOOLS = 'no tools were executed';
const ONE_TOOL_FOR = /^one tool call was recorded for "([^"]*)"$/;
const MODEL_TIMES = /^the model was called (\d+) times?$/;
const ONE_TOOL_ERROR = /^one tool call was recorded whose output error names "([^"]*)"$/;
const N_TOOL_CALLS = /^(\d+) tool calls were recorded$/;

defineFeature(feature, (test) => {
  test('The model stops immediately and returns its text with no tool calls', ({ given, and, when, then }) => {
    given(NO_TOOLKITS, noActiveToolkits);
    and(MODEL_STOPS, modelRepliesStops);
    when(RUN, runPrompt);
    then(RESPONSE, assertResponse);
    and(NO_TOOLS, assertNoToolsExecuted);
  });

  test('A declared tool is executed and the model then finishes', ({ given, and, when, then }) => {
    given(TOOL_AVAILABLE, toolAvailable);
    and(CALLS_THEN_REPLIES, modelCallsThenReplies);
    and(TOOL_RETURNS, toolReturnsData);
    when(RUN, runPrompt);
    then(RESPONSE, assertResponse);
    and(ONE_TOOL_FOR, assertOneToolFor);
    and(MODEL_TIMES, assertModelTimes);
  });

  test('A hallucinated tool name is rejected locally without calling Composio', ({ given, and, when, then }) => {
    given(TOOL_AVAILABLE, toolAvailable);
    and(CALLS_THEN_REPLIES, modelCallsThenReplies);
    when(RUN, runPrompt);
    then(NO_TOOLS, assertNoToolsExecuted);
    and(ONE_TOOL_ERROR, assertToolErrorNames);
  });

  test('The loop degrades to a partial result at the iteration cap', ({ given, and, when, then }) => {
    given(TOOL_AVAILABLE, toolAvailable);
    and(ALWAYS_REQUESTS, modelAlwaysRequests);
    and(TOOL_RETURNS, toolReturnsData);
    when(RUN, runPrompt);
    then(RESPONSE, assertResponse);
    and(MODEL_TIMES, assertModelTimes);
    and(N_TOOL_CALLS, assertNToolCalls);
  });
});
