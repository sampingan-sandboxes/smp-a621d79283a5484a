// PROVIDED — do not modify.
export type ConnectionStatus =
  | 'INITIALIZING'
  | 'INITIATED'
  | 'ACTIVE'
  | 'FAILED'
  | 'EXPIRED'
  | 'INACTIVE'
  | 'REVOKED';

export interface ConnectorConnection {
  userId: string;
  toolkit: string;
  connectedAccountId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredConnection extends ConnectorConnection {
  _id?: unknown;
}

export interface ToolkitCatalogEntry {
  slug: string;
  name: string;
  logo: string | null;
}

export interface TriggerTypeEntry {
  slug: string;
  name: string;
}

export interface ToolkitDoc {
  _id: string;
  name: string;
  logo: string | null;
  catalogFetchedAt?: Date;
  triggers?: TriggerTypeEntry[];
  triggersFetchedAt?: Date;
}

export interface RawToolkitsPage {
  items: { slug: string; name: string; meta: { logo?: string | null } }[];
  next_cursor?: string | null;
}
