// Provided acceptance suite — do not modify.
// Executes docs/features/run-store-and-triggers.feature against your runsRepo + triggers.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { jest, expect, beforeEach } from '@jest/globals';
import type { PlaybookRun } from '../src/interfaces/playbook';
import type { ConnectorConnection } from '../src/interfaces/connectors';
import type { PlaybookTrigger } from '../src/interfaces/playbook-config';

const feature = loadFeature('docs/features/run-store-and-triggers.feature');

// --- Mongo layer (runsRepo) ---
const mockInsertOne = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockFindOne = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockFindOneAndUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockToArray = jest.fn<() => Promise<unknown[]>>();
const mockSort = jest.fn(() => ({ toArray: mockToArray }));
const mockFind = jest.fn(() => ({ sort: mockSort }));
const mockCollection = jest.fn(() => ({
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  find: mockFind,
}));
jest.mock('../src/components/mongo/client', () => ({ getDb: jest.fn(async () => ({ collection: mockCollection })) }));

// --- triggers collaborators ---
const mockListTypes = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockListConnections = jest.fn<(userId: string) => Promise<ConnectorConnection[]>>();
const mockGetStaleToolkits = jest.fn<(toolkits: string[], ttlMs: number) => Promise<string[]>>();
const mockUpsertTriggerEntries = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockGetTriggersForToolkits =
  jest.fn<
    (toolkits: string[]) => Promise<
      { toolkit: string; toolkitName: string; slug: string; name: string; logo: string | null }[]
    >
  >();
const mockGetToolkitCatalog = jest.fn<() => Promise<{ slug: string; name: string; logo: string | null }[]>>();

jest.mock('../src/components/connectors/composioClient', () => ({
  getComposioClient: jest.fn(() => ({ triggers: { listTypes: mockListTypes } })),
}));
jest.mock('../src/components/connectors/connectorsRepo', () => ({ listConnections: mockListConnections }));
jest.mock('../src/components/connectors/toolkitsRepo', () => ({
  getStaleToolkits: mockGetStaleToolkits,
  upsertTriggerEntries: mockUpsertTriggerEntries,
  getTriggersForToolkits: mockGetTriggersForToolkits,
}));
jest.mock('../src/components/connectors/toolkitCatalog', () => ({
  CACHE_TTL_MS: 60 * 60 * 1000,
  getToolkitCatalog: mockGetToolkitCatalog,
}));

import { createRun, getRun } from '../src/components/playbook/runsRepo';
import { searchConnectedTriggers, resolvePlaybookTrigger } from '../src/components/playbook/triggers';

