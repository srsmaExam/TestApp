'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui';
import { CheckCircle2, Loader2, MessageSquare, ShieldAlert, ShieldCheck } from 'lucide-react';

interface OtpToggleCardProps {
  initialEnabled: boolean;
}

export function OtpToggleCard({ initialEnabled }: OtpToggleCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (busy) return;
    const nextState = !enabled;
    setBusy(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/teacher/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappOtpEnabled: nextState }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update setting.');
      }

      setEnabled(nextState);
      setFeedback(data.message || (nextState ? 'WhatsApp OTP enabled.' : 'WhatsApp OTP disabled.'));
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update setting. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border border-slate-200/90 shadow-sm transition hover:shadow-md dark:border-slate-800">
      <CardBody className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition ${
                enabled
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              {enabled ? <ShieldCheck className="size-6" /> : <ShieldAlert className="size-6" />}
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Student WhatsApp OTP Login
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    enabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                  }`}
                >
                  {enabled ? 'OTP Enforced' : 'OTP Disabled'}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {enabled
                  ? 'First-time students must verify a 6-digit WhatsApp OTP. Once verified, they log in automatically next time.'
                  : 'WhatsApp OTP is turned off. Students can sign in immediately with just their WhatsApp number.'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {busy && <Loader2 className="size-4 animate-spin text-slate-400" />}

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Toggle WhatsApp OTP requirement"
              disabled={busy}
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900 ${
                enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out dark:bg-slate-100 ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Feedback / Error notices */}
        {feedback && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {feedback}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
