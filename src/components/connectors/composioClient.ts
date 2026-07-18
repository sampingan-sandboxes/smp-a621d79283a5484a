// PROVIDED STUB — do not modify.
//
// The real service's cached Composio client, provided verbatim. The playbook module reaches
// through this for tool listing, tool execution, and trigger-type listing. The acceptance
// suites mock this module, so it is only exercised under `npm run dev`.
import { Composio } from '@composio/core';

let client: Composio | null = null;

export function getComposioClient(): Composio {
  if (client) return client;

  client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY! });
  return client;
}
