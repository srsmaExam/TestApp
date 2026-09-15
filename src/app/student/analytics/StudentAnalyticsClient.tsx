'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  RotateCw,
  Target,
  TrendingUp,
  Lock,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import {
  Alert,
  Badge,
  Button,
  buttonClass,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
  StatTile,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Label,
} from '@/components/ui';
import { Dialog } from '@/components/Dialog';
import { BoardReadinessReport } from '@/components/report/BoardReadinessReport';
import type { DiagnosticEvaluationResult } from '@/lib/diagnostic-evaluator';

interface StudentAnalyticsData {
  isReportUnlocked?: boolean;
  totalAttempts: number;
  avgScore: number;
  avgPercentile: number | null;
  diagnosticReport?: DiagnosticEvaluationResult | null;
  sampleDiagnosticReport?: DiagnosticEvaluationResult | null;
  recentTests: Array<{
    attemptId: string;
    testTitle: string;
    submittedAt: string | null;
    score: number;
    maxMarks: number;
    percentile: number | null;
  }>;
  subjectBreakdown: {
    physics?: { attempted: number; correct: number; accuracy: number };
    chemistry?: { attempted: number; correct: number; accuracy: number };
    maths?: { attempted: number; correct: number; accuracy: number };
    biology?: { attempted: number; correct: number; accuracy: number };
  };
  chapterBreakdown: Array<{
    chapter: string;
    subject: string;
    attempted: number;
    correct: number;
    total: number;
    accuracy: number;
  }>;
}

