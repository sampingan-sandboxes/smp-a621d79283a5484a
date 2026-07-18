import type { Playbook, PlaybookTrigger } from '../../interfaces/playbook-config';
import { findPlaybooksByTrigger } from '../playbook-config/repo';
import { createTriggerInstance, deleteTriggerInstance } from '../connectors/composioTriggers';

/**
 * YOUR TASK — implement `syncPlaybookTrigger`: reconcile a Playbook's live Composio trigger
 * instance with a new `trigger` value. Return the triggerInstanceId to persist (null when
 * the new trigger is null).
 *
 * - If the previous and next trigger slugs are equal (including both null), short-circuit
 *   and return `previous.triggerInstanceId` unchanged.
 * - If there was a previous trigger with an instance id, deactivate it — but ONLY if no
 *   OTHER live playbook for this user still references that slug (Composio trigger instances
 *   are shared per (user, slug); ignore this playbook's own id when checking via
 *   `findPlaybooksByTrigger`). A failure to delete the old instance is swallowed (logged),
 *   not thrown.
 * - If the next trigger is null, return null. Otherwise
 *   `createTriggerInstance(userId, nextTrigger.slug)` and return its `triggerId`. A failure
 *   to create propagates to the caller.
 */
export async function syncPlaybookTrigger(
  _userId: string,
  _playbookId: string,
  _previous: Pick<Playbook, 'trigger' | 'triggerInstanceId'>,
  _nextTrigger: PlaybookTrigger | null,
): Promise<string | null> {
  void findPlaybooksByTrigger;
  void createTriggerInstance;
  void deleteTriggerInstance;
  throw new Error('NotImplemented');
}

/**
 * YOUR TASK — implement `deactivatePlaybookTrigger`: tear down a Playbook's trigger instance
 * on delete. No-op when `trigger` or `triggerInstanceId` is null; otherwise deactivate the
 * instance only when no other live playbook for this user still references the slug (same
 * shared-instance rule as `syncPlaybookTrigger`).
 */
export async function deactivatePlaybookTrigger(
  _userId: string,
  _playbookId: string,
  _trigger: PlaybookTrigger | null,
  _triggerInstanceId: string | null,
): Promise<void> {
  throw new Error('NotImplemented');
}