function baseRunInput(playbookId: string): Omit<PlaybookRun, 'id' | 'status' | 'gateReasoning' | 'toolCalls'> {
  return {
    playbookId,
    userId: 'user-1',
    triggerSlug: 'GMAIL_NEW_GMAIL_MESSAGE',
    toolkitSlug: 'gmail',
    webhookEventId: 'evt-1',
    triggerPayload: {},
    model: 'claude-haiku-4-5-20251001',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
}
function connection(toolkit: string): ConnectorConnection {
  return {
    userId: 'user-1',
    toolkit,
    connectedAccountId: `ca_${toolkit}`,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const ctx: {
  input: Omit<PlaybookRun, 'id' | 'status' | 'gateReasoning' | 'toolCalls'> | null;
  run: PlaybookRun | null;
  fetched: PlaybookRun | null;
  triggers: PlaybookTrigger[];
  resolved: PlaybookTrigger | null;
} = { input: null, run: null, fetched: null, triggers: [], resolved: null };

beforeEach(() => {
  [mockInsertOne, mockFindOne, mockFindOneAndUpdate, mockToArray].forEach((m) => m.mockReset());
  mockInsertOne.mockResolvedValue({ acknowledged: true });
  mockToArray.mockResolvedValue([]);
  [mockCollection, mockFind, mockSort].forEach((m) => m.mockClear());
  [
    mockListTypes,
    mockListConnections,
    mockGetStaleToolkits,
    mockUpsertTriggerEntries,
    mockGetTriggersForToolkits,
    mockGetToolkitCatalog,
  ].forEach((m) => m.mockReset());
  mockListConnections.mockResolvedValue([]);
  mockGetStaleToolkits.mockResolvedValue([]);
  mockUpsertTriggerEntries.mockResolvedValue(undefined);
  mockGetTriggersForToolkits.mockResolvedValue([]);
  mockGetToolkitCatalog.mockResolvedValue([]);
  ctx.input = null;
  ctx.run = null;
  ctx.fetched = null;
  ctx.triggers = [];
  ctx.resolved = null;
});

// ---- reusable step callbacks ----
const runInput = (playbookId: string) => {
  ctx.input = baseRunInput(playbookId);
};
const createRunStep = async () => {
  ctx.run = await createRun(ctx.input!);
};
const assertRunStatus = (status: string) => {
  expect(ctx.run?.status).toBe(status);
};
const assertRunEmptyToolCalls = () => {
  expect(ctx.run?.toolCalls).toEqual([]);
};
const assertRunPersisted = (collection: string) => {
  expect(mockCollection).toHaveBeenCalledWith(collection);
  expect(mockInsertOne).toHaveBeenCalledWith(ctx.run);
};
const storedRun = (runId: string) => {
  mockFindOne.mockResolvedValue({ _id: 'oid-1', ...baseRunInput('playbook-1'), id: runId, status: 'completed', toolCalls: [] });
};
const fetchRun = async (runId: string, userId: string) => {
  ctx.fetched = await getRun(userId, runId);
};
const assertFetchedId = (id: string) => {
  expect(ctx.fetched?.id).toBe(id);
};
const assertFetchedNoUnderscore = () => {
  expect(ctx.fetched).not.toHaveProperty('_id');
};
const assertQueriedByUserId = () => {
  expect(mockFindOne).toHaveBeenCalledWith({ userId: 'user-1', id: 'run-1' });
};
const noActiveConnections = () => {
  mockListConnections.mockResolvedValue([]);
};
const activeConnection = (toolkit: string) => {
  mockListConnections.mockResolvedValue([connection(toolkit)]);
};
const cacheHoldsTwo = () => {
  mockGetTriggersForToolkits.mockResolvedValue([
    { toolkit: 'gmail', toolkitName: 'Gmail', slug: 'new_email', name: 'New email', logo: null },
    { toolkit: 'gmail', toolkitName: 'Gmail', slug: 'new_attachment', name: 'New attachment', logo: null },
  ]);
};
const searchTriggers = async (query: string) => {
  ctx.triggers = await searchConnectedTriggers('user-1', query);
};
const assertSearchEmpty = () => {
  expect(ctx.triggers).toEqual([]);
};
const assertCacheNotConsulted = () => {
  expect(mockGetStaleToolkits).not.toHaveBeenCalled();
};
const assertSearchSlugs = (csv: string) => {
  expect(ctx.triggers.map((t) => t.slug)).toEqual(csv.split(','));
};
const catalogNames = (slug: string, name: string) => {
  mockGetToolkitCatalog.mockResolvedValue([{ slug, name, logo: null }]);
};
const resolveTrigger = async (toolkit: string, staleName: string) => {
  ctx.resolved = await resolvePlaybookTrigger({
    slug: `${toolkit}_TRIGGER`,
    toolkit,
    name: 'Some trigger',
    toolkitName: staleName,
    logo: null,
  });
};
const assertResolvedName = (name: string) => {
  expect(ctx.resolved?.toolkitName).toBe(name);
};
const resolveNull = async () => {
  ctx.resolved = await resolvePlaybookTrigger(null);
};
const assertResolvedNull = () => {
  expect(ctx.resolved).toBeNull();
};
const assertCatalogNotFetched = () => {
  expect(mockGetToolkitCatalog).not.toHaveBeenCalled();
};

const RUN_INPUT = /^a run input for playbook "([^"]*)"$/;
const CREATE_RUN = 'the run is created';
const CREATED_STATUS = /^the created run has status "([^"]*)"$/;
const CREATED_EMPTY = 'the created run has an empty tool-call list';
const CREATED_PERSISTED = /^the created run was persisted to "([^"]*)"$/;
const STORED_RUN = /^a stored run "([^"]*)" exists for the caller$/;
const FETCH_RUN = /^the run "([^"]*)" is fetched for user "([^"]*)"$/;
const FETCHED_ID = /^the fetched run id is "([^"]*)"$/;
const FETCHED_NO_UNDERSCORE = 'the fetched run has no "_id" field';
const QUERIED = 'the run was queried by user and id';
const NO_ACTIVE_CONN = 'the user has no active connections';
const ACTIVE_CONN = /^the user has an active "([^"]*)" connection$/;
const CACHE_TWO = /^the cache holds a "([^"]*)" and a "([^"]*)" trigger$/;
const SEARCH_TRIGGERS = /^triggers are searched for "([^"]*)"$/;
const SEARCH_EMPTY = 'the trigger search returns no results';
const CACHE_NOT_CONSULTED = 'the trigger cache was not consulted';
const SEARCH_SLUGS = /^the trigger search returns slugs "([^"]*)"$/;
const CATALOG_NAMES = /^the catalog names "([^"]*)" as "([^"]*)"$/;
const RESOLVE_TRIGGER = /^the trigger for toolkit "([^"]*)" with stale name "([^"]*)" is resolved$/;
const RESOLVED_NAME = /^the resolved trigger toolkitName is "([^"]*)"$/;
const RESOLVE_NULL = 'a null trigger is resolved';
const RESOLVED_NULL = 'the resolved trigger is null';
const CATALOG_NOT_FETCHED = 'the catalog was not fetched';

