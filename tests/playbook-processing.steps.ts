// Provided acceptance suite — do not modify.
// Executes docs/features/playbook-processing.feature against your processPlaybooksForTrigger.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { jest, expect, beforeEach } from '@jest/globals';
import type { IncomingTriggerPayload } from '@composio/core';
import type { Playbook } from '../src/interfaces/playbook-config';
import type { PlaybookRun, PlaybookRunToolCall } from '../src/interfaces/playbook';

const feature = loadFeature('docs/features/playbook-processing.feature');

const mockFindPlaybooksByTrigger = jest.fn<(userId: string, triggerSlug: string) => Promise<Playbook[]>>();
const mockEvaluateTriggerGate = jest.fn<(...args: unknown[]) => Promise<{ passed: boolean; reasoning: string }>>();
const mockRunPlaybookPrompt =
  jest.fn<(...args: unknown[]) => Promise<{ response: string; toolCalls: PlaybookRunToolCall[] }>>();
const mockCreateRun = jest.fn<(...args: unknown[]) => Promise<PlaybookRun>>();
const mockUpdateRun = jest.fn<(...args: unknown[]) => Promise<PlaybookRun | null>>();

jest.mock('../src/components/playbook-config/repo', () => ({ findPlaybooksByTrigger: mockFindPlaybooksByTrigger }));
jest.mock('../src/components/playbook/gate', () => ({ evaluateTriggerGate: mockEvaluateTriggerGate }));
jest.mock('../src/components/playbook/executor', () => ({ runPlaybookPrompt: mockRunPlaybookPrompt }));
jest.mock('../src/components/playbook/runsRepo', () => ({ createRun: mockCreateRun, updateRun: mockUpdateRun }));

import { processPlaybooksForTrigger } from '../src/components/playbook/processor';

