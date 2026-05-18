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
  query: string;
  location: string;
  sort: string;
  fromage: string;
  patchedJobCount: number;
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