export function StudentAnalyticsClient({
  studentName,
  studentId,
  isTeacherView = false,
}: {
  studentName?: string;
  studentId?: string;
  isTeacherView?: boolean;
}) {
  const [data, setData] = useState<StudentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'report' | 'charts'>('report');
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  // Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [city, setCity] = useState('');
  const [board, setBoard] = useState('CBSE Board');
  const [otherBoard, setOtherBoard] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [school, setSchool] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const url = studentId
        ? `/api/analytics/student/me?studentId=${encodeURIComponent(studentId)}`
        : '/api/analytics/student/me';
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to load analytics');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Could not load student analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [studentId]);

  useEffect(() => {
    if (isTeacherView) return;
    const isLocalUnlocked =
      typeof window !== 'undefined' && localStorage.getItem('srsma_report_unlocked') === 'true';
    if (data && data.isReportUnlocked === false && !isLocalUnlocked) {
      setShowUnlockModal(true);
    }
  }, [data, isTeacherView]);

  useEffect(() => {
    if (isTeacherView) return;
    const handleOpenModal = (e: Event) => {
      e.preventDefault();
      setShowUnlockModal(true);
    };
    window.addEventListener('srsma_open_report_modal', handleOpenModal);
    return () => {
      window.removeEventListener('srsma_open_report_modal', handleOpenModal);
    };
  }, [isTeacherView]);

  async function handleUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gender) {
      setUnlockError('Please select your gender.');
      return;
    }
    if (!school.trim()) {
      setUnlockError('Please enter your school name.');
      return;
    }
    if (!city.trim()) {
      setUnlockError('Please enter your city.');
      return;
    }
    if (board === 'Other' && !otherBoard.trim()) {
      setUnlockError('Please enter your board name.');
      return;
    }
    if (!whatsappConsent) {
      setUnlockError(
        'I give permission to Shri Ram Smart Minds Academy to contact me on my WhatsApp number for sending the detailed report is required.',
      );
      return;
    }

    setSubmitting(true);
    setUnlockError(null);

    try {
      const res = await fetch('/api/student/report-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city.trim(),
          board,
          otherBoard: board === 'Other' ? otherBoard.trim() : undefined,
          gender,
          school: school.trim(),
          whatsappConsent: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to unlock detailed report.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('srsma_report_unlocked', 'true');
        window.dispatchEvent(new Event('srsma_report_unlocked'));
      }

      setShowUnlockModal(false);
      loadData();
    } catch (err: any) {
      setUnlockError(err.message || 'Could not unlock report.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <Spinner className="size-8 text-brand-700 dark:text-brand-400" />
        <p className="text-sm font-medium">Computing your performance trends...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Alert tone="red" title="Failed to load analytics">
          {error ?? 'Failed to load analytics'}
        </Alert>
        <Button variant="secondary" size="sm" onClick={loadData}>
          <RotateCw className="mr-1.5 size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const isLocalUnlocked =
    typeof window !== 'undefined' && localStorage.getItem('srsma_report_unlocked') === 'true';
  const isLocked = data.isReportUnlocked === false && !isLocalUnlocked;

  if (isLocked) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Performance &amp; Diagnostic Report
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Personalized insights, percentile trends, and curriculum gap analysis.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-500/15 via-brand-950/40 to-slate-900 p-8 text-center shadow-lg dark:border-amber-500/40">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 shadow-inner">
            <Lock className="size-8" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Your Detailed Diagnostic Report is Locked
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-600 sm:text-sm dark:text-slate-300">
            Unlock your personalized percentile trends, subject accuracy radars, and chapter-by-chapter mastery breakdown.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-950 shadow-md hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-300"
            >
              <FileText className="mr-2 size-4" />
              Unlock Detailed Report
            </Button>
          </div>
        </div>

        {/* Modal */}
        <Dialog
          isOpen={showUnlockModal}
          onClose={() => !submitting && setShowUnlockModal(false)}
          size="md"
          title="Unlock Your Detailed Diagnostic Report"
          description="Enter your city and curriculum board so we can tailor your diagnostic report and send it to your WhatsApp."
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={submitting}
                onClick={() => setShowUnlockModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="unlock-report-form"
                size="sm"
                disabled={submitting}
                className="bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 font-bold"
              >
                {submitting ? 'Unlocking…' : 'Unlock Detailed Report'}
              </Button>
            </div>
          }
        >
          <form id="unlock-report-form" onSubmit={handleUnlockSubmit} className="space-y-4 py-2">
            {unlockError && (
              <Alert tone="red" className="text-xs">
                {unlockError}
              </Alert>
            )}

            <div>
              <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gender <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`flex items-center justify-center rounded-xl border py-2.5 px-4 text-sm font-bold transition-all ${
                    gender === 'Male'
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm ring-2 ring-brand-500/30 dark:border-brand-400 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`flex items-center justify-center rounded-xl border py-2.5 px-4 text-sm font-bold transition-all ${
                    gender === 'Female'
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm ring-2 ring-brand-500/30 dark:border-brand-400 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="unlock-school" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                School <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unlock-school"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Delhi Public School"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="unlock-city" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unlock-city"
                required
                autoFocus
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="unlock-board" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Board <span className="text-red-500">*</span>
              </Label>
              <select
                id="unlock-board"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="State Board">State Board</option>
                <option value="CBSE Board">CBSE Board</option>
                <option value="ICSE Board">ICSE Board</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {board === 'Other' && (
              <div>
                <Label htmlFor="unlock-other-board" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Specify Your Board <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unlock-other-board"
                  required
                  value={otherBoard}
                  onChange={(e) => setOtherBoard(e.target.value)}
                  placeholder="e.g. Cambridge, IB, etc."
                  className="text-sm"
                />
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50/50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20">
              <input
                id="unlock-whatsapp-consent"
                type="checkbox"
                required
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <Label htmlFor="unlock-whatsapp-consent" className="cursor-pointer text-xs font-medium leading-snug text-slate-700 dark:text-slate-200">
                <strong className="text-red-500 mr-0.5">*</strong>
                I give permission to Shri Ram Smart Minds Academy to contact me on my WhatsApp number for sending the detailed report.
              </Label>
            </div>
          </form>
        </Dialog>
      </div>
    );
  }

  if (data.totalAttempts === 0 && !showSamplePreview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            SRSMA Board Readiness Challenge Report
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Personalized diagnostic evaluation, cognitive skills profile, and actionable Class X Board recommendations.
          </p>
        </div>

        <EmptyState
          title="No completed tests yet"
          hint={
            isTeacherView
              ? "This student has not completed or submitted any tests yet."
              : "Take and submit your first Board Readiness Challenge test to unlock your personalized 3-page diagnostic report with Board Readiness Index (BRI), cognitive skills breakdown, and priority gaps."
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isTeacherView && (
                <Link href="/student" className={buttonClass('primary', 'md')}>
                  Browse Available Tests
                </Link>
              )}
              {data.sampleDiagnosticReport && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowSamplePreview(true)}
                  className="border-amber-400/60 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                >
                  <FileText className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
                  Preview Sample 3-Page Report
                </Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  const activeReport = showSamplePreview ? data.sampleDiagnosticReport : data.diagnosticReport;

  // Chart Data: Score progression
  const trendChartData = [...data.recentTests]
    .reverse()
    .map((t) => ({
      name: t.testTitle.length > 18 ? t.testTitle.slice(0, 16) + '...' : t.testTitle,
      score: t.score,
      maxMarks: t.maxMarks,
      percentile: t.percentile !== null ? t.percentile : null,
    }));

  // Subject Bar Data
  const subjectChartData = [
    { subject: 'Physics', accuracy: data.subjectBreakdown.physics?.accuracy ?? 0, fill: '#3b5bdb' },
    { subject: 'Chemistry', accuracy: data.subjectBreakdown.chemistry?.accuracy ?? 0, fill: '#059669' },
    { subject: 'Maths', accuracy: data.subjectBreakdown.maths?.accuracy ?? 0, fill: '#f59e0b' },
    { subject: 'Biology', accuracy: data.subjectBreakdown.biology?.accuracy ?? 0, fill: '#9333ea' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Sample Preview Banner */}
      {showSamplePreview && (
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs shadow-sm dark:border-amber-800/80 dark:bg-amber-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
              ★
            </div>
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-200">
                Demonstration Preview Mode
              </p>
              <p className="text-amber-800 dark:text-amber-300/80 text-[11px]">
                Viewing the 3-page Board Readiness Challenge Report with sample Class X student attempt responses.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSamplePreview(false)}
            className="shrink-0 font-bold"
          >
            Exit Sample Preview
          </Button>
        </div>
      )}

      {/* Main View Switcher (Only shown if student has actual attempts & reports) */}
      {data.totalAttempts > 0 && data.diagnosticReport && (
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              SRSMA Diagnostic &amp; Performance Report
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Personalized Board readiness evaluation for <strong>{studentName}</strong>
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setViewTab('report')}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                viewTab === 'report'
                  ? 'bg-white text-brand-700 shadow-xs dark:bg-slate-900 dark:text-brand-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              📄 3-Page Board Readiness Report
            </button>
            <button
              type="button"
              onClick={() => setViewTab('charts')}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                viewTab === 'charts'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              📈 Historical Curves &amp; Radar
            </button>
          </div>
        </div>
      )}

      {/* 1. Primary View: 3-Page SRSMA Board Readiness Challenge Report */}
      {viewTab === 'report' && activeReport && (
        <BoardReadinessReport report={activeReport} />
      )}

      {/* 2. Secondary View: Historical Charts & Analytics */}
      {(viewTab === 'charts' || (!activeReport && data.totalAttempts > 0)) && (
        <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Average Percentile"
          value={data.avgPercentile !== null ? `${data.avgPercentile} %ile` : '—'}
          tone="brand"
          subtext={`Across ${data.totalAttempts} completed exam${data.totalAttempts === 1 ? '' : 's'}`}
          icon={<Award className="size-4" />}
        />
        <StatTile
          label="Average Score"
          value={`${data.avgScore} Marks`}
          tone="emerald"
          subtext="Mean marks per mock attempt"
          icon={<TrendingUp className="size-4" />}
        />
        <StatTile
          label="Tests Attempted"
          value={data.totalAttempts}
          tone="amber"
          subtext="Practice & timed exams"
          icon={<Target className="size-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Progression Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Score Progression Curve</CardTitle>
          </CardHeader>
          <CardBody className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="name" className="text-slate-500 dark:text-slate-400" fontSize={11} />
                  <YAxis className="text-slate-500 dark:text-slate-400" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface, #ffffff)',
                      borderColor: 'var(--color-hairline, #e2e8f0)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--color-ink, #0f172a)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score (Marks)"
                    stroke="#3b5bdb"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentile"
                    name="Percentile (%ile)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Subject Accuracy Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-Wise Accuracy (%)</CardTitle>
          </CardHeader>
          <CardBody className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="subject" className="text-slate-500 dark:text-slate-400" fontSize={11} />
                  <YAxis className="text-slate-500 dark:text-slate-400" fontSize={11} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface, #ffffff)',
                      borderColor: 'var(--color-hairline, #e2e8f0)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--color-ink, #0f172a)',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Accuracy']}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {subjectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Chapter Strength & Weakness List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Chapter Mastery & Weak Areas</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Questions Attempted</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead className="text-right">Proficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.chapterBreakdown.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-bold uppercase text-slate-700 dark:text-slate-300">
                    <Badge
                      tone={
                        c.subject === 'physics'
                          ? 'brand'
                          : c.subject === 'chemistry'
                          ? 'green'
                          : c.subject === 'maths'
                          ? 'amber'
                          : 'purple'
                      }
                    >
                      {c.subject}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{c.chapter}</TableCell>
                  <TableCell className="tnum text-slate-600 dark:text-slate-400">
                    {c.correct} correct / {c.attempted} attempted ({c.total} served)
                  </TableCell>
                  <TableCell className="tnum font-bold text-slate-900 dark:text-slate-100">{c.accuracy}%</TableCell>
                  <TableCell className="text-right">
                    {c.accuracy >= 70 ? (
                      <Badge tone="green">Mastered</Badge>
                    ) : c.accuracy >= 40 ? (
                      <Badge tone="amber">Needs Practice</Badge>
                    ) : (
                      <Badge tone="red">Weak Chapter</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data.chapterBreakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500">
                    No chapter breakdown data available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
        </div>
      )}
    </div>
  );
}
