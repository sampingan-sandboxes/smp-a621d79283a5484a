import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsonResponse } from '../../../base/http';
import { getAuthenticatedUserId } from '../../auth/verifyToken';
import { getDb } from '../../mongo/client';
import { findPlaybook } from '../../playbook-config/repo';
import { getRun } from '../runsRepo';

/**
 * YOUR TASK — implement `GET /playbooks/{id}/runs/{runId}`: fetch a single run.
 *
 * - Kick off `getDb()` BEFORE authenticating (cold-start overlap), then await it before the
 *   Mongo reads.
 * - `getAuthenticatedUserId(event)`; null → 401 { message: 'Unauthorized' } (touch no repo).
 * - Resolve the playbook: a missing `id` path parameter → 404 WITHOUT calling findPlaybook; a
 *   null `findPlaybook(userId, id)` → 404 { message: 'Not found' } without looking up the run.
 * - Resolve the run: a missing `runId` → 404 WITHOUT calling getRun; then
 *   `getRun(userId, runId)`. Respond 404 unless the run exists AND belongs to this playbook
 *   (`run.playbookId === playbook.id`) — this prevents leaking a run via the wrong playbook's URL
 *   even though it is already scoped to the caller.
 * - On success respond 200 { run }.
 */
export const handler: APIGatewayProxyHandlerV2 = async (_event) => {
  void jsonResponse;
  void getAuthenticatedUserId;
  void getDb;
  void findPlaybook;
  void getRun;
  throw new Error('NotImplemented');
};
