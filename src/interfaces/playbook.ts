// PROVIDED — do not modify.
import type { TriggerTypeEntry } from './connectors';
import type { PlaybookModel } from './playbook-config';

// 'running' is the initial status a run is created with — before the gate has even
// decided — so a record exists in Mongo (and the History tab) from the moment a webhook
// event matches a Playbook, not only once the whole thing finishes.
export type PlaybookRunStatus = 'running' | 'gated_out' | 'completed' | 'failed';

export interface PlaybookRunToolCall {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
}

export interface PlaybookRun {
  id: string;
  playbookId: string;
  userId: string;
  triggerSlug: string;
  toolkitSlug: string;
  webhookEventId: string;
  triggerPayload: Record<string, unknown>;
  model: PlaybookModel;
  status: PlaybookRunStatus;
  // Unset until the gate actually decides — the record exists before that point.
  gateReasoning?: string;
  response?: string;
  toolCalls: PlaybookRunToolCall[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface StoredPlaybookRun extends PlaybookRun {
  _id?: unknown;
}

export interface GateDecision {
  matches: boolean;
  reasoning: string;
}

// BlockNote (@blocknote/core) is a frontend-only dependency — this backend has no
// package for it, so a Playbook's `prompt` field (BlockNote's block-array JSON) is walked
// structurally, unknown-safe, instead of through typed `Block` imports.

export interface InlineTextContent {
  type: 'text';
  text: string;
}

export interface InlineLinkContent {
  type: 'link';
  content: InlineContent[];
  href: string;
}

export type InlineContent = InlineTextContent | InlineLinkContent | Record<string, unknown>;

export interface BlockLike {
  type?: string;
  content?: unknown;
  children?: unknown;
}

export interface ToolkitTriggerEntries {
  toolkit: string;
  name: string;
  logo: string | null;
  triggers: TriggerTypeEntry[];
}

export interface RawTriggerTypesPage {
  items: { slug: string; name: string; toolkit: { slug: string } }[];
  nextCursor?: string | null;
}
