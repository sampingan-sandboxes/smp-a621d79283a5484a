// Provided acceptance suite — do not modify.
// Executes docs/features/run-history-api.feature against your HTTP handlers.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { jest, expect, beforeEach } from '@jest/globals';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { Playbook, PlaybookTrigger } from '../src/interfaces/playbook-config';
import type { PlaybookRun } from '../src/interfaces/playbook';

const feature = loadFeature('docs/features/run-history-api.feature');

const mockGetAuthenticatedUserId = jest.fn<(event: unknown) => Promise<string | null>>();
const mockSearchConnectedTriggers = jest.fn<(userId: string, query: string) => Promise<PlaybookTrigger[]>>();
const mockFindPlaybook = jest.fn<(userId: string, id: string) => Promise<Playbook | null>>();
const mockGetRun = jest.fn<(userId: string, id: string) => Promise<PlaybookRun | null>>();
const mockListRunsForPlaybook = jest.fn<(userId: string, playbookId: string) => Promise<PlaybookRun[]>>();

jest.mock('../src/components/auth/verifyToken', () => ({
  getAuthenticatedUserId: mockGetAuthenticatedUserId,
  getAuthHeader: jest.fn(),
}));
jest.mock('../src/components/mongo/client', () => ({ getDb: jest.fn(async () => ({})) }));
jest.mock('../src/components/playbook/triggers', () => ({ searchConnectedTriggers: mockSearchConnectedTriggers }));
jest.mock('../src/components/playbook-config/repo', () => ({ findPlaybook: mockFindPlaybook }));
jest.mock('../src/components/playbook/runsRepo', () => ({ getRun: mockGetRun, listRunsForPlaybook: mockListRunsForPlaybook }));

import { handler as triggersHandler } from '../src/components/playbook/handlers/triggers';
import { handler as listHandler } from '../src/components/playbook/handlers/playbookRunsList';
import { handler as getHandler } from '../src/components/playbook/handlers/playbookRunsGet';

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;

function playbook(id: string): Playbook {
  return {
    id,
    userId: 'user-123',
    title: 'Untitled Playbook',
    trigger: null,
    triggerInstanceId: null,
    triggerDescription: '',
    prompt: [],
    model: 'claude-haiku-4-5-20251001',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}
function run(id: string, playbookId: string): PlaybookRun {
  return {
    id,
    playbookId,
    userId: 'user-123',
    triggerSlug: 'GMAIL_NEW_GMAIL_MESSAGE',
    toolkitSlug: 'gmail',
    webhookEventId: 'evt-1',
    triggerPayload: {},
    model: 'claude-haiku-4-5-20251001',
    status: 'completed',
    toolCalls: [],
    createdAt: new Date(),
  };
}
function trigger(slug: string): PlaybookTrigger {
  return { slug, toolkit: 'gmail', name: 'New email', toolkitName: 'Gmail', logo: 'https://logo/gmail' };
}

const ctx: { response: APIGatewayProxyStructuredResultV2 | null } = { response: null };
function body(): Record<string, unknown> {
  return JSON.parse(ctx.response?.body as string);
}

beforeEach(() => {
  [mockGetAuthenticatedUserId, mockSearchConnectedTriggers, mockFindPlaybook, mockGetRun, mockListRunsForPlaybook].forEach(
    (m) => m.mockReset(),
  );
  ctx.response = null;
});

// ---- reusable step callbacks ----
const notAuthed = () => {
  mockGetAuthenticatedUserId.mockResolvedValue(null);
};
const authedAs = (id: string) => {
  mockGetAuthenticatedUserId.mockResolvedValue(id);
};
const searchYields = (slug: string) => {
  mockSearchConnectedTriggers.mockResolvedValue([trigger(slug)]);
};
const searchFails = () => {
  mockSearchConnectedTriggers.mockRejectedValue(new Error('composio down'));
};
const playbookMissing = () => {
  mockFindPlaybook.mockResolvedValue(null);
};
const playbookExists = (id: string) => {
  mockFindPlaybook.mockResolvedValue(playbook(id));
};
const playbookHasNRuns = (n: string) => {
  mockListRunsForPlaybook.mockResolvedValue(Array.from({ length: Number(n) }, (_v, i) => run(`run-${i + 1}`, 'playbook-1')));
};
const runBelongsTo = (runId: string, playbookId: string) => {
  mockGetRun.mockResolvedValue(run(runId, playbookId));
};
const searchTriggersReq = async (term: string) => {
  ctx.response = await (triggersHandler as unknown as Handler)({
    headers: { authorization: 'Bearer token' },
    queryStringParameters: { search: term },
  } as unknown as APIGatewayProxyEventV2);
};
const listRunsReq = async (id: string) => {
  ctx.response = await (listHandler as unknown as Handler)({
    headers: { authorization: 'Bearer token' },
    pathParameters: { id },
  } as unknown as APIGatewayProxyEventV2);
};
const getRunReq = async (runId: string, id: string) => {
  ctx.response = await (getHandler as unknown as Handler)({
    headers: { authorization: 'Bearer token' },
    pathParameters: { id, runId },
  } as unknown as APIGatewayProxyEventV2);
};
const assertStatus = (status: string) => {
  expect(ctx.response?.statusCode).toBe(Number(status));
};
const assertMessage = (message: string) => {
  expect(body().message).toBe(message);
};
const assertTriggerCount = (n: string) => {
  expect((body().triggers as unknown[]).length).toBe(Number(n));
};
const assertRunsCount = (n: string) => {
  expect((body().runs as unknown[]).length).toBe(Number(n));
};
const assertRunId = (id: string) => {
  expect((body().run as { id: string }).id).toBe(id);
};

const NOT_AUTHED = 'the caller is not authenticated';
const AUTHED = /^the caller is authenticated as "([^"]*)"$/;
const SEARCH_YIELDS = /^the trigger search yields a "([^"]*)" trigger$/;
const SEARCH_FAILS = 'the trigger search fails';
const PLAYBOOK_MISSING = 'the playbook does not exist';
const PLAYBOOK_EXISTS = /^the playbook "([^"]*)" exists$/;
const PLAYBOOK_N_RUNS = /^the playbook has (\d+) stored runs$/;
const RUN_BELONGS = /^the run "([^"]*)" belongs to playbook "([^"]*)"$/;
const SEARCH_REQ = /^triggers are searched with term "([^"]*)"$/;
const LIST_REQ = /^runs are listed for playbook "([^"]*)"$/;
const GET_REQ = /^run "([^"]*)" is fetched for playbook "([^"]*)"$/;
const STATUS = /^the response status is (\d+)$/;
const MESSAGE = /^the response message is "([^"]*)"$/;
const TRIGGER_COUNT = /^the response body lists (\d+) trigger$/;
const RUNS_COUNT = /^the response body lists (\d+) runs$/;
const RUN_ID = /^the response body has run id "([^"]*)"$/;

