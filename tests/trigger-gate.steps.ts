// Provided acceptance suite — do not modify.
// Executes docs/features/trigger-gate.feature against your evaluateTriggerGate.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { jest, expect, beforeEach } from '@jest/globals';
import type { IncomingTriggerPayload } from '@composio/core';

const feature = loadFeature('docs/features/trigger-gate.feature');

const mockCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockExecute = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetActiveToolkitSlugs = jest.fn<(userId: string) => Promise<string[]>>();
const mockGetAnthropicToolsForToolkits = jest.fn<(slugs: string[]) => Promise<unknown[]>>();

// The real @composio/core is ESM-only; the gate treats a Composio "tool not found" failure
// specially via instanceof, so the fake must be a genuine subclass.
class FakeComposioToolNotFoundError extends Error {}

jest.mock('@composio/core', () => ({ ComposioToolNotFoundError: FakeComposioToolNotFoundError }));
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

import { evaluateTriggerGate } from '../src/components/playbook/gate';

const basePayload = {
  id: 'evt_1',
  triggerSlug: 'SLACK_NEW_MESSAGE',
  toolkitSlug: 'SLACK',
  userId: 'user-1',
  payload: { channel: 'C1', user: 'U1' },
} as unknown as IncomingTriggerPayload;

function submitResponse(matches: boolean, reasoning: string) {
  return { content: [{ type: 'tool_use', id: 'tu_1', name: 'submit_gate_decision', input: { matches, reasoning } }] };
}
function toolUseResponse(name: string, id = 'tu_x') {
  return { content: [{ type: 'tool_use', id, name, input: {} }] };
}

const ctx: { description: string; result: { passed: boolean; reasoning: string } | null } = {
  description: '',
  result: null,
};

beforeEach(() => {
  mockCreate.mockReset();
  mockExecute.mockReset().mockResolvedValue({ data: { ok: true }, error: null });
  mockGetActiveToolkitSlugs.mockReset().mockResolvedValue(['SLACK']);
  mockGetAnthropicToolsForToolkits.mockReset().mockResolvedValue([]);
  ctx.description = '';
  ctx.result = null;
});

// ---- reusable step callbacks ----
const descriptionEmpty = () => {
  ctx.description = '';
};
const activeToolkits = (csv: string) => {
  mockGetActiveToolkitSlugs.mockResolvedValue(csv.split(','));
};
const toolAvailable = (name: string) => {
  mockGetAnthropicToolsForToolkits.mockResolvedValue([
    { name, description: '', input_schema: { type: 'object', properties: {} } },
  ]);
};
const modelSubmits = (matches: string, reasoning: string) => {
  mockCreate.mockResolvedValue(submitResponse(matches === 'true', reasoning));
};
const modelCallsThenSubmits = (toolName: string, matches: string, reasoning: string) => {
  mockCreate
    .mockResolvedValueOnce(toolUseResponse(toolName, 'tu_1'))
    .mockResolvedValueOnce(submitResponse(matches === 'true', reasoning));
};
const modelKeepsCalling = (toolName: string) => {
  mockCreate.mockResolvedValue(toolUseResponse(toolName, 'tu_repeat'));
};
const toolReturnsData = () => {
  mockExecute.mockResolvedValue({ data: { name: 'Jane Doe' }, error: null });
};
const evaluate = async () => {
  ctx.result = await evaluateTriggerGate('user-1', ctx.description, basePayload);
};
const evaluateWithDescription = async (description: string) => {
  ctx.description = description;
  ctx.result = await evaluateTriggerGate('user-1', description, basePayload);
};
const assertPasses = () => {
  expect(ctx.result?.passed).toBe(true);
};
const assertNotPasses = () => {
  expect(ctx.result?.passed).toBe(false);
};
const assertReasoning = (reasoning: string) => {
  expect(ctx.result?.reasoning).toBe(reasoning);
};
const assertModelNotCalled = () => {
  expect(mockCreate).not.toHaveBeenCalled();
};
const assertModelCalledTimes = (n: string) => {
  expect(mockCreate).toHaveBeenCalledTimes(Number(n));
};
const assertToolExecutedOnce = () => {
  expect(mockExecute).toHaveBeenCalledTimes(1);
};

const DESC_EMPTY = 'the trigger description is empty';
const ACTIVE = /^the active toolkits are "([^"]*)"$/;
const TOOL_AVAILABLE = /^an investigative tool "([^"]*)" is available$/;
const SUBMITS = /^the gate model will submit matches "([^"]*)" with reasoning "([^"]*)"$/;
const CALLS_THEN_SUBMITS =
  /^the gate model calls "([^"]*)" then submits matches "([^"]*)" with reasoning "([^"]*)"$/;
const KEEPS_CALLING = /^the gate model keeps calling "([^"]*)" without ever deciding$/;
const TOOL_RETURNS = 'the tool returns data';
const EVALUATE = 'the gate is evaluated';
const EVALUATE_DESC = /^the gate is evaluated with description "([^"]*)"$/;
const PASSES = 'the gate passes';
const NOT_PASSES = 'the gate does not pass';
const REASONING = /^the gate reasoning is "([^"]*)"$/;
const MODEL_NOT_CALLED = 'the Anthropic model was not called';
const MODEL_TIMES = /^the Anthropic model was called (\d+) times?$/;
const TOOL_ONCE = 'the tool was executed once';

defineFeature(feature, (test) => {
  test('An empty description is treated as always matching without calling the model', ({
    given,
    when,
    then,
    and,
  }) => {
    given(DESC_EMPTY, descriptionEmpty);
    when(EVALUATE, evaluate);
    then(PASSES, assertPasses);
    and(REASONING, assertReasoning);
    and(MODEL_NOT_CALLED, assertModelNotCalled);
  });

  test('The model submits a match on the first turn', ({ given, and, when, then }) => {
    given(ACTIVE, activeToolkits);
    and(SUBMITS, modelSubmits);
    when(EVALUATE_DESC, evaluateWithDescription);
    then(PASSES, assertPasses);
    and(REASONING, assertReasoning);
    and(MODEL_TIMES, assertModelCalledTimes);
  });

  test('The model submits a non-match', ({ given, and, when, then }) => {
    given(ACTIVE, activeToolkits);
    and(SUBMITS, modelSubmits);
    when(EVALUATE_DESC, evaluateWithDescription);
    then(NOT_PASSES, assertNotPasses);
    and(REASONING, assertReasoning);
  });

  test('One investigative tool round precedes the decision', ({ given, and, when, then }) => {
    given(ACTIVE, activeToolkits);
    and(TOOL_AVAILABLE, toolAvailable);
    and(CALLS_THEN_SUBMITS, modelCallsThenSubmits);
    and(TOOL_RETURNS, toolReturnsData);
    when(EVALUATE_DESC, evaluateWithDescription);
    then(PASSES, assertPasses);
    and(TOOL_ONCE, assertToolExecutedOnce);
    and(MODEL_TIMES, assertModelCalledTimes);
  });

  test('The gate fails closed when the investigation budget is exhausted', ({ given, and, when, then }) => {
    given(ACTIVE, activeToolkits);
    and(TOOL_AVAILABLE, toolAvailable);
    and(KEEPS_CALLING, modelKeepsCalling);
    and(TOOL_RETURNS, toolReturnsData);
    when(EVALUATE_DESC, evaluateWithDescription);
    then(NOT_PASSES, assertNotPasses);
    and(REASONING, assertReasoning);
    and(MODEL_TIMES, assertModelCalledTimes);
  });
});
