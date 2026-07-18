// PROVIDED STUB — do not modify.
//
// A trimmed stand-in for the connectors module's toolkit catalog cache. Only the members
// the playbook module imports (`CACHE_TTL_MS`, `getToolkitCatalog`) are provided; the latter
// has a minimal body. The acceptance suites mock this module, so the body only runs under
// `npm run dev`.
import type { ToolkitCatalogEntry } from '../../interfaces/connectors';

// The full catalog rarely changes, so the real implementation refreshes from Composio at
// most once per this TTL window.
export const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getToolkitCatalog(): Promise<ToolkitCatalogEntry[]> {
  return [];
}
