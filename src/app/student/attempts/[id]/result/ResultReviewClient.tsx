'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Sparkles, FileText, CheckCircle2, ArrowRight, Check, X, Lock, Award } from 'lucide-react';
import { Alert, Badge, buttonClass, Card, CardBody, Spinner, Button, Input, Label } from '@/components/ui';
import { Dialog } from '@/components/Dialog';
import { QuestionBody } from '@/components/Katex';
import { BoardReadinessReport } from '@/components/report/BoardReadinessReport';
import {
  evaluateDiagnosticReport,
  getQuestionETS,
  evaluateQuestionTimeManagement,
  evaluateTimeManagement,
  type QuestionMetadataItem,
  type StudentQuestionResponse,
} from '@/lib/diagnostic-evaluator';

type ReviewQuestion = {
  id: string;
  position: number;
  humanCode: string | null;
  body: string;
  type: 'mcq' | 'integer';
  options: any[];
  answer: any;
  solution: string | null;
  difficulty: number | null;
  expectedTimeS: number | null;
  subject: 'physics' | 'chemistry' | 'maths' | 'biology';
  chapter: string | null;
  topic: string | null;
  metadata?: any;
  marks: {
    correct: number;
    wrong: number;
    unattempted: number;
  };
  response: { key?: string; value?: number | string } | null;
  state: string;
  isCorrect: boolean | null;
  isAttempted: boolean;
  marksAwarded: number;
  timeSpentMs: number;
  isOvertime: boolean;
};

type ResultData = {
  attemptId: string;
  testId: string;
  testTitle: string;
  attemptNo: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  totalTimeS: number;
  totalMarks: number;
  maxMarks: number;
  rank: number;
  percentile: number;
  totalParticipants: number;
  isReportUnlocked?: boolean;
  summary: {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    unattemptedCount: number;
    accuracy: number;
    subjectScores: Record<
      string,
      { marks: number; maxMarks: number; correct: number; total: number }
    >;
  };
  questions: ReviewQuestion[];
};

