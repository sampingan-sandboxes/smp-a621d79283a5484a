// PROVIDED — do not modify.
export interface PlaybookTrigger {
  slug: string;
  toolkit: string;
  name: string;
  // Both optional because playbooks whose trigger was selected before these fields existed
  // have them missing from their stored document, not merely null.
  toolkitName?: string;
  logo?: string | null;
}

// The Anthropic model ID that executes this playbook's prompt when its trigger fires.
export type PlaybookModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-5';

export interface Playbook {
  id: string;
  userId: string;
  title: string;
  trigger: PlaybookTrigger | null;
  // The live Composio trigger instance subscribed on `trigger`'s behalf, or null when
  // `trigger` is null. Server-derived by playbookTriggerActivation — never client-set.
  triggerInstanceId: string | null;
  triggerDescription: string;
  prompt: unknown[];
  model: PlaybookModel;
  createdAt: Date;
  updatedAt: Date;
  // Soft-delete marker — null while live. Deleted playbooks are excluded from every repo
  // read (list/find/findByTrigger) rather than being physically removed.
  deletedAt: Date | null;
}

export interface StoredPlaybook extends Playbook {
  _id?: unknown;
}
