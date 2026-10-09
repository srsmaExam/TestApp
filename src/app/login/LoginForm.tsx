'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Label } from '@/components/ui';
import { Dialog } from '@/components/Dialog';
import { ArrowLeft, MessageSquare, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { trackGaEvent } from '@/lib/analytics';

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 India (+91)' },
  { code: '+1', label: '🇺🇸 US / Canada (+1)' },
  { code: '+44', label: '🇬🇧 UK (+44)' },
  { code: '+971', label: '🇦🇪 UAE (+971)' },
  { code: '+65', label: '🇸🇬 Singapore (+65)' },
  { code: '+61', label: '🇦🇺 Australia (+61)' },
  { code: '+966', label: '🇸🇦 Saudi Arabia (+966)' },
  { code: '+974', label: '🇶🇦 Qatar (+974)' },
  { code: '+968', label: '🇴🇲 Oman (+968)' },
  { code: '+965', label: '🇰🇼 Kuwait (+965)' },
  { code: '+973', label: '🇧🇭 Bahrain (+973)' },
  { code: '+49', label: '🇩🇪 Germany (+49)' },
  { code: '+33', label: '🇫🇷 France (+33)' },
  { code: '+81', label: '🇯🇵 Japan (+81)' },
  { code: '+60', label: '🇲🇾 Malaysia (+60)' },
  { code: '+977', label: '🇳🇵 Nepal (+977)' },
  { code: '+880', label: '🇧🇩 Bangladesh (+880)' },
  { code: '+94', label: '🇱🇰 Sri Lanka (+94)' },
  { code: 'other', label: '🌐 Other (Enter code)' },
];

