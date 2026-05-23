export type ResearchStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed';

export interface CompanyGrokResearch {
  status: ResearchStatus;
  orderId?: string;
  text?: string;
  error?: string;
  researchedAt?: string;
}

export interface CompanyAiAnalyze {
  status: ResearchStatus;
  relevantScore?: number;
  report?: string;
  error?: string;
  analyzedAt?: string;
}

export interface CompanyAnalyzer {
  platform: string;
  companypage: string;
  company_name: string;
  grok: CompanyGrokResearch;
  analyze: CompanyAiAnalyze;
  updatedAt?: string;
}

export interface GrokResearchStartResult {
  analyzer: CompanyAnalyzer;
  orderId: string;
  extensionId: string;
}
