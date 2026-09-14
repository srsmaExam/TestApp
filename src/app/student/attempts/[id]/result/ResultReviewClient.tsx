'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { Alert, Badge, buttonClass, Card, CardBody, Spinner, Button, Input, Label } from '@/components/ui';
import { Dialog } from '@/components/Dialog';
import { QuestionBody } from '@/components/Katex';

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
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`srsma_report_${attemptId}`);
      if (saved) setReportSubmitted(true);
    }
  }, [attemptId]);

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) {
      setReportError('Please enter your city.');
      return;
    }
    if (board === 'Other' && !otherBoard.trim()) {
      setReportError('Please enter your board name.');
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
          whatsappConsent,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit report details.');
      }

      setReportSubmitted(true);
      setSubmittedSuccess(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`srsma_report_${attemptId}`, 'true');
      }
    } catch (err: any) {
      setReportError(err.message || 'Could not submit report request.');
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
      if (filterStatus === 'overtime' && !q.isOvertime) return false;
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
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-5">
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

          <div className="col-span-2 rounded-lg bg-white/5 p-3 text-center sm:col-span-1">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Correct / Wrong</p>
            <p className="mt-0.5 text-xl font-bold text-white">
              <span className="text-emerald-400">{data.summary.correctCount}</span>
              <span className="mx-1 text-slate-400">/</span>
              <span className="text-red-400">{data.summary.wrongCount}</span>
            </p>
          </div>
        </div>
      </div>

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

      {/* Detailed Report Prompt Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-orange-500/10 p-6 shadow-sm dark:border-amber-500/30 dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-brand-950/40 dark:to-orange-950/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-400/20 dark:text-amber-300">
                <Sparkles className="size-3" />
                Personalized Diagnostic Analysis
              </span>
              {reportSubmitted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" />
                  Report Requested
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {reportSubmitted
                ? 'Your Detailed Report is Being Prepared!'
                : 'Unlock Your Detailed Performance & Improvement Report'}
            </h2>
            <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-300">
              {reportSubmitted
                ? 'Our mentors are compiling your weak-area breakdown and recommendations to send to your WhatsApp number.'
                : 'Discover your subject-wise gaps, time-management efficiency, and tailored preparation roadmap sent to your WhatsApp.'}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-slate-950 shadow-md transition hover:bg-amber-400 hover:shadow-amber-500/20 dark:bg-amber-400 dark:hover:bg-amber-300"
          >
            <FileText className="mr-2 size-4" />
            {reportSubmitted ? 'Update Details' : 'View Detailed Report'}
            <ArrowRight className="ml-1.5 size-4" />
          </Button>
        </div>
      </div>

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
            <div className="flex rounded-md bg-slate-100 p-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {[
                { id: 'all', label: 'All' },
                { id: 'correct', label: 'Correct' },
                { id: 'wrong', label: 'Wrong' },
                { id: 'unattempted', label: 'Unattempted' },
                { id: 'overtime', label: 'Overtime (>1.5x)' },
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

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const timeTakenSec = Math.round((q.timeSpentMs ?? 0) / 1000);
            const expectedSec = q.expectedTimeS ?? 120;

            let cardBorder = '';
            if (q.isAttempted) {
              if (q.isCorrect) cardBorder = 'ring-1 ring-emerald-300 dark:ring-emerald-800';
              else cardBorder = 'ring-1 ring-red-300 dark:ring-red-800';
            }

            return (
              <Card key={q.id} className={`${cardBorder} transition-shadow hover:shadow-sm`}>
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
                      {q.chapter && <span className="text-xs text-slate-500 dark:text-slate-400">• {q.chapter}</span>}
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

                      {/* Time taken */}
                      <span className="tnum flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="size-3.5" />
                        {timeTakenSec}s (Exp: {expectedSec}s)
                      </span>

                      {/* Overtime warning flag */}
                      {q.isOvertime && (
                        <Badge tone="amber" className="text-xs">
                          Overtime ({timeTakenSec}s &gt; {Math.round(expectedSec * 1.5)}s)
                        </Badge>
                      )}
                    </div>
                  </div>

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
                  <div className="space-y-2 pt-2">
                    {q.type === 'mcq' ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt) => {
                          const isStudentPick = q.response?.key === opt.key;
                          const isCorrectKey =
                            q.answer && 'key' in q.answer && q.answer.key === opt.key;

                          let optionClass =
                            'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300';
                          if (isCorrectKey) {
                            optionClass =
                              'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-700';
                          } else if (isStudentPick && !q.isCorrect) {
                            optionClass =
                              'border-red-500 bg-red-50 text-red-900 font-semibold ring-1 ring-red-500 dark:border-red-600 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-700';
                          }

                          return (
                            <div
                              key={opt.key}
                              className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${optionClass}`}
                            >
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current font-bold">
                                {opt.key}
                              </span>
                              <div className="flex-1">
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
                              {isCorrectKey && (
                                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white">
                                  Correct Key
                                </span>
                              )}
                              {isStudentPick && !isCorrectKey && (
                                <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Integer / Numerical Review */
                      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Your Response: </span>
                          <strong
                            className={`tnum ${
                              !q.isAttempted
                                ? 'text-slate-500 dark:text-slate-400'
                                : q.isCorrect
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {q.isAttempted && q.response?.value !== undefined ? String(q.response.value) : 'None'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Correct Answer: </span>
                          <strong className="tnum text-emerald-700 dark:text-emerald-400">
                            {q.answer && 'value' in q.answer
                              ? q.answer.value
                              : q.answer && 'min' in q.answer
                              ? `${q.answer.min} to ${q.answer.max}`
                              : '-'}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Worked Solution */}
                  {q.solution && (
                    <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-xs text-slate-800 dark:border-brand-900 dark:bg-brand-950/40 dark:text-slate-200">
                      <div className="mb-1 flex items-center gap-1.5 font-bold text-brand-900 dark:text-brand-300">
                        <Sparkles className="size-3.5 text-accent-500" />
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
                  )}
                </CardBody>
              </Card>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No questions match these filters.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Report Request Modal */}
      {/* Detailed Report Request Modal */}
      <Dialog
        isOpen={showReportModal}
        onClose={() => !submittingReport && setShowReportModal(false)}
        size="md"
        title={submittedSuccess ? undefined : 'Get Your Detailed Diagnostic Report'}
        description={
          submittedSuccess
            ? undefined
            : 'Fill in your city and curriculum board so we can customize your performance analysis.'
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
                className="bg-brand-700 hover:bg-brand-800 dark:bg-brand-600"
              >
                {submittingReport ? 'Sending…' : 'Send My Detailed Report'}
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
              Detailed Report Requested!
            </h3>
            <p className="mx-auto max-w-sm text-xs text-slate-600 dark:text-slate-300">
              Thank you! Your personalized diagnostic report is being compiled by Shri Ram Smart Minds Academy faculty and will be sent to your WhatsApp number.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setSubmittedSuccess(false);
                }}
                className="bg-brand-700 hover:bg-brand-800 dark:bg-brand-600"
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

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <input
                id="report-whatsapp-consent"
                type="checkbox"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <Label htmlFor="report-whatsapp-consent" className="cursor-pointer text-xs leading-snug text-slate-600 dark:text-slate-300">
                I give permission to Shri Ram Smart Minds Academy to contact me on my WhatsApp number for sending the detailed report.
              </Label>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