defineFeature(feature, (test) => {
  test('Searching triggers requires authentication', ({ given, when, then }) => {
    given(NOT_AUTHED, notAuthed);
    when(SEARCH_REQ, searchTriggersReq);
    then(STATUS, assertStatus);
  });

  test('Searching triggers returns the resolved triggers', ({ given, and, when, then }) => {
    given(AUTHED, authedAs);
    and(SEARCH_YIELDS, searchYields);
    when(SEARCH_REQ, searchTriggersReq);
    then(STATUS, assertStatus);
    and(TRIGGER_COUNT, assertTriggerCount);
  });

  test('A trigger-search failure is surfaced as 502', ({ given, and, when, then }) => {
    given(AUTHED, authedAs);
    and(SEARCH_FAILS, searchFails);
    when(SEARCH_REQ, searchTriggersReq);
    then(STATUS, assertStatus);
    and(MESSAGE, assertMessage);
  });

  test('Listing runs returns 404 for an unknown playbook', ({ given, and, when, then }) => {
    given(AUTHED, authedAs);
    and(PLAYBOOK_MISSING, playbookMissing);
    when(LIST_REQ, listRunsReq);
    then(STATUS, assertStatus);
    and(MESSAGE, assertMessage);
  });

  test("Listing runs returns the playbook's runs", ({ given, and, when, then }) => {
    given(AUTHED, authedAs);
    and(PLAYBOOK_EXISTS, playbookExists);
    and(PLAYBOOK_N_RUNS, playbookHasNRuns);
    when(LIST_REQ, listRunsReq);
    then(STATUS, assertStatus);
    and(RUNS_COUNT, assertRunsCount);
  });

  test('Fetching a run that belongs to another playbook returns 404', ({ given, and, when, then }) => {
    given(AUTHED, authedAs);
    and(PLAYBOOK_EXISTS, playbookExists);
    and(RUN_BELONGS, runBelongsTo);
    when(GET_REQ, getRunReq);
    then(STATUS, assertStatus);
    and(MESSAGE, assertMessage);
  });

  test('Fetching a run that belongs to the playbook returns it', ({ given, and, when, then }) => {
    given(AUTHED, authedAs);
    and(PLAYBOOK_EXISTS, playbookExists);
    and(RUN_BELONGS, runBelongsTo);
    when(GET_REQ, getRunReq);
    then(STATUS, assertStatus);
    and(RUN_ID, assertRunId);
  });
});
