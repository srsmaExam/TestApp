'use client';

import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2, MessageSquareHeart, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface DiagnosticFeedbackWidgetProps {
  attemptId?: string;
  testId?: string;
  sourceTab: 'report' | 'solutions';
  className?: string;
}

export function DiagnosticFeedbackWidget({
  attemptId,
  testId,
  sourceTab,
  className = '',
}: DiagnosticFeedbackWidgetProps) {
  const [testRating, setTestRating] = useState<number | null>(null);
  const [testHover, setTestHover] = useState<number | null>(null);

  const [reportRating, setReportRating] = useState<number | null>(null);
  const [reportHover, setReportHover] = useState<number | null>(null);

  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch existing feedback if any
  useEffect(() => {
    let isMounted = true;
    if (!attemptId) return;

    setLoading(true);
    fetch(`/api/student/feedback?attemptId=${encodeURIComponent(attemptId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.feedback) return;
        if (data.feedback.testRating) setTestRating(data.feedback.testRating);
        if (data.feedback.reportRating) setReportRating(data.feedback.reportRating);
        if (data.feedback.feedbackText) setFeedbackText(data.feedback.feedbackText);
        setSubmitted(true);
      })
      .catch((err) => {
        console.warn('[feedback] failed to fetch existing feedback', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRating && !reportRating && !feedbackText.trim()) {
      setErrorMsg('Please select a rating or enter your comments.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/student/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attemptId || null,
          testId: testId || null,
          testRating: testRating || null,
          reportRating: reportRating || null,
          feedbackText: feedbackText.trim() || null,
          sourceTab,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit feedback.');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit feedback.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const RATING_LABELS = ['', 'Needs Work', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div
      className={`no-print rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 p-5 sm:p-6 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shadow-2xs shrink-0">
            <MessageSquareHeart className="size-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Student Feedback on Diagnostic Test &amp; Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your feedback helps our faculty refine diagnostic evaluations and make learning more impactful!
            </p>
          </div>
        </div>

        {submitted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Feedback Saved
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="size-4 animate-spin text-brand-600" />
          <span>Loading feedback…</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Diagnostic Test Rating */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800/80 dark:bg-slate-900/60 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Diagnostic Test Experience
                </span>
                <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 min-h-[16px]">
                  {RATING_LABELS[testHover ?? testRating ?? 0]}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Question quality, exam interface, and testing balance
              </p>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (testHover ?? testRating ?? 0) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTestRating(star)}
                      onMouseEnter={() => setTestHover(star)}
                      onMouseLeave={() => setTestHover(null)}
                      className="p-1 rounded-md transition-all hover:scale-110 active:scale-95 focus:outline-hidden"
                      aria-label={`Rate test ${star} stars`}
                    >
                      <Star
                        className={`size-5 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Diagnostic Report Rating */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800/80 dark:bg-slate-900/60 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Diagnostic Report Clarity &amp; Value
                </span>
                <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 min-h-[16px]">
                  {RATING_LABELS[reportHover ?? reportRating ?? 0]}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Strength analysis, priority gaps, and actionable recommendations
              </p>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (reportHover ?? reportRating ?? 0) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReportRating(star)}
                      onMouseEnter={() => setReportHover(star)}
                      onMouseLeave={() => setReportHover(null)}
                      className="p-1 rounded-md transition-all hover:scale-110 active:scale-95 focus:outline-hidden"
                      aria-label={`Rate report ${star} stars`}
                    >
                      <Star
                        className={`size-5 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback Text Comment Box */}
          <div className="space-y-1.5">
            <label
              htmlFor={`diagnostic-feedback-${sourceTab}`}
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Any suggestions or thoughts on the test and report? (Optional)
            </label>
            <textarea
              id={`diagnostic-feedback-${sourceTab}`}
              rows={2}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what you liked or how we can make our Board diagnostic tests even better…"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs transition focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {submitted
                ? 'Your feedback has been registered. You can modify it and re-submit anytime.'
                : 'Takes just 10 seconds to help us build a better student experience.'}
            </p>
            <Button
              type="submit"
              disabled={submitting}
              size="sm"
              className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2 shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>{submitted ? 'Update Feedback' : 'Submit Feedback'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
