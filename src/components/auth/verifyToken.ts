// PROVIDED STUB — do not modify.
//
// In the real service this module verifies Cognito ID tokens. For this sandbox it is a
// lightweight stand-in so the playbook handlers you build can resolve a caller id and run
// under `npm run dev`. The acceptance suites mock this module, so its internals are never
// exercised by the tests — only its shape matters for your imports.
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export function getAuthHeader(event: Pick<APIGatewayProxyEventV2, 'headers'>): string | undefined {
  return event.headers.authorization ?? event.headers.Authorization;
}

// Decodes (does NOT cryptographically verify) the `sub` claim from a bearer JWT. Good
// enough for local `npm run dev`; never used by the acceptance tests.
export async function getAuthenticatedUserId(
  event: Pick<APIGatewayProxyEventV2, 'headers'>,
): Promise<string | null> {
  const header = getAuthHeader(event);
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const token = header.slice('Bearer '.length);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8')) as { sub?: string };
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
