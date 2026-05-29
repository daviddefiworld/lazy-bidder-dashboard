export type ScraperCommandId =

  | 'indeed-orchestrate'

  | 'glassdoor-orchestrate'

  | 'indeed-scrape-software'

  | 'indeed-scrape-ai'

  | 'indeed-missing-jobs'

  | 'indeed-scrape-company-details'

  | 'indeed-normalize-job'

  | 'indeed-normalize-company'

  | 'indeed-analyze-jobs'

  | 'indeed-upload'

  | 'glassdoor-scrape-software'

  | 'glassdoor-scrape-ai'

  | 'glassdoor-scrape-company-details'

  | 'glassdoor-normalize-job'

  | 'glassdoor-normalize-company'

  | 'glassdoor-analyze-jobs'

  | 'glassdoor-upload';



export type ScraperPlatform = 'indeed' | 'glassdoor';



export type ScraperRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';



export function getScraperPlatform(commandId: ScraperCommandId): ScraperPlatform {

  return commandId.startsWith('glassdoor') ? 'glassdoor' : 'indeed';

}



export type ScraperStepStatus = 'pending' | 'running' | 'completed' | 'failed';



export interface ScraperItemProgress {

  label: string;

  current: number;

  total?: number;

  suffix?: string;

}



export interface ScraperStep {

  index: number;

  title: string;

  status: ScraperStepStatus;

  message?: string;

  item?: ScraperItemProgress;
  items?: ScraperItemProgress[];

}



export interface ScraperRunProgress {

  stepTotal: number;

  currentIndex: number;

  steps: ScraperStep[];

}



export interface ScraperRunState {

  runId: string;

  orderId?: string;

  commandId: ScraperCommandId;

  status: ScraperRunStatus;

  runProgress?: ScraperRunProgress;

  error?: string;

  startedAt: string;

  finishedAt?: string;

}



export interface ScraperWorkerStatus {

  workerId: string;

  connected: boolean;

  connectedAt?: string;

  lastSeen?: string;

  version?: string;

  busy: boolean;

  busyPlatforms?: ScraperPlatform[];

  activeRuns?: ScraperRunState[];

  currentRun?: ScraperRunState;

  recentRuns: ScraperRunState[];

  syncedAt?: string;

}



export interface ScraperCommandDef {

  id: ScraperCommandId;

  label: string;

  description?: string;

  group: 'indeed-orchestration' | 'indeed-steps' | 'glassdoor-orchestration' | 'glassdoor-steps';

}



export const SCRAPER_COMMANDS: ScraperCommandDef[] = [

  { id: 'indeed-orchestrate', label: 'Full Indeed pipeline', group: 'indeed-orchestration', description: '8 steps: scrape → normalize → analyze → upload' },

  { id: 'indeed-scrape-software', label: 'Scrape software · remote', group: 'indeed-steps' },

  { id: 'indeed-scrape-ai', label: 'Scrape AI · remote', group: 'indeed-steps' },

  { id: 'indeed-missing-jobs', label: 'Missing jobs (detail queue)', group: 'indeed-steps' },

  { id: 'indeed-scrape-company-details', label: 'Scrape company details', group: 'indeed-steps' },

  { id: 'indeed-normalize-job', label: 'Normalize jobs', group: 'indeed-steps' },

  { id: 'indeed-normalize-company', label: 'Normalize companies', group: 'indeed-steps' },

  { id: 'indeed-analyze-jobs', label: 'Analyze jobs (AI)', group: 'indeed-steps' },

  { id: 'indeed-upload', label: 'Upload to API', group: 'indeed-steps' },

  { id: 'glassdoor-orchestrate', label: 'Full Glassdoor pipeline', group: 'glassdoor-orchestration', description: '7 steps: scrape → normalize → analyze → upload' },

  { id: 'glassdoor-scrape-software', label: 'Scrape software · remote', group: 'glassdoor-steps' },

  { id: 'glassdoor-scrape-ai', label: 'Scrape AI · remote', group: 'glassdoor-steps' },

  { id: 'glassdoor-scrape-company-details', label: 'Scrape company details', group: 'glassdoor-steps' },

  { id: 'glassdoor-normalize-job', label: 'Normalize jobs', group: 'glassdoor-steps' },

  { id: 'glassdoor-normalize-company', label: 'Normalize companies', group: 'glassdoor-steps' },

  { id: 'glassdoor-analyze-jobs', label: 'Analyze jobs (AI)', group: 'glassdoor-steps' },

  { id: 'glassdoor-upload', label: 'Upload to API', group: 'glassdoor-steps' }

];