const CLASS_OPTIONS = ['8', '9', '10', '11', '12', '13'];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  // Step state: 'phone' or 'otp'
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // Phone inputs
  const [selectedCode, setSelectedCode] = useState('+91');
  const [customCode, setCustomCode] = useState('');
  const [phone, setPhone] = useState('');

  // OTP inputs
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isMockOtp, setIsMockOtp] = useState(false);

  // New Student details (if registering for the first time)
  const [requiresDetails, setRequiresDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('10');

  // Status & error
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const notice =
    params.get('reason') === 'session_expired'
      ? 'Your session expired. Please sign in again.'
      : null;

  const effectiveCountryCode = selectedCode === 'other' ? customCode : selectedCode;

  // Auto-redirect if student already has a valid session
  useEffect(() => {
    fetch('/api/analytics/student/me')
      .then((res) => {
        if (res.ok) router.replace('/student');
      })
      .catch(() => { });
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle direct login for already verified students or when OTP is disabled
  async function executeDirectLogin(fullName?: string, classLevel?: string) {
    const cleanDigits = phone.replace(/\D/g, '');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanDigits,
        countryCode: effectiveCountryCode,
        fullName: fullName || undefined,
        classLevel: classLevel || undefined,
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message ?? 'Sign-in failed. Please verify your WhatsApp number.');
    }

    trackGaEvent(fullName ? 'sign_up' : 'login', {
      method: 'direct_phone',
      class_level: classLevel,
    });

    router.replace(body.homeUrl || '/student');
    router.refresh();
  }

  // Handle phone submit
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccessNotice(null);

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 7) {
      setError('Please enter a valid WhatsApp number (at least 7 digits).');
      setBusy(false);
      return;
    }

    if (selectedCode === 'other' && !customCode.trim()) {
      setError('Please enter your country code (e.g. +91).');
      setBusy(false);
      return;
    }

    try {
      // 1. Check if phone exists and is already verified
      const checkRes = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanDigits,
          countryCode: effectiveCountryCode,
        }),
      });

      const checkData = await checkRes.json();
      if (!checkRes.ok) {
        setError(checkData.message ?? 'Failed to verify WhatsApp number.');
        setBusy(false);
        return;
      }

      // If OTP authentication is globally disabled by teacher:
      if (checkData.otpAuthEnabled === false) {
        if (checkData.requiresDetails) {
          if (checkData.fullName) setStudentName(checkData.fullName);
          if (checkData.classLevel) setSelectedClass(checkData.classLevel);
          setShowDetailsModal(true);
          setBusy(false);
          return;
        }
        await executeDirectLogin();
        return;
      }

      // If user exists AND phone is already verified -> Automatic instant login!
      // (No WhatsApp message sent, zero friction next time)
      if (checkData.exists && checkData.phoneVerified) {
        await executeDirectLogin();
        return;
      }

      // If details required for new profile
      setRequiresDetails(Boolean(checkData.requiresDetails));
      if (checkData.fullName) setStudentName(checkData.fullName);
      if (checkData.classLevel) setSelectedClass(checkData.classLevel);

      // 2. Dispatch WhatsApp OTP
      const otpRes = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanDigits,
          countryCode: effectiveCountryCode,
        }),
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        setError(otpData.message ?? 'Failed to send WhatsApp verification code.');
        setBusy(false);
        return;
      }

      setIsMockOtp(Boolean(otpData.isMock));
      setResendCooldown(otpData.cooldownSeconds || 30);
      setSuccessNotice('A 6-digit verification code has been sent to your WhatsApp.');
      setStep('otp');
      setBusy(false);

      trackGaEvent('generate_lead', {
        method: 'whatsapp_otp',
      });

      // Auto focus first OTP input box on next tick
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Could not reach the server. Please check your internet connection.');
      setBusy(false);
    }
  }

  // Handle Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || busy) return;
    setBusy(true);
    setError(null);

    const cleanDigits = phone.replace(/\D/g, '');
    try {
      const otpRes = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanDigits,
          countryCode: effectiveCountryCode,
        }),
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        setError(otpData.message ?? 'Failed to resend verification code.');
        setBusy(false);
        return;
      }

      setIsMockOtp(Boolean(otpData.isMock));
      setResendCooldown(otpData.cooldownSeconds || 30);
      setSuccessNotice('A new verification code has been sent to your WhatsApp.');
      setBusy(false);
    } catch (err: any) {
      setError(err.message || 'Could not resend code. Please try again.');
      setBusy(false);
    }
  }

  // Handle OTP digit typing
  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) {
      // Handle paste of full 6-digit code
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  // Handle profile details submit when OTP is disabled
  async function handleDetailsModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await executeDirectLogin(studentName.trim(), selectedClass);
      setShowDetailsModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to complete sign-in. Please try again.');
      setBusy(false);
    }
  }

  // Handle OTP Verification & Complete Sign In
  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (requiresDetails && !studentName.trim()) {
      setError('Please enter your full name to set up your account.');
      return;
    }

    setBusy(true);
    setError(null);

    const cleanDigits = phone.replace(/\D/g, '');
    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanDigits,
          countryCode: effectiveCountryCode,
          otp: otpCode,
          fullName: requiresDetails ? studentName.trim() : undefined,
          classLevel: requiresDetails ? selectedClass : undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message ?? 'Verification failed. Please check the code.');
      }

      trackGaEvent(requiresDetails ? 'sign_up' : 'login', {
        method: 'whatsapp_otp',
        class_level: requiresDetails ? selectedClass : undefined,
      });

      router.replace(body.homeUrl || '/student');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200/80 transition-colors dark:bg-slate-900 dark:ring-slate-800">
      {notice && (
        <Alert tone="brand" className="mb-4 text-xs">
          {notice}
        </Alert>
      )}

      {error && (
        <Alert tone="red" className="mb-4 text-xs" role="alert">
          {error}
        </Alert>
      )}

      {successNotice && step === 'otp' && (
        <Alert tone="brand" className="mb-4 text-xs">
          {successNotice}
        </Alert>
      )}

      {/* STEP 1: Enter Phone Number */}
      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} aria-label="Student sign in">
          <div className="mb-5">
            <Label htmlFor="phone-input" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              WhatsApp Number
            </Label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <div className={selectedCode === 'other' ? 'w-28 flex-shrink-0' : 'w-36 flex-shrink-0'}>
                <select
                  id="country-code-select"
                  aria-label="Country Code"
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* If 'other' is selected, provide custom country code text input */}
              {selectedCode === 'other' && (
                <div className="w-20 flex-shrink-0">
                  <Input
                    id="custom-country-code"
                    placeholder="+XX"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="text-center font-mono text-sm"
                    required
                  />
                </div>
              )}

              {/* WhatsApp Number Input */}
              <div className="flex-1">
                <Input
                  id="phone-input"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d\s-]/g, '');
                    setPhone(val);
                  }}
                  placeholder="e.g. 98765 43210"
                  className="text-base tracking-wide"
                  required
                />
              </div>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MessageSquare className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified students are automatically logged in without OTP.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl bg-brand-700 py-2.5 text-base font-medium shadow-sm transition hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
            disabled={busy}
          >
            {busy ? 'Checking account…' : 'Login'}
          </Button>
        </form>
      )}

      {/* STEP 2: Verify WhatsApp OTP */}
      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} aria-label="Verify WhatsApp OTP" className="space-y-4">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Verify WhatsApp Code
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Code sent to <span className="font-medium text-slate-900 dark:text-slate-100">{effectiveCountryCode} {phone}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                <ArrowLeft className="size-3.5" />
                Change
              </button>
            </div>

            {isMockOtp && (
              <p className="mt-2 rounded bg-amber-100/90 px-2 py-1 text-[11px] font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                ⚙️ Dev Simulation: The 6-digit OTP has been printed in your server terminal.
              </p>
            )}
          </div>

          {/* New student details section if profile is not complete */}
          {requiresDetails && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Sparkles className="size-3.5 text-amber-500" />
                New Student Registration
              </div>
              <div>
                <Label htmlFor="student-name" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="student-name"
                  placeholder="e.g. Aditya Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="student-class" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Class <span className="text-red-500">*</span>
                </Label>
                <select
                  id="student-class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {CLASS_OPTIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls} {cls === '10' ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 6 Digit OTP Input Boxes */}
          <div>
            <Label className="mb-2 block text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enter 6-Digit Verification Code
            </Label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="h-12 w-11 rounded-lg border border-slate-300 bg-white text-center font-mono text-xl font-bold text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl bg-brand-700 py-2.5 text-base font-medium shadow-sm transition hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
            disabled={busy || otp.join('').length !== 6}
          >
            {busy ? 'Verifying…' : 'Verify & Sign In'}
          </Button>

          {/* Resend OTP button & timer */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              disabled={resendCooldown > 0 || busy}
              onClick={handleResendOtp}
              className={`flex items-center gap-1.5 font-medium transition ${resendCooldown > 0 || busy
                  ? 'cursor-not-allowed text-slate-400 dark:text-slate-600'
                  : 'text-brand-600 hover:underline dark:text-brand-400'
                }`}
            >
              <RotateCcw className="size-3.5" />
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend WhatsApp Code'}
            </button>

            <span className="text-slate-400 dark:text-slate-500">
              Valid for 15 mins
            </span>
          </div>
        </form>
      )}

      {/* Student Details Prompt Modal (When OTP is disabled) */}
      <Dialog
        isOpen={showDetailsModal}
        onClose={() => !busy && setShowDetailsModal(false)}
        size="sm"
        title="Complete Your Profile"
        description="Enter your name and class to personalize your test scorecard and detailed report."
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setShowDetailsModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="student-direct-details-form"
              size="sm"
              disabled={busy}
              className="bg-brand-700 hover:bg-brand-800 dark:bg-brand-600"
            >
              {busy ? 'Saving…' : 'Continue to Test'}
            </Button>
          </div>
        }
      >
        <form id="student-direct-details-form" onSubmit={handleDetailsModalSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="direct-student-name-input" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="direct-student-name-input"
              autoFocus
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Aditya Sharma"
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="direct-student-class-select" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Class <span className="text-red-500">*</span>
            </Label>
            <select
              id="direct-student-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls} {cls === '10' ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="size-3.5 shrink-0" />
              Diagnostic Test Ready
            </span>
            <p className="mt-0.5 text-[11px] text-amber-700/90 dark:text-amber-400">
              Your report will be customized based on your curriculum level.
            </p>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
