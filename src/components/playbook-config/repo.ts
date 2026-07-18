// PROVIDED STUB — do not modify.
//
// A trimmed stand-in for the playbook-config module's repository. Only the members the
// playbook module imports (`findPlaybook`, `findPlaybooksByTrigger`) are provided, each with a
// minimal body — the acceptance suites mock this module, so the bodies only run under
// `npm run dev`.
import type { Playbook } from '../../interfaces/playbook-config';

export async function findPlaybook(_userId: string, _id: string): Promise<Playbook | null> {
  return null;
}

export async function findPlaybooksByTrigger(_userId: string, _triggerSlug: string): Promise<Playbook[]> {
  return [];
}