defineFeature(feature, (test) => {
  test('A new run is created in running status with a generated id', ({ given, when, then, and }) => {
    given(RUN_INPUT, runInput);
    when(CREATE_RUN, createRunStep);
    then(CREATED_STATUS, assertRunStatus);
    and(CREATED_EMPTY, assertRunEmptyToolCalls);
    and(CREATED_PERSISTED, assertRunPersisted);
  });

  test('Fetching a run scopes the query to the caller and strips the Mongo _id', ({ given, when, then, and }) => {
    given(STORED_RUN, storedRun);
    when(FETCH_RUN, fetchRun);
    then(FETCHED_ID, assertFetchedId);
    and(FETCHED_NO_UNDERSCORE, assertFetchedNoUnderscore);
    and(QUERIED, assertQueriedByUserId);
  });

  test('Searching triggers returns nothing without active connections', ({ given, when, then, and }) => {
    given(NO_ACTIVE_CONN, noActiveConnections);
    when(SEARCH_TRIGGERS, searchTriggers);
    then(SEARCH_EMPTY, assertSearchEmpty);
    and(CACHE_NOT_CONSULTED, assertCacheNotConsulted);
  });

  test('Searching triggers filters the cached triggers by query', ({ given, and, when, then }) => {
    given(ACTIVE_CONN, activeConnection);
    and(CACHE_TWO, cacheHoldsTwo);
    when(SEARCH_TRIGGERS, searchTriggers);
    then(SEARCH_SLUGS, assertSearchSlugs);
  });

  test('Resolving a trigger overrides a stale toolkit name from the catalog', ({ given, when, then }) => {
    given(CATALOG_NAMES, catalogNames);
    when(RESOLVE_TRIGGER, resolveTrigger);
    then(RESOLVED_NAME, assertResolvedName);
  });

  test('Resolving a null trigger passes it through untouched', ({ when, then, and }) => {
    when(RESOLVE_NULL, resolveNull);
    then(RESOLVED_NULL, assertResolvedNull);
    and(CATALOG_NOT_FETCHED, assertCatalogNotFetched);
  });
});
