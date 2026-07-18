import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsonResponse } from '../../../base/http';
import { getAuthenticatedUserId } from '../../auth/verifyToken';
import { getDb } from '../../mongo/client';
import { findPlaybook } from '../../playbook-config/repo';
import { listRunsForPlaybook } from '../runsRepo';

/**
 * YOUR TASK — implement `GET /playbooks/{id}/runs`: list a playbook's run history.
 *
 * - Kick off `getDb()` BEFORE authenticating (cold-start overlap), then await it before the
 *   Mongo reads.
 * - `getAuthenticatedUserId(event)`; null → 401 { message: 'Unauthorized' } (touch no repo).
 * - Resolve the playbook: `findPlaybook(userId, event.pathParameters?.id)` — but a missing `id`
 *   path parameter must short-circuit to 404 WITHOUT calling findPlaybook. A null playbook (not
 *   found, or owned by another user — findPlaybook is scoped to the caller) → 404
 *   { message: 'Not found' } without listing runs.
 * - Otherwise `listRunsForPlaybook(userId, playbook.id)` and respond 200 { runs }.
 */
export const handler: APIGatewayProxyHandlerV2 = async (_event) => {
  void jsonResponse;
  void getAuthenticatedUserId;
  void getDb;
  void findPlaybook;
  void listRunsForPlaybook;
  throw new Error('NotImplemented');
};
