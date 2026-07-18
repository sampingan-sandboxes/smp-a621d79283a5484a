// PROVIDED — do not modify.
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsonResponse } from '../http';

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return jsonResponse(200, { status: 'ok', timestamp: new Date().toISOString() });
};
