export type ActionOrderStatus =
  | 'pending'
  | 'executing'
  | 'stopped'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface JobResult {
  jobId: string;
  jobDetail: unknown;
}

export interface ActionOrder {
  _id?: string;
  orderId: string;
  extensionId: string;
  sitename?: string;
  /** Site-specific request payload (Indeed search, Grok message, etc.). */
  input?: Record<string, unknown>;
  /** Progress and results (e.g. `patchedJobCount`, `grokResult`). */
  output?: Record<string, unknown>;
  results?: JobResult[];
  status: ActionOrderStatus;
  error?: string;
  executedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogEntry {
  id: string;
  at: number;
  level: 'info' | 'success' | 'error' | 'warn';
  message: string;
  detail?: string;
}
