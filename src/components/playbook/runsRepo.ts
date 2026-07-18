import { randomUUID } from 'crypto';
import { getDb } from '../mongo/client';
import type { PlaybookRun } from '../../interfaces/playbook';

/**
 * YOUR TASK — implement the playbook-run repository over Mongo collection `'playbook_runs'`,
 * using `getDb()` from '../mongo/client'. All reads must strip Mongo's `_id` before
 * returning (`const { _id, ...run } = doc`). The `StoredPlaybookRun` shape (PlaybookRun plus an
 * optional `_id`) is declared in '../../interfaces/playbook'.
 *
 * - createRun(input): generate a fresh `id` (randomUUID), set `status: 'running'` and
 *   `toolCalls: []`, spread the given input, insert the document, and return the run
 *   exactly as inserted.
 * - updateRun(id, updates): `findOneAndUpdate({ id }, { $set: updates }, { returnDocument:
 *   'after' })`; return the stripped doc, or null when no run matches.
 * - listRunsForPlaybook(userId, playbookId): find `{ userId, playbookId }` sorted `createdAt: -1`
 *   (newest first), stripped.
 * - getRun(userId, id): findOne `{ userId, id }` (scoped to the caller), stripped, or null.
 */
export async function createRun(
  _input: Omit<PlaybookRun, 'id' | 'status' | 'gateReasoning' | 'toolCalls'>,
): Promise<PlaybookRun> {
  void randomUUID;
  void getDb;
  throw new Error('NotImplemented');
}

export async function updateRun(
  _id: string,
  _updates: Partial<Pick<PlaybookRun, 'status' | 'gateReasoning' | 'response' | 'toolCalls' | 'error' | 'completedAt'>>,
): Promise<PlaybookRun | null> {
  throw new Error('NotImplemented');
}

export async function listRunsForPlaybook(_userId: string, _playbookId: string): Promise<PlaybookRun[]> {
  throw new Error('NotImplemented');
}

export async function getRun(_userId: string, _id: string): Promise<PlaybookRun | null> {
  throw new Error('NotImplemented');
}
