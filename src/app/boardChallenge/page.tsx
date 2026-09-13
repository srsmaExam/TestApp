import Image from 'next/image';
import Link from 'next/link';
import {
  GraduationCap,
  Clock,
  Atom,
  Trophy,
  ArrowRight,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  LogIn,
  MessageCircle,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import { BRAND } from '@/config/branding';
import { getSession } from '@/lib/session';
import { homeFor } from '@/lib/auth';

export const metadata = {
  title: 'Board Readiness Challenge | Shri Ram Smart Minds Academy',
  description:
    'A Diagnostic Test For Class 10 Students. 20 Questions | 20 Minutes in Mathematics & Science. Take the challenge and get your FREE Strengths & Improvement Report!',
  keywords: [
    'Board Readiness Challenge',
    'Class 10 Diagnostic Test',
    'SRSMA',
    'Shri Ram Smart Minds Academy',
    'JEE NEET Foundation',
    'CBSE Class 10 Exam Prep',
    'Bandlaguda Jagir Hyderabad',
  ],
  openGraph: {
    title: 'Board Readiness Challenge | Shri Ram Smart Minds Academy',
    description: 'Are you Board Ready? 20 Questions | 20 Minutes in Mathematics & Science for Class 10 Students.',
    images: [{ url: '/board-challenge/pamphlet_full_hd.png' }],
  },
};

export default async function BoardChallengePage() {
  const session = await getSession();
  const destination = session ? homeFor(session.role) : '/login';
  const ctaLabel = session ? 'Go to My Dashboard' : 'Take the Challenge Now';
  const ctaSubtext = session ? 'Signed in • Click to access tests' : 'Instant Student Login • No Password Needed';

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#071120] text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Background with Authentic Science Pattern & Navy Gradient */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Image
          src="/board-challenge/hero_bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-30 mix-blend-screen brightness-90"
        />
        {/* Ambient Gradient Glows */}
        <div className="absolute left-1/2 -top-40 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/15 blur-[140px]" />
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-blue-600/20 blur-[150px]" />
        <div className="absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-orange-600/15 blur-[150px]" />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#071120]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 sm:py-4">
            {/* Institute Identity: Shri Ram on Line 1, Smart Minds Academy on Line 2; Subtitle with by IIT Alumni on 2nd Line */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-amber-400/40 bg-slate-900 p-0.5 shadow-md shadow-amber-500/10 sm:size-14">
                <Image
                  src={BRAND.logoMark}
                  alt="SRSMA Logo"
                  width={56}
                  height={56}
                  priority
                  className="size-full rounded-[9px] object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-black tracking-tight text-white uppercase leading-tight sm:text-xl">
                  SHRI RAM
                </span>
                <span className="truncate text-[11px] font-black tracking-tight text-slate-100 uppercase leading-tight sm:text-lg">
                  SMART MINDS ACADEMY
                </span>
                <div className="mt-0.5 flex flex-col text-[10px] font-bold text-amber-400 leading-tight sm:text-sm">
                  <span className="truncate">A JEE &amp; NEET Coaching Institute</span>
                  <span className="font-extrabold text-amber-300 tracking-wide">
                    by IIT Alumni
                  </span>
                </div>
              </div>
            </div>

            {/* Login Navigation Action */}
            <div className="shrink-0">
              <Link
                href={destination}
                className="group inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-md transition hover:border-amber-400 hover:bg-amber-400/30 hover:text-white active:scale-95 sm:px-5 sm:py-2.5 sm:text-base"
              >
                <LogIn className="size-3.5 sm:size-5" />
                <span>{session ? 'Dashboard' : 'Login'}</span>
                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5 sm:size-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section: Centered, No Girl, ARE YOU BOARD READY? first, BOARD READINESS CHALLENGE below it as Header */}
        <main className="flex-1">
          <section className="mx-auto max-w-5xl px-4 pt-7 pb-12 text-center sm:px-6 sm:pt-14 sm:pb-20">
            <div className="flex flex-col items-center">
              {/* 1. ARE YOU BOARD READY? (Center Aligned, High-Impact Typography) */}
              <h1 className="w-full text-balance font-black tracking-tight uppercase text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.08]">
                <span className="block text-white drop-shadow-[0_2px_18px_rgba(255,255,255,0.35)]">
                  ARE YOU
                </span>
                <span className="mt-1 block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_4px_28px_rgba(245,158,11,0.65)]">
                  BOARD READY?
                </span>
              </h1>

              {/* 2. BOARD READINESS CHALLENGE (Major Title Header Banner) */}
              <div className="mt-6 w-full max-w-2xl px-2 sm:px-0">
                <div className="rounded-2xl border-2 border-white/90 bg-white px-5 py-3.5 sm:rounded-3xl sm:px-8 sm:py-4.5 shadow-2xl shadow-blue-950/60">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-wide sm:tracking-wider text-[#07162c] uppercase text-center leading-tight">
                    BOARD READINESS CHALLENGE
                  </h2>
                </div>
              </div>

              {/* Clear Informative Subtitle */}
              <p className="mt-4 max-w-2xl text-sm sm:text-xl font-semibold text-slate-200 leading-relaxed">
                A Comprehensive Diagnostic Test For Class 10 Students in Mathematics &amp; Science.
              </p>

              {/* Primary Call-to-Action Area */}
              <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3.5">
                <Link
                  href={destination}
                  className="relative group flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-6 py-4.5 text-lg sm:text-2xl font-black text-slate-950 shadow-2xl shadow-amber-500/30 transition-all duration-200 hover:brightness-110 hover:shadow-amber-500/45 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center gap-2.5">
                    <Zap className="size-5.5 fill-slate-950 text-slate-950" />
                    <span>{ctaLabel}</span>
                    <ArrowRight className="size-5.5 transition group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>

                <div className="flex items-center justify-center gap-2 text-xs sm:text-base font-semibold text-slate-300">
                  <CheckCircle2 className="size-4.5 text-emerald-400 shrink-0" />
                  <span>{ctaSubtext}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-y-2.5 gap-x-6 border-t border-slate-800/80 pt-5 text-sm sm:text-base font-semibold text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4.5 text-amber-400" />
                  <span>Curated by IIT Alumni</span>
                </div>
                <span className="hidden text-slate-700 sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4.5 text-blue-400" />
                  <span>Topic-Wise Precision</span>
                </div>
                <span className="hidden text-slate-700 sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-emerald-400" />
                  <span>100% Free Assessment</span>
                </div>
              </div>

              {/* The 4 Core Challenge Badges matching pamphlet (Centered 2x2 Grid) */}
              <div className="mt-12 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
                {/* Item 1: Diagnostic Test for Class 10 */}
                <div className="group flex items-start gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition hover:border-amber-400/50 hover:bg-slate-800/90">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/40">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">Class 10 Diagnostic Test</h2>
                    <p className="mt-1 text-sm sm:text-base text-slate-300 leading-snug">
                      Formulated specifically for CBSE &amp; State Board students to evaluate true board readiness.
                    </p>
                  </div>
                </div>

                {/* Item 2: 20 Questions | 20 Minutes */}
                <div className="group flex items-start gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition hover:border-amber-400/50 hover:bg-slate-800/90">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/40">
                    <Clock className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">20 Questions | 20 Minutes</h2>
                    <p className="mt-1 text-sm sm:text-base text-slate-300 leading-snug">
                      High-impact timed assessment measuring conceptual clarity, question-solving speed, and exam stamina.
                    </p>
                  </div>
                </div>

                {/* Item 3: Mathematics & Science Subjects */}
                <div className="group flex items-start gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition hover:border-amber-400/50 hover:bg-slate-800/90">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/40">
                    <Atom className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">Mathematics &amp; Science</h2>
                    <p className="mt-1 text-sm sm:text-base text-slate-300 leading-snug">
                      Comprehensive coverage across key formulas, critical theorems, and core scientific concepts.
                    </p>
                  </div>
                </div>

                {/* Item 4: Free Strengths & Improvement Report */}
                <div className="group flex items-start gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition hover:border-amber-400/50 hover:bg-slate-800/90">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/40">
                    <Trophy className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">FREE Diagnostic Report</h2>
                    <p className="mt-1 text-sm sm:text-base text-slate-300 leading-snug">
                      Receive an instant personalized report breaking down your strengths and key areas for score improvement!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: How It Works in 3 Easy Steps */}
          <section className="border-t border-slate-800/80 bg-slate-950/60 py-14 sm:py-18">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="text-center">
                <p className="text-sm font-extrabold tracking-wider text-amber-400 uppercase sm:text-base">
                  Simple 3-Step Process
                </p>
                <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl md:text-5xl">
                  How The Board Challenge Works
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-lg text-slate-300">
                  Take the diagnostic test on your mobile or computer and receive your comprehensive performance report instantly.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Step 1 */}
                <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-400/20 text-base font-black text-amber-400 ring-1 ring-amber-400/40">
                    01
                  </div>
                  <h3 className="mt-4 text-xl font-black text-white sm:text-2xl">Quick Student Login</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">
                    Sign in using your 10-digit mobile number. No complex passwords or email confirmations needed.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-400/20 text-base font-black text-amber-400 ring-1 ring-amber-400/40">
                    02
                  </div>
                  <h3 className="mt-4 text-xl font-black text-white sm:text-2xl">20 Mins • 20 Questions</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">
                    Attempt curated questions in Mathematics &amp; Science covering crucial Class 10 concepts under timed conditions.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-400/20 text-base font-black text-amber-400 ring-1 ring-amber-400/40">
                    03
                  </div>
                  <h3 className="mt-4 text-xl font-black text-white sm:text-2xl">Instant Diagnostic Report</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">
                    Review your accuracy, identify topic weaknesses, and obtain actionable recommendations to maximize your board exam score.
                  </p>
                </div>
              </div>

              {/* Central CTA under steps */}
              <div className="mt-10 flex justify-center">
                <Link
                  href={destination}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-slate-800 px-6 py-3.5 text-sm sm:text-base font-bold text-white ring-1 ring-slate-700 transition hover:bg-slate-700 hover:ring-amber-400/50"
                >
                  <LogIn className="size-5 text-amber-400" />
                  <span>Start Challenge Now</span>
                  <ArrowRight className="size-4 text-amber-400" />
                </Link>
              </div>
            </div>
          </section>

          {/* Section: Diagnostic Test Coverage Details */}
          <section className="py-14 sm:py-18">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Mathematics Card */}
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/95 to-[#0c1a2f] p-7 shadow-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400">
                      <BrainCircuit className="size-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white sm:text-2xl">Mathematics Diagnostics</h3>
                      <p className="text-sm font-bold text-amber-400">Key Conceptual Focus Areas</p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm sm:text-base text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-amber-400 shrink-0" />
                      <span>Real Numbers &amp; Polynomials Foundation</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-amber-400 shrink-0" />
                      <span>Quadratic Equations &amp; Arithmetic Progressions</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-amber-400 shrink-0" />
                      <span>Coordinate Geometry &amp; Triangles Theorems</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-amber-400 shrink-0" />
                      <span>Trigonometry Applications &amp; Circles</span>
                    </li>
                  </ul>
                </div>

                {/* Science Card */}
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/95 to-[#0c1a2f] p-7 shadow-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                      <Atom className="size-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white sm:text-2xl">Science Diagnostics</h3>
                      <p className="text-sm font-bold text-blue-400">Physics, Chemistry &amp; Biology</p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm sm:text-base text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-blue-400 shrink-0" />
                      <span>Chemical Reactions, Acids, Bases &amp; Metals</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-blue-400 shrink-0" />
                      <span>Life Processes &amp; Control &amp; Coordination</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-blue-400 shrink-0" />
                      <span>Light: Reflection, Refraction &amp; Human Eye</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-blue-400 shrink-0" />
                      <span>Electricity &amp; Magnetic Effects of Current</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section: About Shri Ram Smart Minds Academy & IIT Alumni Mentorship */}
          <section className="border-t border-slate-800/80 bg-slate-950/80 py-12 sm:py-16">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-amber-400/35 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-blue-900/20 p-7 sm:p-9 md:flex-row md:text-left">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start text-center sm:text-left">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-amber-400/50 bg-slate-900 p-1 shadow-md shadow-amber-500/10 sm:size-20">
                    <Image
                      src={BRAND.logoMark}
                      alt="SRSMA Emblem"
                      width={80}
                      height={80}
                      className="size-full rounded-xl object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-white sm:text-2xl leading-tight">
                      <span>Shri Ram</span>
                      <span className="block text-amber-400">Smart Minds Academy</span>
                    </h3>
                    <div className="mt-1 text-sm font-bold text-amber-300 sm:text-base leading-snug">
                      <span>A Premier JEE &amp; NEET Coaching Institute</span>
                      <span className="block font-extrabold text-amber-200">by IIT Alumni</span>
                    </div>
                    <p className="mt-2.5 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
                      Empowering young minds with deep conceptual learning, analytical problem solving, and personalized guidance for Board exams, JEE Mains &amp; Advanced, and NEET.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-2 md:mt-0">
                  <Link
                    href={destination}
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-400 px-7 py-4 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-amber-500/25 transition hover:bg-amber-300 active:scale-95"
                  >
                    <LogIn className="size-5" />
                    <span>Login &amp; Start Challenge</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer & Direct Contact Info matching pamphlet */}
        <footer className="border-t border-slate-800 bg-[#050c18] py-10 pb-28 sm:pb-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-7 text-center sm:grid-cols-3 sm:text-left">
              {/* Call & WhatsApp */}
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-xs font-semibold text-slate-400 sm:text-sm">Direct Admissions &amp; Enquiries:</span>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <a
                    href="tel:+918463911854"
                    className="flex items-center gap-1.5 font-mono text-base font-extrabold text-amber-400 transition hover:text-amber-300 hover:underline sm:text-lg"
                  >
                    <Phone className="size-4" />
                    <span>+91 84639 11854</span>
                  </a>
                  <a
                    href="https://wa.me/918463911854?text=Hello%20SRSMA%2C%20I%20am%20interested%20in%20taking%20the%20Board%20Readiness%20Challenge"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/35 transition hover:bg-emerald-500/30"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Official Academy Website */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-400 sm:text-sm">Academy Website:</span>
                <a
                  href="https://srsma.in"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 flex items-center gap-1.5 text-sm sm:text-base font-bold text-white transition hover:text-amber-400"
                >
                  <Globe className="size-4 text-amber-400" />
                  <span>https://srsma.in</span>
                </a>
              </div>

              {/* Location */}
              <div className="flex flex-col items-center sm:items-end">
                <span className="text-xs font-semibold text-slate-400 sm:text-sm">Campus Location:</span>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-200">
                  <MapPin className="size-4 text-amber-400 shrink-0" />
                  <span>Bandlaguda Jagir, Hyderabad</span>
                </div>
              </div>
            </div>

            {/* Bottom Copyright & Portal Link */}
            <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-800/80 pt-5 text-center text-xs sm:text-sm text-slate-400 sm:flex-row">
              <p>© {new Date().getFullYear()} Shri Ram Smart Minds Academy (SRSMA). All rights reserved.</p>
              <div className="mt-2.5 flex items-center gap-4 sm:mt-0 font-medium">
                <Link href="/login" className="transition hover:text-amber-400">
                  Student Sign In
                </Link>
                <span>•</span>
                <Link href="/SRSMA" className="transition hover:text-amber-400">
                  Staff Portal
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile-Only Floating Bottom Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/90 bg-[#071120]/95 px-4 py-3.5 pb-[calc(0.85rem+env(safe-area-inset-bottom,0px))] backdrop-blur-lg sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
                Board Challenge
              </span>
              <span className="text-sm font-black text-white">
                Class 10 • 20 Mins
              </span>
            </div>

            <Link
              href={destination}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-black text-slate-950 shadow-md shadow-amber-500/25 active:scale-95"
            >
              <span>{session ? 'Go to Dashboard' : 'Take Challenge'}</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
