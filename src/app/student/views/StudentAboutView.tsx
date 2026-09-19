import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  GraduationCap,
  BookOpen,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Target,
  Users,
  Clock,
  ExternalLink,
  CheckCircle2,
  HeartHandshake,
  Utensils,
  Maximize2,
  MessageCircle,
} from 'lucide-react';
import { BRAND } from '@/config/branding';
import { requireStudent } from '@/lib/auth';
import { StudentChrome } from '../StudentChrome';

export async function StudentAboutView() {
  const session = await requireStudent();

  return (
    <StudentChrome session={session}>
      <div className="space-y-8 pb-16">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-10 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 size-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 size-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
              <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-white/10 p-2 backdrop-blur-sm shadow-md shadow-amber-500/10">
                <Image
                  src={BRAND.logoMark}
                  alt="SRSMA Emblem"
                  width={96}
                  height={96}
                  className="size-full rounded-xl object-contain"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-400/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  <Sparkles className="size-3.5" />
                  <span>Founded by Top IIT Alumni</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  Shri Ram <span className="text-amber-400">Smart Minds Academy</span>
                </h1>
                <p className="mt-1.5 text-sm sm:text-lg font-bold text-amber-200/95">
                  Top Coaching with Personal Care, Not Heavy Stress
                </p>
                <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                  At Shri Ram Smart Minds Academy (SRSMA), we believe top coaching should come with personal care, not heavy stress. Founded by top IIT Alumni, our academy has proven its quality right from its very first batch.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center md:items-end gap-3">
              <a
                href="https://share.google/xZAdnqnV9TqeAZCbJ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-300 active:scale-95"
              >
                <MapPin className="size-4" />
                <span>Locate Campus on Maps</span>
                <ExternalLink className="size-3.5 opacity-75" />
              </a>
              <Link
                href="/student"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white border border-white/15 backdrop-blur-sm transition hover:bg-white/20"
              >
                <span>Back to My Tests</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Photo Showcase & Academy Highlights */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Photo Showcase */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-md group dark:border-slate-800">
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src="/brand/smart_classroom.webp"
                alt="Shri Ram Smart Minds Academy - Air-Conditioned Smart Classroom"
                fill
                priority
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[11px] font-black text-slate-950 uppercase tracking-wider">
                  Interactive Learning
                </span>
                <h3 className="text-base sm:text-xl font-black text-white drop-shadow-sm">
                  Air-Conditioned Smart Classrooms
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 font-medium drop-shadow-xs line-clamp-2">
                  Interactive digital smart boards and comfortable, modern learning spaces designed for deep conceptual focus and high student engagement.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Key Highlights Card */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2 text-brand-700 dark:text-brand-400">
                <HeartHandshake className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">The SRSMA Care Model</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                Personalized Mentorship That Leaves No Child Behind
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                To make sure no child gets left behind, we keep our batch size small with only <strong>25 to 30 students per batch</strong>. This allows our teachers to give daily attention to every child.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <Users className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Small batch size: <strong>25 to 30 students</strong> with daily individual attention</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <GraduationCap className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Direct daily teaching &amp; guidance from accomplished <strong>IIT Alumni</strong></span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <Utensils className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Safe hostels offering <strong>healthy, hygienic vegetarian meals</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Proven Track Record & Achievement Metrics */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 mb-1">
                <Award className="size-3.5" />
                <span>Track Record</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Proven Quality Right from Our Very First Batch
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Verified competitive exam results achieved by SRSMA students
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Metric 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top JEE Main
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-brand-700 dark:text-brand-400">
                99.48%ile
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Top Percentile Score
              </p>
            </div>

            {/* Metric 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                JEE Main Qualifiers
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                10 / 16
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Qualified in First Batch
              </p>
            </div>

            {/* Metric 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                JEE Advanced
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                2 Qualifiers
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Premier IIT Qualifying
              </p>
            </div>

            {/* Metric 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                TG-EAPCET
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                Top Ranks
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Top State Rankers
              </p>
            </div>

            {/* Metric 5 */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Board Exams
              </span>
              <p className="mt-1.5 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                Up to 98%
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Class 10 &amp; IPE Exams
              </p>
            </div>
          </div>
        </section>

        {/* 4. Contact & Campus Information */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  Visit &amp; Connect
                </span>
                <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Campus &amp; Admissions Office
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Parents and students are welcome to visit our Hyderabad campus for personalized academic counseling, diagnostic assessment evaluations, and faculty interactions.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Address */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400">
                    <MapPin className="size-4.5" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">Campus Address</strong>
                    <span>Shri Ram Smart Minds Academy, 2nd Floor Sankirtan Bhavan, Bandlaguda Jagir, Sun City, Hyderabad</span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="size-4.5" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">WhatsApp</strong>
                    <a
                      href="https://wa.me/918463911854"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      +91 84639 11854
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400">
                    <Mail className="size-4.5" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">Email</strong>
                    <a href="mailto:smartmindsacademy108@gmail.com" className="hover:text-brand-600 hover:underline">
                      smartmindsacademy108@gmail.com
                    </a>
                  </div>
                </div>

                {/* Timings */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-brand-600 dark:text-brand-400">
                    <Clock className="size-4.5" />
                  </div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-bold">Office Hours</strong>
                    <span>Mon–Sat, 9:00 AM – 7:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Map Card */}
            <div className="w-full lg:w-80 rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-5 shadow-sm dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 space-y-4">
              <div className="flex items-center gap-2 text-amber-950 dark:text-amber-300 font-bold text-sm">
                <MapPin className="size-4 text-amber-600 dark:text-amber-400" />
                <span>Google Maps Location</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Direct navigation link to Sankirtan Bhavan, Bandlaguda Jagir, Sun City, Hyderabad.
              </p>
              <a
                href="https://share.google/xZAdnqnV9TqeAZCbJ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 px-4 text-xs font-black text-slate-950 shadow-md hover:bg-amber-300 transition active:scale-95"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="size-3.5" />
              </a>
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-500/20 flex items-center justify-end text-[11px] text-slate-500 dark:text-slate-400">
                <span>Sun City, Hyderabad</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Mini Map Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <MapPin className="size-4.5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Campus Location Mini Map
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sankirtan Bhavan, Bandlaguda Jagir, Sun City, Hyderabad
                </p>
              </div>
            </div>

            <a
              href="https://share.google/xZAdnqnV9TqeAZCbJ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition self-start sm:self-auto"
            >
              <span>Get Directions</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 aspect-[16/7] sm:aspect-[21/9] w-full bg-slate-100 dark:bg-slate-800">
            <iframe
              title="Shri Ram Smart Minds Academy Location"
              src="https://maps.google.com/maps?q=Sankirtan+Bhavan,+Bandlaguda+Jagir,+Sun+City,+Hyderabad&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-full filter dark:contrast-95 dark:brightness-95"
            />
          </div>
        </section>
      </div>
    </StudentChrome>
  );
}
