import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/crawl/Breadcrumbs';
import CompanyReportTab from '../components/company/CompanyReportTab';
import CompanyGrokTab from '../components/company/CompanyGrokTab';
import CompanyJobBoardTab from '../components/company/CompanyJobBoardTab';
import CompanyReportActions from '../components/company/CompanyReportActions';
import CompanyJobsStrip from '../components/company/CompanyJobsStrip';
import RatingStars from '../components/crawl/RatingStars';
import SearchField from '../components/crawl/SearchField';
import CompanyDetailSidebar, {
  type CompanyDetailView
} from '../components/company/CompanyDetailSidebar';
import { ContentPanelLoading } from '../components/ui/ContentPanel';
import { extractKeyPeopleContacts } from '../utils/contactLinks';
import { useConnectedExtensions } from '../hooks/useConnectedExtensions';
import { useSocket } from '../contexts/SocketContext';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import type { IndeedCompany, IndeedJob } from '../types/crawl';
import type { ActionOrderStatus } from '../types/actionOrder';
import type { CompanyAnalyzer } from '../types/companyResearch';
import { formatExtensionId } from '../utils/formatters';

const GROK_ORDER_TERMINAL: ActionOrderStatus[] = ['completed', 'failed', 'cancelled'];
const GROK_ORDER_IN_FLIGHT: ActionOrderStatus[] = ['pending', 'executing'];

const JOBS_FETCH_LIMIT = 200;

const defaultAnalyzer = (platform: string, companypage: string): CompanyAnalyzer => ({
  platform,
  companypage,
  company_name: '',
  grok: { status: 'idle' },
  analyze: { status: 'idle' }
});

const CompanyDetailPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const platform = searchParams.get('platform') ?? '';
  const companypage = searchParams.get('companypage') ?? '';
  const tabParam = searchParams.get('tab');
  const activeView: CompanyDetailView =
    tabParam === 'grok' || tabParam === 'jobboard' ? tabParam : 'report';

  const { isConnected } = useSocket();
  const { extensions } = useConnectedExtensions();
  const connectedExtension = extensions[0] ?? null;

  const [company, setCompany] = useState<IndeedCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState('');
  const [ignoredSaving, setIgnoredSaving] = useState(false);
  const [ignoredError, setIgnoredError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<IndeedJob[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [analyzer, setAnalyzer] = useState<CompanyAnalyzer | null>(null);
  const [analyzerLoading, setAnalyzerLoading] = useState(true);
  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastGrokExtensionId, setLastGrokExtensionId] = useState<string | null>(null);
  const [trackedGrokOrderId, setTrackedGrokOrderId] = useState<string | null>(null);
  const [grokOrderStatus, setGrokOrderStatus] = useState<ActionOrderStatus | null>(null);
  const [grokSubmitting, setGrokSubmitting] = useState(false);

  const setView = (view: CompanyDetailView) => {
    const next = new URLSearchParams(searchParams);
    if (view === 'report') next.delete('tab');
    else next.set('tab', view);
    setSearchParams(next, { replace: true });
  };

  const loadAnalyzer = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!platform || !companypage) return;
      if (!opts?.silent) setAnalyzerLoading(true);
      try {
        const data = await apiService.getCompanyAnalyzer(platform, companypage);
        setAnalyzer(data ?? defaultAnalyzer(platform, companypage));
      } catch {
        if (!opts?.silent) setAnalyzer(defaultAnalyzer(platform, companypage));
      } finally {
        if (!opts?.silent) setAnalyzerLoading(false);
      }
    },
    [platform, companypage]
  );

  const load = useCallback(async () => {
    if (!platform || !companypage) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCrawlCompany(platform, companypage);
      setCompany(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load company');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [platform, companypage]);

  useEffect(() => {
    void load();
    void loadAnalyzer();
  }, [load, loadAnalyzer]);

  const loadJobs = useCallback(async () => {
    if (!platform || !companypage) return;
    setJobsLoading(true);
    setJobsError(null);
    const countHint = company?.jobs_count;
    const limit =
      countHint != null && countHint > 0
        ? Math.min(countHint, JOBS_FETCH_LIMIT)
        : JOBS_FETCH_LIMIT;
    try {
      const data = await apiService.listCrawlJobs({
        platform,
        company_page: companypage,
        limit,
        offset: 0,
        sort: 'date'
      });
      setJobs(data.items);
      setJobsTotal(data.total);
    } catch (e) {
      setJobsError(e instanceof Error ? e.message : 'Failed to load jobs');
      setJobs([]);
      setJobsTotal(0);
    } finally {
      setJobsLoading(false);
    }
  }, [platform, companypage, company?.jobs_count]);

  useEffect(() => {
    if (company) void loadJobs();
  }, [company, loadJobs]);

  useEffect(() => {
    if (!isConnected || !platform || !companypage) return;

    const onAnalyzerUpdated = (data: {
      platform: string;
      companypage: string;
      orderId?: string;
    }) => {
      if (data.platform !== platform || data.companypage !== companypage) return;
      void loadAnalyzer({ silent: true });
    };

    const onActionResult = (data: {
      orderId: string;
      status: string;
      grokResult?: { message: string };
    }) => {
      const activeOrderId = trackedGrokOrderId ?? analyzer?.grok.orderId;
      if (!activeOrderId || data.orderId !== activeOrderId) return;
      const status = data.status as ActionOrderStatus;
      if (GROK_ORDER_IN_FLIGHT.includes(status)) {
        setGrokOrderStatus(status);
      }
      if (GROK_ORDER_TERMINAL.includes(status)) {
        setGrokOrderStatus(status);
        void loadAnalyzer({ silent: true });
      }
    };

    socketService.on('company:analyzer_updated', onAnalyzerUpdated);
    socketService.on('action:result', onActionResult);
    return () => {
      socketService.off('company:analyzer_updated', onAnalyzerUpdated);
      socketService.off('action:result', onActionResult);
    };
  }, [
    isConnected,
    platform,
    companypage,
    loadAnalyzer,
    trackedGrokOrderId,
    analyzer?.grok.orderId
  ]);

  const grokOrderInFlight =
    grokSubmitting ||
    (grokOrderStatus != null && GROK_ORDER_IN_FLIGHT.includes(grokOrderStatus));
  const grokIsPending = analyzer?.grok.status === 'pending' || grokOrderInFlight;

  useEffect(() => {
    if (!analyzer?.grok.orderId) return;
    setTrackedGrokOrderId((cur) => cur ?? analyzer.grok.orderId ?? null);
    if (analyzer.grok.status === 'pending' && grokOrderStatus == null) {
      setGrokOrderStatus('pending');
    }
  }, [analyzer?.grok.orderId, analyzer?.grok.status, grokOrderStatus]);

  useEffect(() => {
    const orderId = trackedGrokOrderId ?? analyzer?.grok.orderId;
    const grokDone =
      analyzer?.grok.status === 'completed' && !!analyzer.grok.text?.trim();
    if (!orderId || grokDone) return;

    let cancelled = false;

    const pollOrder = async () => {
      try {
        const order = await apiService.getActionOrder(orderId);
        if (cancelled) return;
        setGrokOrderStatus(order.status);
        if (GROK_ORDER_IN_FLIGHT.includes(order.status)) {
          setAnalyzer((prev) => {
            if (!prev) return prev;
            if (prev.grok.status === 'pending' && prev.grok.orderId === orderId) return prev;
            return {
              ...prev,
              grok: { status: 'pending', orderId, error: undefined, text: prev.grok.text }
            };
          });
        }
        if (GROK_ORDER_TERMINAL.includes(order.status)) {
          void loadAnalyzer({ silent: true });
        }
      } catch {
        /* order poll is best-effort */
      }
    };

    void pollOrder();
    const interval = setInterval(() => void pollOrder(), 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    trackedGrokOrderId,
    analyzer?.grok.orderId,
    analyzer?.grok.status,
    analyzer?.grok.text,
    loadAnalyzer
  ]);

  useEffect(() => {
    if (!grokIsPending || !platform || !companypage) return;
    const interval = setInterval(() => void loadAnalyzer({ silent: true }), 5000);
    return () => clearInterval(interval);
  }, [grokIsPending, platform, companypage, loadAnalyzer]);

  useEffect(() => {
    if (analyzer?.grok.status === 'completed') {
      setTrackedGrokOrderId(null);
      setGrokOrderStatus(null);
      setGrokSubmitting(false);
      return;
    }
    if (
      analyzer?.grok.status === 'failed' &&
      !grokOrderInFlight &&
      grokOrderStatus !== 'executing' &&
      grokOrderStatus !== 'pending'
    ) {
      setTrackedGrokOrderId(null);
      setGrokOrderStatus(null);
      setGrokSubmitting(false);
    }
  }, [analyzer?.grok.status, grokOrderInFlight, grokOrderStatus]);

  const handleAskGrok = async () => {
    if (!platform || !companypage || grokIsPending) return;
    setActionError(null);
    setView('grok');
    setGrokSubmitting(true);
    setGrokOrderStatus('pending');
    setAnalyzer((prev) => ({
      ...(prev ?? defaultAnalyzer(platform, companypage)),
      grok: { status: 'pending', error: undefined, text: undefined }
    }));
    try {
      const result = await apiService.requestCompanyGrokResearch(
        platform,
        companypage,
        connectedExtension?.extensionId
      );
      setAnalyzer(result.analyzer);
      setTrackedGrokOrderId(result.orderId);
      setGrokOrderStatus('executing');
      setLastGrokExtensionId(result.extensionId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to start Grok research');
      setGrokSubmitting(false);
      setGrokOrderStatus(null);
      void loadAnalyzer({ silent: true });
    } finally {
      setGrokSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!platform || !companypage) return;
    setActionError(null);
    setAnalyzeBusy(true);
    setView('report');
    try {
      const updated = await apiService.analyzeCompany(platform, companypage);
      setAnalyzer(updated);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'AI analysis failed');
      void loadAnalyzer();
    } finally {
      setAnalyzeBusy(false);
    }
  };

  const handleIgnoredChange = async (ignored: boolean) => {
    if (!company) return;
    setIgnoredSaving(true);
    setIgnoredError(null);
    try {
      const updated = await apiService.setCrawlCompanyIgnored(
        company.platform,
        company.companypage,
        ignored
      );
      setCompany(updated);
    } catch (e) {
      setIgnoredError(e instanceof Error ? e.message : 'Failed to update ignored status');
    } finally {
      setIgnoredSaving(false);
    }
  };

  const handleRefresh = () => {
    void load();
    void loadAnalyzer();
    void loadJobs();
  };

  const research = analyzer ?? defaultAnalyzer(platform, companypage);
  const grokPending = grokIsPending;
  const grokReady = research.grok.status === 'completed' && !!research.grok.text?.trim();
  const grokFailed = research.grok.status === 'failed' && !grokPending;
  const hasReport =
    research.analyze.status === 'completed' && !!research.analyze.report?.trim();
  const hasGrokContent =
    grokReady || grokPending || grokFailed;
  const contactLinks = useMemo(
    () => extractKeyPeopleContacts(research.grok.text, research.analyze.report),
    [research.grok.text, research.analyze.report]
  );

  if (!platform || !companypage) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-sm">Missing platform or companypage query parameters.</p>
        <Link to="/companies" className="mt-3 inline-block text-sm font-medium text-primary-700">
          ← Companies
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="text-sm">Loading company…</span>
        </div>
      </main>
    );
  }

  if (error || !company) {
    return (
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: 'Companies', to: '/companies' }, { label: 'Not found' }]} />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? 'Company not found'}
        </div>
        <Link to="/companies" className="inline-block mt-4 text-sm font-medium text-primary-700 hover:text-primary-800">
          ← Back to companies
        </Link>
      </main>
    );
  }

  const name = company.company_name || 'Unnamed company';
  const extensionHint = lastGrokExtensionId
    ? formatExtensionId(lastGrokExtensionId)
    : connectedExtension
      ? formatExtensionId(connectedExtension.extensionId)
      : undefined;

  const jobBoardPanel = (
    <CompanyJobBoardTab
      company={company}
      jobs={jobs}
      jobsTotal={jobsTotal}
      jobsLoading={jobsLoading}
      jobsError={jobsError}
      pageSearch={pageSearch}
      ignoredSaving={ignoredSaving}
      ignoredError={ignoredError}
      onIgnoredChange={(v) => void handleIgnoredChange(v)}
      hideIgnoreBar
    />
  );

  const grokPanel = (
    <CompanyGrokTab
      grok={research.grok}
      grokBusy={grokPending}
      grokOrderStatus={
        grokOrderStatus === 'pending' || grokOrderStatus === 'executing'
          ? grokOrderStatus
          : null
      }
      onAskGrok={() => void handleAskGrok()}
      extensionHint={extensionHint}
    />
  );

  const reportPanel = (
    <div className="space-y-5">
      <CompanyReportTab
        companyName={name}
        analyze={research.analyze}
        analyzing={analyzeBusy}
        onAnalyze={() => void handleAnalyze()}
        grokReady={grokReady}
        layout="main"
      />
      <CompanyJobsStrip
        jobs={jobs}
        jobsTotal={jobsTotal}
        jobsLoading={jobsLoading}
        jobsError={jobsError}
        onViewAll={() => setView('jobboard')}
      />
    </div>
  );

  const tabContent = () => {
    if (analyzerLoading && analyzer === null && activeView !== 'jobboard') {
      return <ContentPanelLoading label="Loading research…" />;
    }

    if (activeView === 'grok') {
      return grokPanel;
    }

    if (activeView === 'jobboard') {
      return jobBoardPanel;
    }

    if (!hasReport) {
      if (hasGrokContent) return grokPanel;
      return jobBoardPanel;
    }

    return reportPanel;
  };

  const showSearchBar = activeView === 'jobboard';

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8 pb-24">
      <Breadcrumbs items={[{ label: 'Companies', to: '/companies' }, { label: name }]} />

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
            {company.platform}
          </span>
          {company.ignored ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              Ignored
            </span>
          ) : null}
          {grokReady ? (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
              Grok ready
            </span>
          ) : grokPending ? (
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600 animate-pulse">
              Grok in progress
            </span>
          ) : null}
          {hasReport ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              Report ready
            </span>
          ) : null}
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
          {company.headquarters ? (
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {company.headquarters}
            </span>
          ) : null}
          {company.employee_range ? (
            <span>{company.employee_range} employees</span>
          ) : null}
          {company.founded != null ? (
            <span>Founded {company.founded}</span>
          ) : null}
          {company.rating != null ? (
            <RatingStars rating={company.rating} reviewCount={company.review_count} size="md" />
          ) : null}
          {company.jobs_count != null && company.jobs_count > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 tabular-nums">
              {company.jobs_count.toLocaleString()} jobs in database
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <CompanyReportActions
            company={company}
            grokPending={grokPending}
            analyzeBusy={analyzeBusy}
            grokReady={grokReady}
            connectedExtension={!!connectedExtension}
            onAskGrok={() => void handleAskGrok()}
            onAnalyze={() => void handleAnalyze()}
            onRefresh={handleRefresh}
          />
          {actionError ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {actionError}
            </p>
          ) : null}
        </div>
      </header>

      {showSearchBar ? (
        <div className="sticky top-[3.5rem] z-10 py-3 mb-6 rounded-xl bg-white/95 backdrop-blur shadow-sm ring-1 ring-slate-200/60 px-4">
          <SearchField
            value={pageSearch}
            onChange={setPageSearch}
            placeholder="Search roles, locations, FAQs on this page…"
            id="company-detail-search"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
        <div className="space-y-5 min-w-0">{tabContent()}</div>

        <CompanyDetailSidebar
          company={company}
          research={research}
          activeView={activeView}
          onViewChange={setView}
          grokPending={grokPending}
          grokReady={grokReady}
          connectedExtension={!!connectedExtension}
          extensionHint={extensionHint}
          contactLinks={contactLinks}
          onIgnoredChange={(v) => void handleIgnoredChange(v)}
          ignoredSaving={ignoredSaving}
          ignoredError={ignoredError}
        />
      </div>
    </main>
  );
};

export default CompanyDetailPage;
