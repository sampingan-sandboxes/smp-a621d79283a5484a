// PROVIDED STUB — do not modify.
//
// A trimmed stand-in for the connectors module's Composio trigger-instance wrappers. Only
// the members the playbook module imports (`createTriggerInstance`, `deleteTriggerInstance`)
// are provided, each with a minimal body — the trigger-activation unit tests mock this
// module, so the bodies only run under `npm run dev`.
import type { TriggerInstanceUpsertResponse } from '@composio/core';

export async function createTriggerInstance(
  _userId: string,
  _triggerSlug: string,
  _connectedAccountId?: string,
): Promise<TriggerInstanceUpsertResponse> {
  return { triggerId: 'stub-trigger-instance' } as TriggerInstanceUpsertResponse;
}

export async function deleteTriggerInstance(_triggerInstanceId: string): Promise<void> {
  // no-op stub — the real implementation deletes the trigger instance at Composio.
}
