import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsonResponse } from '../../../base/http';
import { getAuthenticatedUserId } from '../../auth/verifyToken';
import { searchConnectedTriggers } from '../triggers';

/**
 * YOUR TASK — implement `GET /triggers`: search the caller's connected trigger types.
 *
 * - `getAuthenticatedUserId(event)`; null → 401 { message: 'Unauthorized' } (and do NOT
 *   search).
 * - Read the search term from `event.queryStringParameters?.search`, defaulting to '' when
 *   absent or explicitly empty.
 * - `searchConnectedTriggers(userId, search)`; on ANY thrown error respond 502
 *   { message: 'Failed to search triggers' } without leaking the underlying error.
 * - On success respond 200 { triggers }.
 */
export const handler: APIGatewayProxyHandlerV2 = async (_event) => {
  void jsonResponse;
  void getAuthenticatedUserId;
  void searchConnectedTriggers;
  throw new Error('NotImplemented');
};
