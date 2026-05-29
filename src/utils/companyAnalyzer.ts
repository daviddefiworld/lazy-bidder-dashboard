import type { CompanyAnalyzer } from '../types/companyResearch';
import type { IndeedCompany } from '../types/crawl';
import { extractKeyPeopleContacts } from './contactLinks';

export const defaultCompanyAnalyzer = (platform: string, companypage: string): CompanyAnalyzer => ({
  platform,
  companypage,
  company_name: '',
  grok: { status: 'idle' },
  analyze: { status: 'idle' }
});

export function companyOverviewRelevantScore(
  research: CompanyAnalyzer,
  company: IndeedCompany
): number | null {
  const hasAnalyzeScore =
    research.analyze.relevantScore != null && research.analyze.status === 'completed';
  if (hasAnalyzeScore) return research.analyze.relevantScore!;
  if (company.fit_score != null) return company.fit_score;
  return null;
}

export function companyResearchOverview(research: CompanyAnalyzer) {
  const grokReady = research.grok.status === 'completed' && !!research.grok.text?.trim();
  const grokPending = research.grok.status === 'pending';
  const contactLinks = extractKeyPeopleContacts(research.grok.text, research.analyze.report);
  return { grokReady, grokPending, contactLinks };
}