export function ResultReviewClient({
  attemptId,
  userRole,
}: {
  attemptId: string;
  userRole: 'student' | 'teacher';
}) {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awaitingRelease, setAwaitingRelease] = useState(false);

  // Filters
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, correct, wrong, unattempted, overtime

  // Detailed Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [city, setCity] = useState('');
  const [board, setBoard] = useState('CBSE Board');
  const [otherBoard, setOtherBoard] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [school, setSchool] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  const attemptDiagnosticReport = useMemo(() => {
    if (!data?.questions || data.questions.length === 0) return null;
    const metadataList: QuestionMetadataItem[] = data.questions.map((q, idx) => {
      const m = q.metadata || {};
      return {
        qno: q.position || idx + 1,
        subject:
          q.subject === 'maths'
            ? 'Maths'
            : q.subject.charAt(0).toUpperCase() + q.subject.slice(1),
        chapter: q.chapter || 'General',
        topic: q.topic || 'General',
        conceptTested: m.conceptTested || null,
        prerequisiteConcept: m.prerequisiteConcept || null,
        difficulty:
          m.difficultyLabel ||
          (q.difficulty === 1 ? 'Easy' : q.difficulty === 3 ? 'Difficult' : 'Medium'),
        primarySkill: m.primarySkill || 'Concept Application',
        secondarySkill: m.secondarySkill || null,
        questionStructure: m.questionStructure || 'Direct',
        visualDependency: m.visualDependency || 'None',
        expectedTime: m.expectedTime || `${q.expectedTimeS || 60}`,
        answer:
          typeof q.answer === 'object' && (q.answer as any)?.key
            ? (q.answer as any).key
            : typeof q.answer === 'object' && (q.answer as any)?.value !== undefined
            ? String((q.answer as any).value)
            : String(q.answer || 'A'),
        diagnosticWeight: Number(m.diagnosticWeight || 1),
      };
    });

    const responses: StudentQuestionResponse[] = data.questions.map((q, idx) => ({
      qno: q.position || idx + 1,
      attempted: Boolean(q.isAttempted),
      selectedOption:
        q.response && typeof q.response === 'object' && (q.response as any)?.key
          ? (q.response as any).key
          : (q.response as any)?.value !== undefined
          ? String((q.response as any).value)
          : null,
      timeTakenSeconds: Math.round((q.timeSpentMs || 0) / 1000),
    }));

    return evaluateDiagnosticReport(metadataList, {
      studentName: 'Student',
      responses,
    });
  }, [data]);

  const timeManagementMetrics = useMemo(() => {
    if (!data?.questions || data.questions.length === 0) return null;
    return evaluateTimeManagement(
      data.questions.map((q, idx) => ({
        qno: q.position || idx + 1,
        attempted: Boolean(q.isAttempted),
        timeTakenSeconds: Math.round((q.timeSpentMs ?? 0) / 1000),
        expectedUpperBoundS: getQuestionETS(q.metadata?.expectedTime, q.expectedTimeS),
      })),
    );
  }, [data]);

  useEffect(() => {
    if (data) {
      if (data.isReportUnlocked) {
        setReportSubmitted(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('srsma_report_unlocked', 'true');
          localStorage.setItem(`srsma_report_${attemptId}`, 'true');
          window.dispatchEvent(new Event('srsma_report_unlocked'));
        }
      } else {
        setReportSubmitted(false);
      }
    }
  }, [data?.isReportUnlocked, attemptId, data]);

  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      e.preventDefault();
      setShowReportModal(true);
    };
    window.addEventListener('srsma_open_report_modal', handleOpenModal);
    return () => {
      window.removeEventListener('srsma_open_report_modal', handleOpenModal);
    };
  }, []);

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gender) {
      setReportError('Please select your gender.');
      return;
    }
    if (!school.trim()) {
      setReportError('Please enter your school name.');
      return;
    }
    if (!city.trim()) {
      setReportError('Please enter your city.');
      return;
    }
    if (board === 'Other' && !otherBoard.trim()) {
      setReportError('Please enter your board name.');
      return;
    }
    if (!whatsappConsent) {
      setReportError(
        'I give permission to Shri Ram Smart Minds Academy to contact me on my WhatsApp number for sending the detailed report is required.',
      );
      return;
    }
    setSubmittingReport(true);
    setReportError(null);

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
          attemptId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit report details.');
      }

      setReportSubmitted(true);
      setSubmittedSuccess(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('srsma_report_unlocked', 'true');
        localStorage.setItem(`srsma_report_${attemptId}`, 'true');
        window.dispatchEvent(new Event('srsma_report_unlocked'));
      }

      // If response includes solutions, update questions in state instantaneously
      if (json.solutions) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            isReportUnlocked: true,
            questions: prev.questions.map((q) => ({
              ...q,
              solution: json.solutions[q.id] !== undefined ? json.solutions[q.id] : q.solution,
            })),
          };
        });
      } else {
        // Fallback: re-fetch result to ensure solutions are populated
        const refreshRes = await fetch(`/api/attempts/${attemptId}/result`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setData(freshData);
        }
      }
    } catch (err: any) {
      setReportError(err.message || 'Could not unlock solutions and report.');
    } finally {
      setSubmittingReport(false);
    }
  }

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        const res = await fetch(`/api/attempts/${attemptId}/result`);
        const json = await res.json();

        if (!res.ok) {
          if (res.status === 403 && json.error === 'awaiting_release') {
            setAwaitingRelease(true);
            setLoading(false);
            return;
          }
          throw new Error(json.message || 'Failed to load test results');
        }

        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    return data.questions.filter((q) => {
      if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
      if (filterStatus === 'correct' && q.isCorrect !== true) return false;
      if (filterStatus === 'wrong' && (q.isCorrect !== false || !q.isAttempted)) return false;
      if (filterStatus === 'unattempted' && q.isAttempted) return false;

      const timeTakenSec = Math.round((q.timeSpentMs ?? 0) / 1000);
      const ets = getQuestionETS(q.metadata?.expectedTime, q.expectedTimeS);
      const qtm = evaluateQuestionTimeManagement(timeTakenSec, ets);

      if (filterStatus === 'overtime' && timeTakenSec <= 1.5 * ets) return false;
      if (filterStatus === 'good_time' && (!q.isAttempted || qtm.rating !== 'Good')) return false;
      if (filterStatus === 'medium_time' && (!q.isAttempted || qtm.rating !== 'Medium')) return false;
      if (filterStatus === 'poor_time' && (!q.isAttempted || qtm.rating !== 'Poor')) return false;
      if (filterStatus === 'guesswork' && (!q.isAttempted || timeTakenSec >= 20)) return false;

      return true;
    });
  }, [data, filterSubject, filterStatus]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
        <Spinner className="size-8 text-brand-700 dark:text-brand-400" />
        <p className="text-sm font-medium">Loading scorecard and worked solutions...</p>
      </div>
    );
  }

  if (awaitingRelease) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <Card className="p-8">
          <Clock className="mx-auto size-12 text-brand-600 dark:text-brand-400" />
          <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">Results Pending Release</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your attempt was successfully submitted! The results and step-by-step solutions for this test will be released by your teacher once all candidates have finished.
          </p>
          <Link href="/student" className={buttonClass('primary', 'md', 'mt-5')}>
            ← Return to My Tests
          </Link>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <Alert tone="red" title="Error">
          {error ?? 'Result not found'}
        </Alert>
        <Link href={userRole === 'teacher' ? '/teacher/tests' : '/student'} className={buttonClass('secondary', 'md', 'mt-4')}>
          Return
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Navigation breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={userRole === 'teacher' ? `/teacher/tests/${data.testId}/analytics` : '/student'}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← {userRole === 'teacher' ? 'Back to test report' : 'Back to tests'}
        </Link>
      </div>

      {/* 1. Scorecard Hero Banner */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 via-brand-950 to-brand-900 p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-brand-800/90 px-2.5 py-0.5 text-xs font-semibold text-accent-400">
              <Sparkles className="mr-1 size-3" />
              Scorecard & Solutions
            </span>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">{data.testTitle}</h1>
            <p className="mt-0.5 text-xs text-slate-300">
              Submitted on {new Date(data.submittedAt).toLocaleDateString()} at{' '}
              {new Date(data.submittedAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-baseline gap-2 rounded-xl bg-white/10 px-5 py-3 backdrop-blur-sm">
            <span className="text-3xl font-black text-white">{data.totalMarks}</span>
            <span className="text-sm font-semibold text-slate-300">/ {data.maxMarks} Marks</span>
          </div>
        </div>

        {/* Hero KPI metrics grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Rank</p>
            <p className="mt-0.5 text-xl font-bold text-white">
              #{data.rank} <span className="text-xs font-normal text-slate-400">of {data.totalParticipants}</span>
            </p>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Percentile</p>
            <p className="mt-0.5 text-xl font-bold text-accent-400">{data.percentile} %ile</p>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Accuracy</p>
            <p className="tnum mt-0.5 text-xl font-bold text-emerald-400">{data.summary.accuracy}%</p>
            <p className="text-xs text-slate-400">of attempted</p>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Time Spent</p>
            <p className="mt-0.5 text-xl font-bold text-white">{Math.round(data.totalTimeS / 60)} min</p>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Correct / Wrong</p>
            <p className="mt-0.5 text-xl font-bold text-white">
              <span className="text-emerald-400">{data.summary.correctCount}</span>
              <span className="mx-1 text-slate-400">/</span>
              <span className="text-red-400">{data.summary.wrongCount}</span>
            </p>
          </div>

          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Time Management</p>
            <p className="mt-0.5 text-xl font-bold">
              <span
                className={
                  timeManagementMetrics?.rating === 'Good'
                    ? 'text-emerald-400'
                    : timeManagementMetrics?.rating === 'Medium'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {timeManagementMetrics ? `${timeManagementMetrics.finalScorePercent}%` : '—'}
              </span>
            </p>
            <p className="text-xs font-semibold text-slate-300">
              {timeManagementMetrics ? `${timeManagementMetrics.rating}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Front Page Guesswork Alert Banner */}
      {timeManagementMetrics && timeManagementMetrics.guessworkQuestions.length > 0 && (
        <div className="rounded-2xl border border-amber-300/90 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-4 sm:p-5 shadow-xs dark:border-amber-600/40 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40">
          <div className="flex items-start gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-xs mt-0.5">
              ⚠️
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">
                  Rapid Response Alert
                </span>
                <span className="text-xs text-amber-700/80 dark:text-amber-400 font-medium">
                  Attempt Time &lt; 20s
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                There is possibility of guesswork being done in answering{' '}
                <strong className="text-amber-900 dark:text-amber-200 underline decoration-amber-500 decoration-2 underline-offset-2">
                  {timeManagementMetrics.guessworkQuestions.map((q) => `Q${q}`).join(', ')}
                </strong>{' '}
                (responses submitted in less than 20 seconds).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Subject Breakdown Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Only the subjects this paper actually contains. */}
        {(['physics', 'chemistry', 'maths', 'biology'] as const)
          .filter((s) => (data.summary.subjectScores[s]?.total ?? 0) > 0)
          .map((s) => {
            const stats = data.summary.subjectScores[s] ?? { marks: 0, maxMarks: 0, correct: 0, total: 0 };
            // Correct / attempted, matching the hero's definition. This used to
            // divide by `total` (including unattempted), so the same scorecard
            // reported two different accuracies for the same performance.
            const attempted = data.questions.filter((q) => q.subject === s && q.isAttempted).length;
            const acc = attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0;
            return (
              <Card key={s}>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {s}
                    </span>
                    <Badge tone={s === 'physics' ? 'brand' : s === 'chemistry' ? 'green' : s === 'maths' ? 'amber' : 'purple'}>
                      {stats.marks} / {stats.maxMarks} M
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="tnum text-xl font-black text-slate-900 dark:text-slate-100">
                      {stats.marks} Marks
                    </span>
                    <span className="tnum text-xs font-medium text-slate-500 dark:text-slate-400">
                      {acc}% of attempted
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full ${
                        s === 'physics'
                          ? 'bg-brand-600'
                          : s === 'chemistry'
                          ? 'bg-emerald-600'
                          : s === 'maths'
                          ? 'bg-amber-500'
                          : 'bg-purple-600'
                      }`}
                      style={{
                        width: `${Math.max(0, Math.min(100, (stats.marks / Math.max(1, stats.maxMarks)) * 100))}%`,
                      }}
                    />
                  </div>
                </CardBody>
              </Card>
            );
          })}
      </div>

      {/* Multiple Prompts - Hero Prompt Banner / Celebration Banner */}
      {!reportSubmitted ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/15 via-brand-500/15 to-orange-500/15 p-6 shadow-sm dark:border-amber-500/40 dark:bg-gradient-to-r dark:from-amber-950/50 dark:via-brand-950/50 dark:to-orange-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-400/20 dark:text-amber-300">
                  <Lock className="size-3" />
                  Solutions &amp; Reports Locked
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Unlock Complete Step-by-Step Solutions &amp; Detailed Diagnostic Report
              </h2>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-300">
                Get instantaneous access to step-by-step faculty solutions for every question and receive your comprehensive performance diagnostics sent to your WhatsApp.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="shrink-0 rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 shadow-md transition hover:bg-amber-400 hover:shadow-amber-500/20 dark:bg-amber-400 dark:hover:bg-amber-300"
            >
              <FileText className="mr-2 size-4" />
              Access Solutions &amp; Report
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-brand-500/10 p-6 shadow-sm dark:border-emerald-500/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-brand-950/30">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300">
                  <Sparkles className="size-3" />
                  Solutions &amp; Report Unlocked
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Detailed Report Unlocked &amp; Solutions Available!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Review step-by-step solutions below. Your complete personalized diagnostic report is ready to view and has also been sent to your WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDiagnosticModal(true)}
              className="shrink-0 rounded-xl border-emerald-500/40 bg-white px-4 py-2.5 font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
            >
              <Award className="mr-1.5 size-4 text-emerald-600 dark:text-emerald-400" />
              View 3-Page Board Report
            </Button>
            <Link
              href="/student/analytics"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition"
            >
              <FileText className="size-4" />
              Detailed Analytics &amp; History
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Detailed Question Solutions Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Question-by-Question Solutions</h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filters */}
            <div className="flex rounded-md bg-slate-100 p-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {(['all', 'physics', 'chemistry', 'maths', 'biology'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSubject(s)}
                  className={`rounded px-2.5 py-1 capitalize transition-colors ${
                    filterSubject === s ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap rounded-md bg-slate-100 p-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {[
                { id: 'all', label: 'All' },
                { id: 'correct', label: 'Correct' },
                { id: 'wrong', label: 'Wrong' },
                { id: 'unattempted', label: 'Unattempted' },
                { id: 'good_time', label: 'Good Time' },
                { id: 'medium_time', label: 'Medium Time' },
                { id: 'poor_time', label: 'Poor Time (>2x ETS)' },
                { id: 'guesswork', label: 'Guesswork (<20s)' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setFilterStatus(st.id)}
                  className={`rounded px-2.5 py-1 transition-colors ${
                    filterStatus === st.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const timeTakenSec = Math.round((q.timeSpentMs ?? 0) / 1000);
            const ets = getQuestionETS(q.metadata?.expectedTime, q.expectedTimeS);
            const qtm = evaluateQuestionTimeManagement(timeTakenSec, ets);
            const isGuesswork = q.isAttempted && timeTakenSec < 20;
            const isEveryThird =
              (idx + 1) % 3 === 0 || (filteredQuestions.length < 3 && idx === filteredQuestions.length - 1);

            let cardBorder = '';
            if (q.isAttempted) {
              if (q.isCorrect) cardBorder = 'ring-1 ring-emerald-300 dark:ring-emerald-800';
              else cardBorder = 'ring-1 ring-red-300 dark:ring-red-800';
            }

            return (
              <div key={q.id} className="space-y-4">
                <Card className={`${cardBorder} transition-shadow hover:shadow-sm`}>
                  <CardBody className="space-y-4 p-5">
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tnum rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-slate-700">
                          Q{q.position}
                        </span>
                        <Badge
                          tone={
                            q.subject === 'physics'
                              ? 'brand'
                              : q.subject === 'chemistry'
                              ? 'green'
                              : q.subject === 'maths'
                              ? 'amber'
                              : 'purple'
                          }
                        >
                          {q.subject.toUpperCase()}
                        </Badge>
                        <Badge tone="slate">{q.type.toUpperCase()}</Badge>
                        {q.chapter && <span className="text-xs text-slate-500 dark:text-slate-400">• {q.chapter}{q.topic ? ` › ${q.topic}` : ''}</span>}
                        {q.metadata?.primarySkill && (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" title={`Primary Skill: ${q.metadata.primarySkill}`}>
                            🎯 {q.metadata.primarySkill}
                          </span>
                        )}
                        {q.metadata?.cognitiveLevel && (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" title={`Cognitive Level: ${q.metadata.cognitiveLevel}`}>
                            🧠 {q.metadata.cognitiveLevel}
                          </span>
                        )}
                      </div>

                      {/* Score & Time Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Marks Badge */}
                        {q.isAttempted ? (
                          q.isCorrect ? (
                            <Badge tone="green">+{q.marksAwarded} Marks (Correct)</Badge>
                          ) : (
                            <Badge tone="red">{q.marksAwarded} Marks (Wrong)</Badge>
                          )
                        ) : (
                          <Badge tone="slate">0 Marks (Unattempted)</Badge>
                        )}

                        {/* ETS & Time taken */}
                        <span className="tnum flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Clock className="size-3.5 text-slate-500" />
                          <span>{timeTakenSec}s</span>
                          <span className="text-slate-400 dark:text-slate-500 font-normal">
                            (ETS: {ets}s)
                          </span>
                        </span>

                        {/* Time Management Evaluation Badge */}
                        {q.isAttempted && (
                          <Badge
                            tone={
                              qtm.score === 3
                                ? 'green'
                                : qtm.score === 2
                                ? 'amber'
                                : 'red'
                            }
                            className="text-xs font-semibold"
                          >
                            {qtm.label} ({qtm.score} pt{qtm.score > 1 ? 's' : ''})
                          </Badge>
                        )}

                        {/* Guesswork flag */}
                        {isGuesswork && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/80 bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/80 dark:text-amber-200">
                            ⚡ Possible Guesswork (&lt;20s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Diagnostic Concept Info */}
                    {q.metadata?.conceptTested && (
                      <div className="rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Concept Tested:</span>{' '}
                        {q.metadata.conceptTested}
                        {q.metadata.prerequisiteConcept && (
                          <span className="ml-2 text-slate-500 dark:text-slate-400">
                            (Prerequisite: {q.metadata.prerequisiteConcept})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Question Body */}
                    <div className="text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                      <QuestionBody
                        body={q.body}
                        renderImage={(placeholderId) => (
                          <div className="my-2 overflow-hidden rounded border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
                            <img
                              src={`/api/files/images/${q.id}/${placeholderId}`}
                              alt="Figure"
                              className="max-h-60 object-contain"
                            />
                          </div>
                        )}
                      />
                    </div>

                    {/* Option / Answer Review */}
                    <div className="space-y-3 pt-3">
                      {q.type === 'mcq' ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {q.options.map((opt) => {
                            const isStudentPick = q.response?.key === opt.key;
                            const isCorrectKey =
                              q.answer && 'key' in q.answer && q.answer.key === opt.key;

                            const isBoth = isStudentPick && isCorrectKey;
                            const isWrongPick = isStudentPick && !isCorrectKey;

                            let cardClass =
                              'border border-slate-700/80 bg-slate-50/50 text-slate-800 dark:border-slate-800 dark:bg-[#0c1220] dark:text-slate-200';
                            let circleClass =
                              'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400';

                            if (isBoth || isCorrectKey) {
                              cardClass =
                                'border-2 border-emerald-500 bg-emerald-50/70 text-slate-900 ring-1 ring-emerald-500/50 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-slate-100';
                              circleClass = 'bg-[#00c950] text-white font-bold shadow-xs';
                            } else if (isWrongPick) {
                              cardClass =
                                'border-2 border-red-500 bg-red-50/70 text-slate-900 ring-1 ring-red-500/50 dark:border-red-500 dark:bg-red-950/30 dark:text-slate-100';
                              circleClass = 'bg-[#ff334b] text-white font-bold shadow-xs';
                            }

                            return (
                              <div
                                key={opt.key}
                                className={`relative flex min-h-[58px] items-center justify-between rounded-xl p-4 transition-all ${cardClass}`}
                              >
                                {/* Top-Right Badge matching user mockups */}
                                {isBoth ? (
                                  <span className="absolute -top-2.5 right-3 inline-flex items-center rounded-full bg-[#00c950] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                                    YOUR ANSWER | CORRECT ANSWER
                                  </span>
                                ) : isWrongPick ? (
                                  <span className="absolute -top-2.5 right-3 inline-flex items-center rounded-full bg-[#ff334b] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                                    YOUR ANSWER
                                  </span>
                                ) : isCorrectKey ? (
                                  <span className="absolute -top-2.5 right-3 inline-flex items-center rounded-full bg-[#00c950] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                                    CORRECT ANSWER
                                  </span>
                                ) : null}

                                {/* Left & Middle: Letter Circle + Content */}
                                <div className="flex flex-1 items-center gap-3 pr-2">
                                  <span
                                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${circleClass}`}
                                  >
                                    {opt.key}
                                  </span>
                                  <div className="flex-1 text-sm font-medium leading-relaxed">
                                    <QuestionBody
                                      body={opt.body}
                                      renderImage={(imgId) => (
                                        <img
                                          src={`/api/files/images/${q.id}/${imgId}`}
                                          alt="Option figure"
                                          className="my-1 max-h-24 object-contain"
                                        />
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Right End: Check or X Icon */}
                                {isBoth || isCorrectKey ? (
                                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#00c950] text-white shadow-xs">
                                    <Check className="size-4 stroke-[3]" />
                                  </div>
                                ) : isWrongPick ? (
                                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ff334b] text-white shadow-xs">
                                    <X className="size-4 stroke-[3]" />
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Integer / Numerical Review */
                        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-[#0d1424]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Your Response:</span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-sm font-bold ${
                                !q.isAttempted
                                  ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  : q.isCorrect
                                  ? 'border border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                  : 'border border-red-500 bg-red-500/20 text-red-700 dark:text-red-400'
                              }`}
                            >
                              {q.isAttempted && q.response?.value !== undefined ? String(q.response.value) : 'None (Unattempted)'}
                              {q.isAttempted && (q.isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Correct Answer:</span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500 bg-emerald-500/20 px-2.5 py-1 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              {q.answer && 'value' in q.answer
                                ? q.answer.value
                                : q.answer && 'min' in q.answer
                                ? `${q.answer.min} to ${q.answer.max}`
                                : '-'}
                              <Check className="size-3.5" />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Worked Solution (Visible once unlocked) */}
                    {reportSubmitted && (
                      q.solution ? (
                        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-xs text-slate-800 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-slate-200">
                          <div className="mb-2 flex items-center gap-1.5 font-bold text-brand-900 dark:text-brand-300">
                            <Sparkles className="size-4 text-accent-500" />
                            Step-by-Step Solution:
                          </div>
                          <QuestionBody
                            body={q.solution}
                            renderImage={(imgId) => (
                              <img
                                src={`/api/files/images/${q.id}/${imgId}`}
                                alt="Solution figure"
                                className="my-2 max-h-48 object-contain"
                              />
                            )}
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                          No step-by-step solution provided for this question.
                        </div>
                      )
                    )}
                  </CardBody>
                </Card>

                {/* Interstitial banner after every 3 questions */}
                {isEveryThird && (
                  !reportSubmitted ? (
                    <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/15 via-brand-500/15 to-orange-500/15 p-5 sm:p-6 shadow-md dark:border-amber-500/40 dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-brand-950/40 dark:to-orange-950/30">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-400/20 dark:text-amber-300">
                              <Lock className="size-3" />
                              Solutions &amp; Reports Locked
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                            Unlock Complete Step-by-Step Solutions &amp; Detailed Diagnostic Report
                          </h3>
                          <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-300">
                            Want to see verified faculty derivations for each question and get your chapter-wise diagnostic report on WhatsApp?
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={() => setShowReportModal(true)}
                          className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-2.5 font-bold text-slate-950 shadow-md transition hover:bg-amber-400 hover:to-amber-300 hover:shadow-amber-500/20 text-xs sm:text-sm"
                        >
                          <FileText className="mr-1.5 size-4" />
                          Reveal Solutions &amp; Report
                          <ArrowRight className="ml-1.5 size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-brand-500/10 p-5 sm:p-6 shadow-md dark:border-emerald-500/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-brand-950/30">
                      <div className="flex items-center gap-3.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                          <CheckCircle2 className="size-6" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300">
                              <Sparkles className="size-3" />
                              Diagnostic Report Unlocked
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                            Personalized Diagnostic Report Ready
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            Deep dive into your chapter-wise mastery, time distribution, and accuracy trends.
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/student/analytics"
                        className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition"
                      >
                        <FileText className="size-4" />
                        View Diagnostic Report
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  )
                )}
              </div>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No questions match these filters.
            </div>
          )}
        </div>

        {/* Sticky bottom quick-unlock bar when scrolling */}
        {!reportSubmitted && (
          <div className="sticky bottom-4 z-20 mx-auto max-w-2xl rounded-2xl border border-amber-400/80 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md dark:border-amber-500/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400">
                  <Lock className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Full Solutions &amp; Detailed Report Locked</p>
                  <p className="text-[11px] text-slate-400">Enter your details to reveal all question solutions and unlock report.</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300"
              >
                <FileText className="mr-1.5 size-4" />
                Unlock Solutions Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Report Request & Solution Unlock Modal */}
      <Dialog
        isOpen={showReportModal}
        onClose={() => !submittingReport && setShowReportModal(false)}
        size="md"
        title={submittedSuccess ? undefined : 'Unlock Solutions & Detailed Diagnostic Report'}
        description={
          submittedSuccess
            ? undefined
            : 'Enter your city and board to instantly reveal all step-by-step solutions and unlock your detailed report.'
        }
        footer={
          submittedSuccess ? null : (
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={submittingReport}
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="report-details-form"
                size="sm"
                disabled={submittingReport}
                className="bg-brand-700 hover:bg-brand-800 dark:bg-brand-600 font-bold"
              >
                {submittingReport ? 'Unlocking…' : 'Unlock Solutions & Report'}
              </Button>
            </div>
          )
        }
      >
        {submittedSuccess ? (
          <div className="space-y-4 p-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Detailed Report &amp; Solutions Unlocked!
            </h3>
            <p className="mx-auto max-w-sm text-xs text-slate-600 dark:text-slate-300">
              Your detailed report has been sent to your WhatsApp number. All step-by-step solutions and the Report tab are now fully unlocked!
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/student/analytics"
                className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition"
              >
                <FileText className="mr-1.5 size-4" />
                Report Unlocked, View Now
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowReportModal(false);
                  setSubmittedSuccess(false);
                }}
              >
                Review Solutions Below
              </Button>
            </div>
          </div>
        ) : (
          <form id="report-details-form" onSubmit={handleReportSubmit} className="space-y-4 py-2">
            {reportError && (
              <Alert tone="red" className="text-xs">
                {reportError}
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
              <Label htmlFor="report-school-input" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                School <span className="text-red-500">*</span>
              </Label>
              <Input
                id="report-school-input"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Delhi Public School"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="report-city-input" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="report-city-input"
                required
                autoFocus
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="report-board-select" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Board <span className="text-red-500">*</span>
              </Label>
              <select
                id="report-board-select"
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
                <Label htmlFor="report-other-board-input" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Specify Your Board <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="report-other-board-input"
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
                id="report-whatsapp-consent"
                type="checkbox"
                required
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <Label htmlFor="report-whatsapp-consent" className="cursor-pointer text-xs font-medium leading-snug text-slate-700 dark:text-slate-200">
                <strong className="text-red-500 mr-0.5">*</strong>
                I give permission to Shri Ram Smart Minds Academy to contact me on my WhatsApp number for sending the detailed report.
              </Label>
            </div>
          </form>
        )}
      </Dialog>

      {/* 3-Page Diagnostic Report Modal */}
      {attemptDiagnosticReport && (
        <Dialog
          isOpen={showDiagnosticModal}
          onClose={() => setShowDiagnosticModal(false)}
          size="2xl"
          title="Class X SRSMA Board Readiness Challenge Report"
        >
          <div className="max-h-[85vh] overflow-y-auto p-2 sm:p-6">
            <BoardReadinessReport report={attemptDiagnosticReport} />
          </div>
        </Dialog>
      )}
    </div>
  );
}
