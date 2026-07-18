// PROVIDED STUB — do not modify.
//
// A trimmed stand-in for the connectors module's connection repository. Only the one
// member the playbook module imports (`listConnections`) is provided, with a minimal body —
// the acceptance suites mock this module, so the body only runs under `npm run dev`.
import type { ConnectorConnection } from '../../interfaces/connectors';

export async function listConnections(_userId: string): Promise<ConnectorConnection[]> {
  return [];
}