function playbook(id: string): Playbook {
  return {
    id,
    userId: 'user-1',
    title: `Playbook ${id}`,
    trigger: { slug: 'GMAIL_NEW_GMAIL_MESSAGE', toolkit: 'GMAIL', name: 'New email' },
    triggerInstanceId: 'ti-1',
    triggerDescription: 'When an urgent email arrives',
    prompt: [],
    model: 'claude-sonnet-5',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
  };
}
function run(id: string, playbookId: string): PlaybookRun {
  return {
    id,
    playbookId,
    userId: 'user-1',
    triggerSlug: 'GMAIL_NEW_GMAIL_MESSAGE',
    toolkitSlug: 'GMAIL',
    webhookEventId: 'evt_1',
    triggerPayload: {},
    model: 'claude-sonnet-5',
    status: 'running',
    toolCalls: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
}
const payload = {
  id: 'evt_1',
  triggerSlug: 'GMAIL_NEW_GMAIL_MESSAGE',
  toolkitSlug: 'GMAIL',
  userId: 'user-1',
  payload: { subject: 'Urgent!' },
} as unknown as IncomingTriggerPayload;

beforeEach(() => {
  mockFindPlaybooksByTrigger.mockReset().mockResolvedValue([]);
  mockEvaluateTriggerGate.mockReset().mockResolvedValue({ passed: true, reasoning: 'matches' });
  mockRunPlaybookPrompt.mockReset().mockResolvedValue({ response: 'done', toolCalls: [] });
  mockCreateRun.mockReset();
  mockUpdateRun.mockReset().mockResolvedValue(null);
});

// ---- reusable step callbacks ----
const noMatch = () => {
  mockFindPlaybooksByTrigger.mockResolvedValue([]);
};
const oneMatch = (id: string) => {
  mockFindPlaybooksByTrigger.mockResolvedValue([playbook(id)]);
  mockCreateRun.mockResolvedValue(run('r1', id));
};
const twoMatch = (id1: string, id2: string) => {
  mockFindPlaybooksByTrigger.mockResolvedValue([playbook(id1), playbook(id2)]);
  mockCreateRun.mockResolvedValueOnce(run('r1', id1)).mockResolvedValueOnce(run('r2', id2));
};
const gatePasses = (reasoning: string) => {
  mockEvaluateTriggerGate.mockResolvedValue({ passed: true, reasoning });
};
const gateFails = (reasoning: string) => {
  mockEvaluateTriggerGate.mockResolvedValue({ passed: false, reasoning });
};
const executorReturns = (response: string) => {
  mockRunPlaybookPrompt.mockResolvedValue({ response, toolCalls: [] });
};
const executorThrows = () => {
  mockRunPlaybookPrompt.mockRejectedValue(new Error('anthropic down'));
};
const firstThrowsSecondSucceeds = () => {
  mockRunPlaybookPrompt
    .mockRejectedValueOnce(new Error('boom'))
    .mockResolvedValueOnce({ response: 'ok', toolCalls: [] });
};
const processStep = async () => {
  await processPlaybooksForTrigger(payload);
};
const assertNoRun = () => {
  expect(mockCreateRun).not.toHaveBeenCalled();
};
const assertRunStatus = (runId: string, status: string) => {
  expect(mockUpdateRun).toHaveBeenCalledWith(runId, expect.objectContaining({ status }));
};
const assertExecutorFor = (id: string) => {
  expect(mockRunPlaybookPrompt).toHaveBeenCalledWith(expect.objectContaining({ id }), payload);
};
const assertExecutorNotRun = () => {
  expect(mockRunPlaybookPrompt).not.toHaveBeenCalled();
};

const NO_MATCH = 'no playbook matches the trigger';
const ONE_MATCH = /^a playbook "([^"]*)" matches the trigger$/;
const TWO_MATCH = /^two playbooks "([^"]*)" and "([^"]*)" match the trigger$/;
const GATE_PASSES = /^the gate passes with reasoning "([^"]*)"$/;
const GATE_FAILS = /^the gate does not pass with reasoning "([^"]*)"$/;
const EXEC_RETURNS = /^the executor returns response "([^"]*)"$/;
const EXEC_THROWS = 'the executor throws';
const FIRST_THROWS = 'the first execution throws and the second succeeds';
const PROCESS = 'the trigger is processed';
const NO_RUN = 'no run was created';
const RUN_STATUS = /^the run "([^"]*)" was updated to status "([^"]*)"$/;
const EXEC_FOR = /^the executor was run for playbook "([^"]*)"$/;
const EXEC_NOT_RUN = 'the executor was not run';

defineFeature(feature, (test) => {
  test('No run is created when nothing matches the trigger', ({ given, when, then }) => {
    given(NO_MATCH, noMatch);
    when(PROCESS, processStep);
    then(NO_RUN, assertNoRun);
  });

  test('A passing gate executes the playbook and completes the run', ({ given, and, when, then }) => {
    given(ONE_MATCH, oneMatch);
    and(GATE_PASSES, gatePasses);
    and(EXEC_RETURNS, executorReturns);
    when(PROCESS, processStep);
    then(RUN_STATUS, assertRunStatus);
    and(EXEC_FOR, assertExecutorFor);
  });

  test('A failing gate marks the run gated_out and skips execution', ({ given, and, when, then }) => {
    given(ONE_MATCH, oneMatch);
    and(GATE_FAILS, gateFails);
    when(PROCESS, processStep);
    then(RUN_STATUS, assertRunStatus);
    and(EXEC_NOT_RUN, assertExecutorNotRun);
  });

  test('An execution failure marks the run failed', ({ given, and, when, then }) => {
    given(ONE_MATCH, oneMatch);
    and(GATE_PASSES, gatePasses);
    and(EXEC_THROWS, executorThrows);
    when(PROCESS, processStep);
    then(RUN_STATUS, assertRunStatus);
  });

  test("One playbook's failure does not stop the others", ({ given, and, when, then }) => {
    given(TWO_MATCH, twoMatch);
    and(FIRST_THROWS, firstThrowsSecondSucceeds);
    when(PROCESS, processStep);
    then(RUN_STATUS, assertRunStatus);
    and(RUN_STATUS, assertRunStatus);
  });
});
