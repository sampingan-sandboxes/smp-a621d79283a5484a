// PROVIDED STUB — do not modify.
//
// A trimmed stand-in for the connectors module's toolkit/trigger-type repository. Only the
// members the playbook module imports are provided, each with a minimal body — the
// acceptance suites mock this module, so the bodies only run under `npm run dev`.
import type { TriggerTypeEntry } from '../../interfaces/connectors';

export async function getStaleToolkits(_toolkitSlugs: string[], _ttlMs: number): Promise<string[]> {
  return [];
}

export async function upsertTriggerEntries(
  _entries: { toolkit: string; name: string; logo: string | null; triggers: TriggerTypeEntry[] }[],
  _fetchedAt: Date,
): Promise<void> {
  // no-op stub — the real implementation upserts trigger-type entries into Mongo.
}

export async function getTriggersForToolkits(
  _toolkitSlugs: string[],
): Promise<{ toolkit: string; toolkitName: string; slug: string; name: string; logo: string | null }[]> {
  return [];
}
