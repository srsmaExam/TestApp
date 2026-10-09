'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Target,
  FileText,
  Check,
  TrendingUp,
  Brain,
  Layers,
  ChevronRight,
  BookOpen,
  Sparkles,
  Star,
  Info,
  Compass,
  Calculator,
  Wrench,
  HelpCircle,
  BarChart3,
  GraduationCap,
  ArrowRight,
  MessageCircle,
  Puzzle,
  RotateCcw,
  Timer,
  Calendar,
  X,
} from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Dialog, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type {
  DiagnosticEvaluationResult,
  PreparationLevel,
  SkillValueCategory,
  PriorityLevel,
  RevisitCategory,
  SubjectDifficultyBreakdowns,
  TopicToRevisitItem,
} from '@/lib/diagnostic-evaluator';

export interface StudentProfileDetails {
  board?: string | null;
  school?: string | null;
  city?: string | null;
  classLevel?: string | null;
  gender?: string | null;
  isFormFilled?: boolean;
}

interface BoardReadinessReportProps {
  report: DiagnosticEvaluationResult;
  studentGender?: 'Male' | 'Female' | string | null;
  studentDetails?: StudentProfileDetails | null;
  onRetakeOrBrowse?: () => void;
  isTeacherView?: boolean;
  onGoToSolutions?: () => void;
  attemptId?: string;
}

// ---------------------------------------------------------------------------
// Subject Performance Insight Evaluator (9 Exact Diagnostic Score Cases)
// ---------------------------------------------------------------------------
export function getSubjectPerformanceInsight(
  mathPercentage: number,
  sciencePercentage: number,
): { label: string; message: string } {
  const m = Math.round(mathPercentage);
  const s = Math.round(sciencePercentage);
  const diff = m - s;
  const absDiff = Math.abs(diff);

  // 1. Difference <= 12% (Balanced Cases)
  if (absDiff <= 12) {
    // Case 1: Dual High (Maths High, Science High — Balanced)
    if (m >= 75 && s >= 75) {
      return {
        label: 'Dual High — Balanced',
        message:
          'Awesome work! You are in great shape to score top marks in your board exams. To push for a full 100%, focus on writing down every step clearly with proper units, drawing neat diagrams, and practicing full 3-hour sample papers so you don\'t lose marks to tiny calculation slips.',
      };
    }
    // Case 3: Dual Low (Maths Low, Science Low — Balanced)
    if (m < 45 && s < 45) {
      return {
        label: 'Dual Low — Balanced',
        message:
          'Don\'t lose heart at all—everyone starts somewhere, and board exams are very predictable. Put full mock tests on hold for now; just pick the 3 easiest, high-mark chapters in your textbook (like Statistics in Maths or Life Processes in Science) and master the basic examples first to build steady confidence.',
      };
    }
    // If one is >= 75 and average >= 75 with diff <= 12
    if ((m + s) / 2 >= 75) {
      return {
        label: 'Dual High — Balanced',
        message:
          'Awesome work! You are in great shape to score top marks in your board exams. To push for a full 100%, focus on writing down every step clearly with proper units, drawing neat diagrams, and practicing full 3-hour sample papers so you don\'t lose marks to tiny calculation slips.',
      };
    }
    // Case 2: Dual Mid (Maths Mid, Science Mid — Balanced)
    return {
      label: 'Dual Mid — Balanced',
      message:
        'You have a solid base in both subjects, and you are totally ready to push into the 80s and 90s! Split your study time equally between Maths and Science, and focus on practicing chapter-wise previous years\' board questions (PYQs) so you can get used to how board questions are framed.',
    };
  }

  // 2. Maths Leads by > 12% (diff > 12)
  if (diff > 12) {
    // Case 6: Maths Ahead, Both Low (Maths Better — Foundational Tier)
    if (m < 45 && s < 45) {
      return {
        label: 'Maths Better — Foundational Tier',
        message:
          'You\'re making steady headway in Maths, and we can do the exact same thing for Science! Take it one step at a time: keep practicing your basic Maths formulas daily, and start Science by reading the easiest chapter summaries and learning the short 1-mark and 2-mark textbook questions.',
      };
    }
    // Case 5: Maths High/Mid, Science Low (Maths Much Better — Wide Gap)
    if (m >= 45 && s < 45) {
      return {
        label: 'Maths Much Better — Wide Gap',
        message:
          'Your strong Maths score shows you have great focus and logic—that is a huge advantage! Don\'t stress about Science; it is very scoring once you know the direct textbook questions. Spend 20 minutes a day keeping your Maths sharp, and use the rest of your study time to rebuild Science chapter by chapter.',
      };
    }
    // Case 4: Maths High, Science Mid (Maths Much Better)
    return {
      label: 'Maths Much Better',
      message:
        'Your Maths is looking super strong! Since your problem-solving is already sharp, you can easily pull your Science score up too. Dedicate more of your study time to Science by practicing textbook definitions, balancing chemical equations, and drawing neat, labeled diagrams.',
    };
  }

  // 3. Science Leads by > 12% (s - m > 12)
  // Case 9: Science Ahead, Both Low (Science Better — Foundational Tier)
  if (s < 45 && m < 45) {
    return {
      label: 'Science Better — Foundational Tier',
      message:
        'Your Science gives you a solid starting point, and you can definitely bring your Maths score up alongside it! Focus your energy on direct, high-scoring Maths chapters first—work through simple textbook questions step-by-step, and your marks and confidence will climb quickly.',
    };
  }
  // Case 8: Science High/Mid, Maths Low (Science Much Better — Wide Gap)
  if (s >= 45 && m < 45) {
    return {
      label: 'Science Much Better — Wide Gap',
      message:
        'Scoring well in Science proves you have what it takes to understand big, detailed ideas! Maths only feels tricky when formulas and basic steps are missing. Make a one-page formula sheet for easy chapters like Real Numbers and Statistics, and solve 4 to 5 textbook examples by hand every day—you will see fast results.',
    };
  }
  // Case 7: Science High, Maths Mid (Science Much Better)
  return {
    label: 'Science Much Better',
    message:
      'You clearly understand your Science concepts really well—great job! For Maths, remember that board examiners give generous step marks even if your final calculation goes off. Spend more of your study time writing out Maths textbook problems by hand so you build speed and avoid small slips.',
  };
}

// ---------------------------------------------------------------------------
// 1. Mobile Battery Style Bar Component
// ---------------------------------------------------------------------------
function MobileBatteryBar({
  percentage,
  variant,
  label,
}: {
  percentage: number;
  variant: 'easy' | 'medium' | 'hard';
  label: string;
}) {
  const config = {
    easy: {
      dot: 'bg-emerald-500',
      fill: 'from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400',
      badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    },
    medium: {
      dot: 'bg-amber-500',
      fill: 'from-amber-400 to-amber-500 dark:from-amber-400 dark:to-orange-500',
      badge: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',
    },
    hard: {
      dot: 'bg-indigo-600 dark:bg-indigo-400',
      fill: 'from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500',
      badge: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
    },
  }[variant];

  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          <span className={`inline-block size-2 rounded-full ${config.dot}`} />
          <span>{label}</span>
        </span>
        <span className={`rounded-md border px-1.5 py-0.5 font-black text-xs tnum ${config.badge}`}>
          {clampedPct}%
        </span>
      </div>

      {/* Sleek Modern Battery Capsule */}
      <div className="flex items-center">
        <div className="relative flex-1 h-3.5 sm:h-4 rounded-full border border-slate-300/80 bg-slate-100 p-0.5 shadow-inner dark:border-slate-700 dark:bg-slate-800/80 overflow-hidden">
          {/* Fill level */}
          <div
            className={`h-full rounded-full bg-gradient-to-r ${config.fill} transition-all duration-500`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>

        {/* Battery Terminal Nub */}
        <div className="h-2 w-1 rounded-r-xs bg-slate-300 dark:bg-slate-600 shrink-0 ml-0.5" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Amazon E-commerce Style Star Rating Component
// ---------------------------------------------------------------------------
function EcommerceStarRating({
  rating,
  align = 'end',
  layout = 'inline',
}: {
  rating: number;
  align?: 'start' | 'end' | 'center' | 'responsive';
  layout?: 'inline' | 'stacked';
}) {
  const alignClass =
    align === 'responsive'
      ? 'justify-start sm:justify-end'
      : align === 'start'
        ? 'justify-start'
        : align === 'center'
          ? 'justify-center'
          : 'justify-end';

  const starsNode = (
    <div className="flex flex-nowrap items-center gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const lower = starIndex - 1;
        const diff = rating - lower;

        if (diff >= 0.75) {
          // >= x.75 -> Full star
          return (
            <Star
              key={starIndex}
              className="size-3 sm:size-3.5 md:size-4 fill-amber-400 text-amber-500 shrink-0"
            />
          );
        } else if (diff >= 0.25) {
          // x.25 to x.74 -> Half star
          return (
            <div key={starIndex} className="relative size-3 sm:size-3.5 md:size-4 shrink-0">
              <Star className="absolute inset-0 size-3 sm:size-3.5 md:size-4 fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-600" />
              <div className="absolute inset-0 w-[50%] overflow-hidden">
                <Star className="size-3 sm:size-3.5 md:size-4 fill-amber-400 text-amber-500" />
              </div>
            </div>
          );
        } else {
          // < x.25 -> Empty star
          return (
            <Star
              key={starIndex}
              className="size-3 sm:size-3.5 md:size-4 fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-600 shrink-0"
            />
          );
        }
      })}
    </div>
  );

  const badgeNode = (
    <span className="inline-block shrink-0 whitespace-nowrap select-none rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] sm:text-xs font-black text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 tnum leading-none">
      {rating.toFixed(1)}/5
    </span>
  );

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-1.5 shrink-0 ${alignClass}`}>
        {starsNode}
        {badgeNode}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-nowrap items-center ${alignClass} gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap`}>
      {starsNode}
      {badgeNode}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Difficulty-Wise Performance Insight Helper
// ---------------------------------------------------------------------------
function getDifficultyInsight(breakdowns?: SubjectDifficultyBreakdowns): string {
  if (!breakdowns) {
    return 'Your difficulty-wise results reflect steady engagement across foundational, intermediate, and advanced board challenge questions.';
  }

  const m = breakdowns.mathematics;
  const s = breakdowns.science;

  const totalEasy = (m.easy.total || 0) + (s.easy.total || 0);
  const easyScore = (m.easy.score || 0) + (s.easy.score || 0);
  const easyPct = totalEasy > 0 ? Math.round((easyScore / totalEasy) * 100) : 0;

  const totalMed = (m.medium.total || 0) + (s.medium.total || 0);
  const medScore = (m.medium.score || 0) + (s.medium.score || 0);
  const medPct = totalMed > 0 ? Math.round((medScore / totalMed) * 100) : 0;

  const totalHard = (m.hard.total || 0) + (s.hard.total || 0);
  const hardScore = (m.hard.score || 0) + (s.hard.score || 0);
  const hardPct = totalHard > 0 ? Math.round((hardScore / totalHard) * 100) : 0;

  if (easyPct >= 75 && medPct >= 65 && hardPct >= 60) {
    return 'Exceptional consistency across all difficulty tiers. You tackle challenging, higher-order questions with equal confidence as basic concepts. Sustaining this rigor through full-length timed mock tests will solidify top-bracket Board results.';
  }

  if (hardPct > medPct && hardPct >= 50 && (easyPct < 70 || medPct < 60)) {
    return 'Interesting pattern: You demonstrated strong problem-solving on complex (Hard) questions, but dropped marks on some foundational or intermediate questions. This usually indicates rushing through simpler problems or careless calculation errors. Slowing down slightly on routine steps will immediately raise your overall score.';
  }

  if (easyPct >= 70 && medPct >= 50 && hardPct < 50) {
    return 'You have established a solid conceptual foundation with dependable accuracy on Easy and Medium questions. Your primary growth frontier lies in Hard questions—focus your preparation on multi-step non-routine problems and combined formula applications to unlock top percentile marks.';
  }

  if (m.easy.percentage >= 70 && s.easy.percentage < 60) {
    return 'Your Mathematics difficulty pacing is well grounded, whereas Science shows drops on foundational questions. Dedicate time to reviewing NCERT definitions, laws, and diagram-based concepts in Science to match your Mathematics momentum.';
  }
  if (s.easy.percentage >= 70 && m.easy.percentage < 60) {
    return 'Science foundational and application questions are well mastered, but Mathematics shows friction in procedural calculations. Targeted practice on standard NCERT textbook exercises will quickly bolster your Mathematics foundation.';
  }

  if (easyPct < 60) {
    return 'Attention is recommended on foundational (Easy) questions across both subjects. Prioritizing standard textbook definitions, core formulas, and direct question types before moving to complex application sets will build greater test confidence.';
  }

  return 'Your performance demonstrates steady progress across Easy and Medium tiers with room to expand in complex multi-concept questions. Prioritize revision of difficult chapter questions to maximize your board exam preparation.';
}

// ---------------------------------------------------------------------------
// 4. Executive BRI Speedometer / Gauge Component
// ---------------------------------------------------------------------------
function BriSpeedometerGauge({
  score,
  prepStyle,
}: {
  score: number;
  prepStyle: { bg: string; label: string; tone: string };
}) {
  const clamped = Math.min(100, Math.max(0, score));
  const arcLength = 249.6;
  const strokeOffset = arcLength - (arcLength * clamped) / 100;

  // Angle from 160 deg to 380 deg
  const angleRad = ((160 + (clamped / 100) * 220) * Math.PI) / 180;
  const beadX = 90 + 65 * Math.cos(angleRad);
  const beadY = 85 + 65 * Math.sin(angleRad);

  const isHigh = clamped >= 70;
  const isMed = clamped >= 50 && clamped < 70;
  const isBasic = clamped >= 20 && clamped < 50;
  const isFoundational = clamped < 20;

  return (
    <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/50 p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950/80 h-full">
      <div className="w-full flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Award className="size-3.5 text-brand-600 dark:text-brand-400" />
          Board Readiness Index (BRI)
        </span>
        <span className="rounded-md bg-brand-50 border border-brand-200/60 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
          Scale 0–100
        </span>
      </div>

      {/* Speedometer Arc SVG */}
      <div className="relative my-2.5 sm:my-3 flex items-center justify-center">
        <svg viewBox="0 0 180 128" className="w-48 sm:w-56 h-auto drop-shadow-xs">
          <defs>
            <linearGradient id="briGradHigh" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="briGradMed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="briGradBasic" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="briGradFoundational" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Background Arc Track */}
          <path
            d="M 28.9 107.2 A 65 65 0 1 1 151.1 107.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="11"
            strokeLinecap="round"
            className="text-slate-200/90 dark:text-slate-800"
          />

          {/* Active Fill Arc */}
          <path
            d="M 28.9 107.2 A 65 65 0 1 1 151.1 107.2"
            fill="none"
            stroke={
              isHigh
                ? 'url(#briGradHigh)'
                : isMed
                  ? 'url(#briGradMed)'
                  : isBasic
                    ? 'url(#briGradBasic)'
                    : 'url(#briGradFoundational)'
            }
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-700 ease-out"
          />

          {/* Glowing Indicator Bead */}
          <circle
            cx={beadX}
            cy={beadY}
            r="8"
            className="fill-white drop-shadow-md dark:fill-slate-900"
          />
          <circle
            cx={beadX}
            cy={beadY}
            r="4.5"
            className={
              isHigh
                ? 'fill-emerald-500'
                : isMed
                  ? 'fill-blue-500'
                  : isBasic
                    ? 'fill-amber-500'
                    : 'fill-indigo-500'
            }
          />
        </svg>

        {/* Central Metric Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none text-center">
          <span className="tnum text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {clamped}
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
            / 100 Score
          </span>
        </div>
      </div>

      {/* 4-Tier Mini Scale Bar */}
      <div className="w-full grid grid-cols-4 gap-1 px-1 text-center text-[9px] sm:text-[10px] font-bold">
        <div
          className={`rounded-lg py-1 border transition-all ${isFoundational
            ? 'bg-indigo-500/15 text-indigo-800 border-indigo-400 font-black shadow-2xs dark:text-indigo-300'
            : 'text-slate-400 border-slate-200/60 dark:border-slate-800'
            }`}
        >
          &lt;20 Foundational
        </div>
        <div
          className={`rounded-lg py-1 border transition-all ${isBasic
            ? 'bg-amber-500/15 text-amber-800 border-amber-400 font-black shadow-2xs dark:text-amber-300'
            : 'text-slate-400 border-slate-200/60 dark:border-slate-800'
            }`}
        >
          20–49 Basic
        </div>
        <div
          className={`rounded-lg py-1 border transition-all ${isMed
            ? 'bg-blue-500/15 text-blue-800 border-blue-400 font-black shadow-2xs dark:text-blue-300'
            : 'text-slate-400 border-slate-200/60 dark:border-slate-800'
            }`}
        >
          50–69 Strong
        </div>
        <div
          className={`rounded-lg py-1 border transition-all ${isHigh
            ? 'bg-emerald-500/15 text-emerald-800 border-emerald-400 font-black shadow-2xs dark:text-emerald-300'
            : 'text-slate-400 border-slate-200/60 dark:border-slate-800'
            }`}
        >
          70+ High
        </div>
      </div>

      {/* Level of Preparation Status Banner */}
      <div className="mt-3.5 w-full text-center">
        <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-700 dark:text-slate-300 block mb-1.5">
          Level of Preparation
        </span>
        <div className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-1.5 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-extrabold tracking-wide shadow-2xs transition-all ${isHigh
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
          : isMed
            ? 'border-blue-500/40 bg-blue-500/15 text-blue-800 dark:text-blue-200'
            : isBasic
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200'
              : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-800 dark:text-indigo-200'
          }`}>
          <span className="text-sm">{isHigh ? '🏆' : isMed ? '🎯' : isBasic ? '⚡' : '🌱'}</span>
          <span>{prepStyle.label}</span>
        </div>
      </div>
    </div>
  );
}

export function getTimeManagementBadge(rating: 'Optimal' | 'Good' | 'Moderate' | 'Needs Intervention' | 'Medium' | 'Poor' | string) {
  switch (rating) {
    case 'Optimal':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Optimal
        </span>
      );
    case 'Good':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
          <span className="size-1.5 rounded-full bg-teal-500" />
          Good
        </span>
      );
    case 'Moderate':
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {rating === 'Medium' ? 'Medium' : 'Moderate'}
        </span>
      );
    case 'Needs Intervention':
    case 'Poor':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <span className="size-1.5 rounded-full bg-rose-500" />
          {rating === 'Poor' ? 'Poor' : 'Needs Intervention'}
        </span>
      );
  }
}

function TimeManagementReportSection({
  timeManagement,
  isStrength,
}: {
  timeManagement: DiagnosticEvaluationResult['timeManagement'];
  isStrength: boolean;
}) {
  const starRating = Math.round(((timeManagement.finalScorePercent ?? 0) / 100) * 5 * 10) / 10;
  const hasGuesswork = (timeManagement.guessworkQuestions?.length ?? 0) > 0;
  const counts = timeManagement.categoryCounts || {
    EFFICIENT_MASTERY: 0,
    OVER_INVESTED_SUCCESS: 0,
    CARELESS_RUSHING: 0,
    DISCIPLINED_ATTEMPT: 0,
    TIME_TRAP: 0,
    UNATTEMPTED: 0,
  };

  const emCount = counts.EFFICIENT_MASTERY || 0;
  const oiCount = counts.OVER_INVESTED_SUCCESS || 0;
  const daCount = counts.DISCIPLINED_ATTEMPT || 0;
  const crCount = counts.CARELESS_RUSHING || 0;
  const ttCount = counts.TIME_TRAP || 0;
  const unCount = counts.UNATTEMPTED || 0;

  const BEHAVIORAL_ROWS = [
    {
      key: 'EFFICIENT_MASTERY',
      term: 'Efficient Mastery',
      badgeTone: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50',
      dot: 'bg-emerald-500',
      countTone: 'text-emerald-600 dark:text-emerald-400',
      explanation: (
        <span>
          Solved <strong className="font-bold text-emerald-600 dark:text-emerald-400">{emCount} {emCount === 1 ? 'Question' : 'Questions'}</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-300">correctly well within expected time</span>. Shows thorough concept clarity and confident, swift calculations.
        </span>
      ),
      count: emCount,
    },
    {
      key: 'OVER_INVESTED_SUCCESS',
      term: 'Over-Invested Attempt',
      badgeTone: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50',
      dot: 'bg-amber-500',
      countTone: 'text-amber-600 dark:text-amber-400',
      explanation: (
        <span>
          Solved <strong className="font-bold text-amber-600 dark:text-amber-400">{oiCount} {oiCount === 1 ? 'Question' : 'Questions'}</strong> correctly, but took <span className="font-semibold text-amber-700 dark:text-amber-300">more time than needed</span>. Practicing standard questions will build speed so you do not run short of time on longer 4-mark and 5-mark questions.
        </span>
      ),
      count: oiCount,
    },
    {
      key: 'DISCIPLINED_ATTEMPT',
      term: 'Disciplined Attempt',
      badgeTone: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50',
      dot: 'bg-blue-500',
      countTone: 'text-blue-600 dark:text-blue-400',
      explanation: (
        <span>
          Attempted <strong className="font-bold text-blue-600 dark:text-blue-400">{daCount} {daCount === 1 ? 'Question' : 'Questions'}</strong> with <span className="font-semibold text-blue-600 dark:text-blue-400">genuine effort</span> within standard time limits. Even though the final answer went wrong, your pacing and approach were <span className="font-semibold text-emerald-600 dark:text-emerald-400">calm and disciplined</span>.
        </span>
      ),
      count: daCount,
    },
    {
      key: 'CARELESS_RUSHING',
      term: 'Careless Rushing',
      badgeTone: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50',
      dot: 'bg-rose-500',
      countTone: 'text-rose-600 dark:text-rose-400',
      explanation: (
        <span>
          Answered <strong className="font-bold text-rose-600 dark:text-rose-400">{crCount} {crCount === 1 ? 'Question' : 'Questions'}</strong> <span className="font-semibold text-rose-600 dark:text-rose-400">too quickly</span> and got incorrect due to <span className="font-semibold text-rose-600 dark:text-rose-400">rushing or minor calculation slips</span>. Taking 15–20 extra seconds to re-read and double-check prevents these lost marks.
        </span>
      ),
      count: crCount,
    },
    {
      key: 'TIME_TRAP',
      term: 'Time Trap',
      badgeTone: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50',
      dot: 'bg-rose-500',
      countTone: 'text-rose-600 dark:text-rose-400',
      explanation: (
        <span>
          Got stuck on <strong className="font-bold text-rose-600 dark:text-rose-400">{ttCount} tricky {ttCount === 1 ? 'Question' : 'Questions'}</strong>, spent <span className="font-semibold text-rose-600 dark:text-rose-400">too much time</span>, and still got wrong. If a question is blocking you in an exam, skip it temporarily and return at the end.
        </span>
      ),
      count: ttCount,
    },
    {
      key: 'UNATTEMPTED',
      term: 'Unattempted',
      badgeTone: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
      countTone: 'text-slate-600 dark:text-slate-400',
      explanation: (
        <span>
          Left <strong className="font-bold text-slate-700 dark:text-slate-300">{unCount} {unCount === 1 ? 'Question' : 'Questions'}</strong> unattempted due to <span className="font-semibold text-amber-600 dark:text-amber-400">time running out</span> or uncertainty about the concept.
        </span>
      ),
      count: unCount,
    },
  ];

  const visibleRows = BEHAVIORAL_ROWS.filter((row) => row.count > 0);

  return (
    <div
      className={`mt-8 space-y-4 rounded-2xl border p-4 sm:p-5 md:p-6 shadow-xs ${isStrength
        ? 'border-emerald-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
        : 'border-amber-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
        }`}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-lg text-white ${isStrength ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
            >
              <Clock className="size-4" />
            </div>
            <h3 className="text-sm sm:text-base font-black tracking-wider uppercase text-slate-900 dark:text-white">
              Time Management &amp; Pacing
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider border ${isStrength
                ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300'
                : 'bg-amber-500/10 text-amber-800 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300'
                }`}
            >
              {isStrength ? (
                <>
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                  Pacing Strength
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />
                  Area for Improvement
                </>
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isStrength
              ? 'Your overall pacing, speed control, and question discipline reflect strong exam readiness.'
              : 'Pacing adjustments and time allocation across questions are high-impact areas to raise your board score.'}
          </p>
        </div>

        {/* Category & Star Rating */}
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pacing:</span>
            {getTimeManagementBadge(timeManagement.rating)}
          </div>
          <EcommerceStarRating rating={starRating} align="end" />
        </div>
      </div>

      {/* Guesswork Flag */}
      {hasGuesswork ? (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 p-3 sm:p-3.5 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-extrabold text-amber-950 dark:text-amber-100 mr-1">
              Possibility of Guesswork Detected:
            </strong>
            Rapid responses submitted in under 8 seconds indicate a likelihood of guesswork without step-by-step solving. In Board exams, guessing carries high risk of losing marks—allocating deliberate calculation time avoids silly mistakes.
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 sm:p-3 text-xs text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">
            <strong className="font-bold text-emerald-950 dark:text-emerald-100">No Guesswork Detected:</strong> You maintained a disciplined pace with steady solving time across all attempted questions.
          </span>
        </div>
      )}

      {/* Behavioral Distribution Table */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            Lets see how well you managed your Time in the below table
          </span>
        </div>

        {/* Mobile View: Responsive Card Layout (< sm) */}
        <div className="block sm:hidden space-y-2.5">
          {visibleRows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold border ${row.badgeTone}`}>
                  <span className={`size-1.5 rounded-full ${row.dot}`} />
                  {row.term}
                </span>
                <span className={`inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-xs font-mono font-bold border border-slate-200 shadow-2xs dark:bg-slate-900 dark:border-slate-700 ${row.countTone}`}>
                  {row.count} {row.count === 1 ? 'Question' : 'Questions'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {row.explanation}
              </p>
            </div>
          ))}
          {visibleRows.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
              No question pacing items recorded.
            </div>
          )}
        </div>

        {/* Desktop View: Structured Table (>= sm) */}
        <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                <TableHead className="text-xs font-bold uppercase tracking-wider py-2.5 px-3 whitespace-nowrap">
                  Behavior Pattern
                </TableHead>
                <TableHead className="text-center text-xs font-bold uppercase tracking-wider py-2.5 px-3 whitespace-nowrap">
                  No. of Questions
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider py-2.5 px-3">
                  What It Means
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <TableCell className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold border ${row.badgeTone}`}>
                      <span className={`size-1.5 rounded-full ${row.dot}`} />
                      {row.term}
                    </span>
                  </TableCell>
                  <TableCell className={`py-2.5 px-3 text-center font-mono font-bold text-sm tnum whitespace-nowrap ${row.countTone}`}>
                    {row.count}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {row.explanation}
                  </TableCell>
                </TableRow>
              ))}
              {visibleRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    No question pacing items recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pacing Feedback Box - Clean Single Line Layout */}
      <div
        className={`rounded-xl border p-3 sm:p-3.5 text-xs leading-relaxed transition-all shadow-xs ${isStrength
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/25'
          : 'border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/25'
          }`}
      >
        <div className="flex items-start sm:items-center gap-2">
          <div
            className={`flex size-5.5 shrink-0 items-center justify-center rounded-md text-white shadow-2xs mt-0.5 sm:mt-0 ${isStrength ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-amber-600 dark:bg-amber-500'
              }`}
          >
            {isStrength ? (
              <Sparkles className="size-3.5" />
            ) : (
              <Target className="size-3.5" />
            )}
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
            <span
              className={`font-black uppercase tracking-wider mr-1.5 ${isStrength
                ? 'text-emerald-900 dark:text-emerald-300'
                : 'text-amber-900 dark:text-amber-300'
                }`}
            >
              Pacing Feedback:
            </span>
            <span className="text-slate-900 dark:text-slate-100 font-semibold">
              {isStrength
                ? 'Great pacing! You maintained steady speed and composure across the test.'
                : 'Pacing is your key growth frontier. Allocate time smartly per question to finish comfortably.'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Select max 3 chapters for Maths in Topics to Revisit
export function getDisplayedMathsTopics(topics: TopicToRevisitItem[], maxChapters = 3): TopicToRevisitItem[] {
  if (topics.length <= maxChapters) {
    return topics;
  }
  const selected: TopicToRevisitItem[] = [];
  const seenChapters = new Set<string>();

  // 1. Pick 1 representative topic per distinct chapter
  for (const t of topics) {
    if (selected.length >= maxChapters) break;
    const ch = (t.chapter || '').trim().toLowerCase();
    if (!seenChapters.has(ch)) {
      seenChapters.add(ch);
      selected.push(t);
    }
  }

  // 2. If fewer distinct chapters than maxChapters, fill up to maxChapters with remaining topics
  for (const t of topics) {
    if (selected.length >= maxChapters) break;
    if (!selected.some((s) => s.qno === t.qno)) {
      selected.push(t);
    }
  }

  return selected.sort((a, b) => a.qno - b.qno);
}

// Select max 3 chapters for Science in Topics to Revisit, ensuring diversity across Physics, Chemistry, Biology
export function getDisplayedScienceTopics(topics: TopicToRevisitItem[], maxChapters = 3): TopicToRevisitItem[] {
  if (topics.length <= maxChapters) {
    return topics;
  }
  const selected: TopicToRevisitItem[] = [];
  const seenChapters = new Set<string>();

  // 1. Ensure diversity across Physics, Chemistry, Biology: pick 1 chapter from each branch
  const disciplines = ['physics', 'chemistry', 'biology'];
  for (const disc of disciplines) {
    const match = topics.find(
      (t) => (t.subject || '').toLowerCase() === disc && !seenChapters.has((t.chapter || '').trim().toLowerCase())
    );
    if (match) {
      seenChapters.add((match.chapter || '').trim().toLowerCase());
      selected.push(match);
    }
  }

  // 2. If fewer than maxChapters (e.g. no mistakes in a discipline), pick distinct chapters from available disciplines
  for (const t of topics) {
    if (selected.length >= maxChapters) break;
    const ch = (t.chapter || '').trim().toLowerCase();
    if (!seenChapters.has(ch)) {
      seenChapters.add(ch);
      selected.push(t);
    }
  }

  // 3. Fallback: fill remaining slots up to maxChapters if needed
  for (const t of topics) {
    if (selected.length >= maxChapters) break;
    if (!selected.some((s) => s.qno === t.qno)) {
      selected.push(t);
    }
  }

  return selected.sort((a, b) => a.qno - b.qno);
}

export function formatWeaknessName(name: string): string {
  const map: Record<string, string> = {
    'Conceptual Gap': 'Conceptual Understanding',
    'Application Gap': 'Application Skill',
    'Problem Solving Gap': 'Problem Solving Skill',
    'Problem-Solving Gap': 'Problem Solving Skill',
    'Interpretation Gap': 'Question Interpretation Skill',
    'Accuracy Risk': 'Accuracy',
    'Difficulty Readiness Gap': 'Difficulty Readiness',
    'Multi-Step Question Gap': 'Multi-Step Question Skill',
    'Application-Based Question Gap': 'Application-Based Question Skill',
  };
  return map[name] || name;
}

export function BoardReadinessReport({
  report,
  studentGender,
  studentDetails,
  onRetakeOrBrowse,
  isTeacherView = false,
  onGoToSolutions,
  attemptId,
}: BoardReadinessReportProps) {
  const isMale = (studentGender || report.studentGender) === 'Male';
  const avatarSrc = isMale ? '/board-challenge/Male.webp' : '/board-challenge/Female.webp';

  const [activePage, setActivePage] = useState<'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6'>('page1');
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [revisitFilter, setRevisitFilter] = useState<'all' | RevisitCategory>('all');
  const [auditFilter, setAuditFilter] = useState<'all' | 'incorrect' | 'overtime' | 'revisit'>('all');

  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getPageSection = (pageId: string) => {
    const hyphenated = `report-${pageId.replace(/^page(\d+)$/, 'page-$1')}`;
    return (
      document.getElementById(hyphenated) ||
      document.getElementById(`report-${pageId}`) ||
      document.getElementById(pageId)
    );
  };

  const scrollToPage = (pageId: 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6') => {
    setActivePage(pageId);
    const element = getPageSection(pageId);
    if (!element) return;

    // Suppress scroll-watcher while programmatic smooth scroll is animating
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 950);

    // 1. Primary method: native scrollIntoView reliably scrolls whichever ancestor container has overflow
    // and seamlessly honors CSS scroll-margin-top (e.g. scroll-mt-48 md:scroll-mt-32)
    try {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } catch {
      // fallback to manual calculation
    }

    // 2. Secondary method: calculate offset scroll position across all possible scroll roots (window, body, documentElement)
    const appHeader = document.querySelector('header');
    const appHeaderHeight = appHeader ? appHeader.getBoundingClientRect().height : 0;
    const toolbar = document.getElementById('report-sticky-toolbar');
    const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 0;

    const totalOffset = (appHeaderHeight || 90) + (toolbarHeight || 75) + 14;
    const currentScrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    const rect = element.getBoundingClientRect();
    const targetY = Math.max(0, currentScrollY + rect.top - totalOffset);

    try {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, targetY);
    }

    if (document.body && typeof document.body.scrollTo === 'function') {
      try {
        document.body.scrollTo({
          top: targetY,
          behavior: 'smooth',
        });
      } catch {
        document.body.scrollTop = targetY;
      }
    }

    if (document.documentElement && typeof document.documentElement.scrollTo === 'function') {
      try {
        document.documentElement.scrollTo({
          top: targetY,
          behavior: 'smooth',
        });
      } catch {
        document.documentElement.scrollTop = targetY;
      }
    }
  };

  useEffect(() => {
    const pageIds: Array<'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6'> = [
      'page1',
      'page2',
      'page3',
      'page4',
      'page5',
      ...(isTeacherView ? (['page6'] as const) : []),
    ];

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      const appHeader = document.querySelector('header');
      const appHeaderHeight = appHeader ? appHeader.getBoundingClientRect().height : 0;
      const toolbar = document.getElementById('report-sticky-toolbar');
      const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 0;
      const threshold = (appHeaderHeight || 90) + (toolbarHeight || 75) + 30;

      for (let i = pageIds.length - 1; i >= 0; i--) {
        const el = getPageSection(pageIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            setActivePage(pageIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [isTeacherView]);

  const handleWhatsAppAction = (action: 'whatsapp_contact_us' | 'whatsapp_enroll_now' | 'whatsapp_consultation') => {
    try {
      fetch('/api/student/lead-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'whatsapp_consultation' ? 'whatsapp_contact_us' : action,
          attemptId: attemptId || null,
          source: 'report_page_5',
        }),
      }).catch((err) => console.error('[lead-action] tracking error', err));
    } catch {
      // ignore
    }

    const message =
      action === 'whatsapp_consultation'
        ? `Hi, I just completed the Board Readiness Challenge at Shri Ram Smart Minds Academy. I would like to Book a Free One to One Academic Consultation with Mr. Amal M Das and 1-on-1 consultation for my child based on this report. Please let me know available slots.`
        : action === 'whatsapp_contact_us'
          ? `Hi, I just completed the Board Readiness Challenge at Shri Ram Smart Minds Academy. Based on my diagnostic report, I would like to speak with an academic counsellor about the Class 10 Board Mastery Course. Please share details.`
          : `Hi, I just completed the Board Readiness Challenge at Shri Ram Smart Minds Academy. Based on my diagnostic report, I would like to enroll in the Class 10 Board Mastery Course. Please share the next steps and batch details.`;
    const url = `https://wa.me/918463911854?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };



  // Category & Prep Level styling helpers
  const getPrepLevelBadge = (level: PreparationLevel | string) => {
    const norm = String(level).trim().toLowerCase();
    if (norm.includes('high achievement') || norm === 'advanced') {
      return {
        tone: 'green' as const,
        label: 'High achievement Potential',
        bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        gradient: 'from-emerald-600 to-teal-700',
      };
    }
    if (norm.includes('conceptually strong') || norm === 'proficient') {
      return {
        tone: 'brand' as const,
        label: 'Conceptually Strong',
        bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        gradient: 'from-blue-600 to-indigo-700',
      };
    }
    if (norm.includes('foundational') || norm.includes('early') || norm.includes('emerging')) {
      return {
        tone: 'violet' as const,
        label: 'Foundational',
        bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        gradient: 'from-indigo-600 to-violet-700',
      };
    }
    return {
      tone: 'amber' as const,
      label: 'Basic',
      bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      gradient: 'from-amber-500 to-orange-600',
    };
  };

  const getSkillCategoryBadge = (cat: SkillValueCategory) => {
    switch (cat) {
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Good
          </span>
        );
      case 'Average':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Average
          </span>
        );
      case 'Needs Strengthening':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Needs Strengthening
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'High Priority':
        return (
          <Badge tone="red" className="font-bold">
            High Priority
          </Badge>
        );
      case 'Medium Priority':
        return (
          <Badge tone="amber" className="font-bold">
            Medium Priority
          </Badge>
        );
      case 'Low Priority':
      default:
        return (
          <Badge tone="brand" className="font-bold">
            Low Priority
          </Badge>
        );
    }
  };

  const getRevisitBadge = (cat: RevisitCategory) => {
    switch (cat) {
      case 'Too Slow':
      case 'Severe Overtime':
      case 'High Friction Gap':
      case 'Pacing / Time Management':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="size-3" />
            Too Slow
          </span>
        );
      case 'Too Fast but Incorrect':
      case 'Rapid Guesswork':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
            <Zap className="size-3 text-orange-600" />
            Too Fast but Incorrect
          </span>
        );
      case 'Conceptual / Calculation Gap':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="size-3" />
            Conceptual / Calculation Gap
          </span>
        );
      case 'Unattempted':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <HelpCircle className="size-3 text-slate-500" />
            Unattempted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {cat}
          </span>
        );
    }
  };

  const prepStyle = getPrepLevelBadge(report.levelOfPreparation);
  const prepNorm = String(report.levelOfPreparation || '').trim().toLowerCase();
  const isHighPrep = prepNorm.includes('high achievement') || prepNorm === 'advanced' || (report.briScore ?? 0) >= 70;
  const isMedPrep = !isHighPrep && (prepNorm.includes('conceptually strong') || prepNorm === 'proficient' || (report.briScore ?? 0) >= 50);
  const isVeryLowPrep = !isHighPrep && !isMedPrep && ((report.briScore ?? 0) < 20 || prepNorm.includes('foundational'));

  const filteredTopics = report.topicsToRevisit.filter((t) => {
    if (t.category === 'Rapid Guesswork') return false;
    if (revisitFilter === 'all') return true;
    return t.category === revisitFilter;
  });

  const isTmsStrength = (report.timeManagement?.finalScorePercent ?? 0) >= 70;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* 1. Header Toolbar (Hidden in Print) */}
      <div
        id="report-sticky-toolbar"
        className="no-print sticky top-[5.5rem] md:top-[4rem] z-20 flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-3 sm:p-3.5 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
      >
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shrink-0">
              <GraduationCap className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-brand-100 px-2 py-0.5 text-xs sm:text-[11px] font-black uppercase tracking-wider text-brand-800 dark:bg-brand-950 dark:text-brand-300 whitespace-nowrap">
                  Shri Ram Smart Minds Academy
                </span>
                {studentDetails?.isFormFilled ? (
                  <span className="text-xs sm:text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                    {studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} • {studentDetails.board || 'CBSE'}
                    {isTeacherView && studentDetails.school && (
                      <span className="ml-1 text-[11px] text-slate-400 hidden sm:inline">
                        ({studentDetails.school}{studentDetails.city ? `, ${studentDetails.city}` : ''})
                      </span>
                    )}
                  </span>
                ) : isTeacherView ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                    ⚠️ Unlock Form: Not Filled
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Class X CBSE</span>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white mt-0.5 truncate">
                BOARD READINESS CHALLENGE REPORT
              </h1>
            </div>
          </div>
        </div>

        {/* Page Scroll navigation buttons - Full width dedicated row so P1-P5 never overflow */}
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/90 text-xs font-bold w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => scrollToPage('page1')}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-2.5 sm:px-3 py-2 sm:py-1.5 transition text-center text-xs sm:text-xs font-black ${activePage === 'page1'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
          >
            P1 • Overview
          </button>
          <button
            type="button"
            onClick={() => scrollToPage('page2')}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-2.5 sm:px-3 py-2 sm:py-1.5 transition text-center text-xs sm:text-xs font-black ${activePage === 'page2'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
          >
            P2 • Strengths
          </button>
          <button
            type="button"
            onClick={() => scrollToPage('page3')}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-2.5 sm:px-3 py-2 sm:py-1.5 transition text-center text-xs sm:text-xs font-black ${activePage === 'page3'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
          >
            P3 • Priorities
          </button>
          <button
            type="button"
            onClick={() => scrollToPage('page4')}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-2.5 sm:px-3 py-2 sm:py-1.5 transition text-center text-xs sm:text-xs font-black ${activePage === 'page4'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
          >
            P4 • Recommendations
          </button>
          <button
            type="button"
            onClick={() => scrollToPage('page5')}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-2.5 sm:px-3 py-2 sm:py-1.5 transition text-center text-xs sm:text-xs font-black ${activePage === 'page5'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
          >
            P5 • Support
          </button>
          {isTeacherView && (
            <button
              type="button"
              onClick={() => scrollToPage('page6')}
              className={`flex-1 shrink-0 whitespace-nowrap flex items-center justify-center gap-1 rounded-lg px-2.5 sm:px-2.5 py-2 sm:py-1.5 transition text-xs sm:text-xs font-black ${activePage === 'page6'
                ? 'bg-amber-500 text-slate-950 shadow-xs dark:bg-amber-400'
                : 'text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200'
                }`}
            >
              <Calculator className="size-3.5" />
              P6 • Audit
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          PAGE 1: BOARD READINESS CHALLENGE REPORT
          ========================================================================= */}
      <section
        id="report-page-1"
        className="report-page-container report-page-1 relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-7 md:p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 block print:block scroll-mt-48 md:scroll-mt-32"
      >
        {/* Header watermark & Brand bar */}
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-start sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <span className="text-xs sm:text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <GraduationCap className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="inline-flex flex-wrap items-baseline gap-x-1">
                  <span className="whitespace-nowrap">Shri Ram</span>
                  <span className="whitespace-nowrap">Smart Minds Academy</span>
                </span>
              </span>
              <span className="rounded bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-brand-700 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-300">
                Diagnostic Evaluation
              </span>
              {studentDetails?.isFormFilled ? (
                <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} • {studentDetails.board || 'CBSE'}
                </span>
              ) : isTeacherView ? (
                <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  ⚠️ Unlock Form: Not Filled by Student
                </span>
              ) : null}
            </div>
            <div className="text-right shrink-0 pt-0.5 sm:pt-0">
              <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs whitespace-nowrap">
                {isTeacherView ? 'PAGE 1 OF 6' : 'PAGE 1 OF 5'}
              </span>
            </div>
          </div>

          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-2.5 break-words">
            BOARD READINESS CHALLENGE REPORT
          </h2>

          <div className="mt-3.5 w-full rounded-xl border border-blue-200/90 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-3.5 sm:p-4 text-sm dark:border-blue-900/60 dark:bg-gradient-to-r dark:from-blue-950/40 dark:to-indigo-950/20 flex items-start gap-2.5 shadow-2xs">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white mt-0.5 shadow-2xs">
              <Info className="size-4" />
            </div>
            <div className="leading-relaxed text-slate-700 dark:text-slate-300 flex-1 text-sm sm:text-sm">
              <span className="font-extrabold text-blue-800 dark:text-blue-300 mr-1.5 inline-flex items-center text-sm">
                A Note For Parents:
              </span>
              This report is best used as a starting point for understanding your child&apos;s current preparation and identifying where focused support can make the greatest difference.
            </div>
          </div>
        </div>

        {/* Teacher View Notice if student has not filled form */}
        {isTeacherView && !studentDetails?.isFormFilled && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Teacher Authorization View</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                This student has not submitted the report unlock form yet (Board, School, and City details are pending). As a Teacher, you have full administrative authorization to view their complete diagnostic performance.
              </p>
            </div>
          </div>
        )}

        {/* Mentor Greeting Card */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-50/80 via-indigo-50/30 to-slate-50 p-4 sm:p-6 border border-brand-100/80 dark:border-slate-800 dark:from-slate-900 dark:via-brand-950/20 dark:to-slate-900 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-3 w-full">
              {/* Mobile Mascot Avatar in header (< sm) */}
              <div className="flex items-center gap-3.5 sm:hidden">
                <div className="relative size-20 shrink-0 rounded-2xl border-2 border-brand-500/40 bg-gradient-to-br from-white to-brand-50/50 p-1.5 shadow-md dark:from-slate-800 dark:to-slate-900 dark:border-brand-400/40 flex items-center justify-center overflow-hidden">
                  <img
                    src={avatarSrc}
                    alt={isMale ? 'Male Student Mascot' : 'Female Student Mascot'}
                    className="size-full object-contain"
                  />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="inline-block rounded-md bg-brand-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                    SRSMA Mentorship
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    Dear {report.studentName},
                  </h3>
                </div>
              </div>

              {/* Desktop Heading (>= sm) */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-black text-base shadow-sm">
                  🎓
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Dear {report.studentName},
                </h3>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                Congratulations on taking this vital first step! Facing a diagnostic test takes courage, and it shows your true dedication to your Class 10 {studentDetails?.board} Boards. Use the insights given in this report to uncover your strengths, target your weak spots, and build the confidence you need to excel. Your journey to an outstanding Board score starts right here!
              </p>
            </div>

            {/* Desktop Mascot Standing Character (>= sm) */}
            <div className="hidden sm:flex shrink-0 items-center justify-center">
              <img
                src={avatarSrc}
                alt={isMale ? 'Male Student Mascot' : 'Female Student Mascot'}
                className="h-32 sm:h-40 w-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Personal Diagnostic Report Title */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-1.5 rounded-full bg-brand-600" />
            <h3 className="text-sm sm:text-base font-black tracking-wider uppercase text-slate-900 dark:text-white">
              Personal Diagnostic Evaluation
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Overview &amp; Baseline
          </span>
        </div>

        {/* Hero Readiness Snapshot */}
        <div className="mt-4 grid gap-5 sm:grid-cols-12">
          {/* BRI Speedometer Gauge Arc Tile */}
          <div className="sm:col-span-6 lg:col-span-5">
            <BriSpeedometerGauge score={report.briScore} prepStyle={prepStyle} />
          </div>

          {/* Score Snapshot Cards & Subject Performance Matrix */}
          <div className="sm:col-span-6 lg:col-span-7 flex flex-col justify-between gap-3">
            {/* Overall Raw Score Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Overall Raw Score
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Accuracy: {Math.round((report.totalRawScore / Math.max(1, report.totalQuestions)) * 100)}%
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tnum text-3xl font-black text-slate-900 dark:text-white">
                  {report.totalRawScore}
                </span>
                <span className="text-sm font-bold text-slate-400">/ {report.totalQuestions} Questions Correct</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${report.totalRawScore <= 8
                    ? 'bg-rose-500'
                    : report.totalRawScore <= 14
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    }`}
                  style={{ width: `${(report.totalRawScore / Math.max(1, report.totalQuestions)) * 100}%` }}
                />
              </div>
            </div>

            {/* Subject Breakdown Matrix */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject-Wise Performance</span>
                <span className="uppercase tracking-wider text-slate-500 dark:text-slate-400">Accuracy %</span>
              </div>

              {/* Mathematics */}
              <div className="flex items-center justify-between rounded-xl bg-blue-50/60 p-2.5 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold shadow-2xs">
                    📐
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Mathematics</span>
                </div>
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 text-sm font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 tnum">
                  {report.breakdown.mathematics.percentage}%
                </span>
              </div>

              {/* Science */}
              <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                      🧪
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Science</span>
                  </div>
                  <span className="rounded-lg bg-emerald-600/10 px-2.5 py-1 text-sm font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 tnum">
                    {report.breakdown.science.percentage}%
                  </span>
                </div>

                {/* Science Sub-Disciplines Micro Pills */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="rounded-lg bg-white/90 dark:bg-slate-800/80 p-1.5 text-center border border-emerald-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Physics</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white tnum">{report.breakdown.physics?.percentage ?? 0}%</span>
                  </div>
                  <div className="rounded-lg bg-white/90 dark:bg-slate-800/80 p-1.5 text-center border border-emerald-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Chemistry</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white tnum">{report.breakdown.chemistry?.percentage ?? 0}%</span>
                  </div>
                  <div className="rounded-lg bg-white/90 dark:bg-slate-800/80 p-1.5 text-center border border-emerald-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">Biology</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white tnum">{report.breakdown.biology?.percentage ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Comparison Insight Box */}
            {(() => {
              const insight = getSubjectPerformanceInsight(
                report.breakdown.mathematics.percentage,
                report.breakdown.science.percentage,
              );
              return (
                <div className="rounded-2xl border-2 border-sky-300/80 bg-gradient-to-r from-sky-50/90 via-blue-50/70 to-indigo-50/70 p-4 text-xs leading-relaxed text-blue-950 dark:border-sky-700/60 dark:bg-gradient-to-r dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/30 dark:text-sky-100 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-sky-200/60 pb-2 dark:border-sky-800/60">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px] text-sky-800 dark:text-sky-300">
                      <div className="flex size-6 items-center justify-center rounded-lg bg-sky-600 text-white shadow-2xs">
                        <Sparkles className="size-3.5" />
                      </div>
                      <span>Subject Performance Insight</span>
                    </div>
                    <span className="rounded-md bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:text-sky-200 border border-sky-300/60 dark:border-sky-700">
                      {insight.label}
                    </span>
                  </div>
                  <p className="mt-2.5 font-medium leading-relaxed text-slate-800 dark:text-slate-200 text-xs sm:text-[13px]">
                    {insight.message}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Difficulty Level Performance Bar Graph (Maths & Science) */}
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="size-4 text-brand-600 dark:text-brand-400" />
                Difficulty-Wise Performance
              </h3>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Mathematics Difficulty Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📐</span>
                  <span>Mathematics</span>
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Overall: {report.breakdown.mathematics.percentage}%
                </span>
              </div>
              <div className="space-y-3">
                <MobileBatteryBar
                  label="Easy"
                  variant="easy"
                  percentage={report.subjectDifficultyBreakdowns?.mathematics.easy.percentage ?? 0}
                />
                <MobileBatteryBar
                  label="Medium"
                  variant="medium"
                  percentage={report.subjectDifficultyBreakdowns?.mathematics.medium.percentage ?? 0}
                />
                <MobileBatteryBar
                  label="Hard"
                  variant="hard"
                  percentage={report.subjectDifficultyBreakdowns?.mathematics.hard.percentage ?? 0}
                />
              </div>
            </div>

            {/* Science Difficulty Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>🧪</span>
                  <span>Science</span>
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Overall: {report.breakdown.science.percentage}%
                </span>
              </div>
              <div className="space-y-3">
                <MobileBatteryBar
                  label="Easy"
                  variant="easy"
                  percentage={report.subjectDifficultyBreakdowns?.science.easy.percentage ?? 0}
                />
                <MobileBatteryBar
                  label="Medium"
                  variant="medium"
                  percentage={report.subjectDifficultyBreakdowns?.science.medium.percentage ?? 0}
                />
                <MobileBatteryBar
                  label="Hard"
                  variant="hard"
                  percentage={report.subjectDifficultyBreakdowns?.science.hard.percentage ?? 0}
                />
              </div>
            </div>
          </div>

          {/* Difficulty-Wise Performance Insight Box */}
          <div className="mt-4 rounded-2xl border-2 border-purple-400/40 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-pink-500/10 p-4 sm:p-5 dark:border-purple-500/40 dark:bg-gradient-to-r dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900 shadow-md">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300/60 dark:border-purple-800">
                  Diagnostic Insight
                </div>
                <h4 className="text-sm sm:text-base font-black tracking-wider uppercase text-purple-950 dark:text-purple-100">
                  Difficulty-Wise Performance Insight
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium dark:text-slate-200">
                  {getDifficultyInsight(report.subjectDifficultyBreakdowns)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Front Page Guesswork Alert */}
        {report.timeManagement?.guessworkQuestions && report.timeManagement.guessworkQuestions.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-yellow-50/60 p-4 sm:p-5 shadow-xs dark:border-amber-500/30 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-amber-950/20 dark:to-slate-900/95 dark:shadow-[0_0_20px_-3px_rgba(245,158,11,0.12)]">
            <div className="flex items-start gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black shadow-sm ring-1 ring-amber-400/40">
                <AlertTriangle className="size-4.5 text-slate-950" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-400/15 dark:text-amber-300 ring-1 ring-amber-500/20">
                    Rapid Response Alert
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Response time &lt; 8s
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Possibility of Guesswork Detected
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  There is possibility of guesswork being done in answering{' '}
                  <span className="inline-flex flex-wrap items-center gap-1 align-baseline my-0.5">
                    {report.timeManagement.guessworkQuestions.map((q) => (
                      <span
                        key={q}
                        className="inline-flex items-center rounded-md bg-amber-200/80 px-1.5 py-0.5 text-xs font-black text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 dark:border dark:border-amber-400/30"
                      >
                        Q{q}
                      </span>
                    ))}
                  </span>{' '}
                  (responses were submitted in less than 8 seconds).
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          PAGE 2: YOUR STRENGTHS
          ========================================================================= */}
      <section
        id="report-page-2"
        className="report-page-container report-page-2 relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-7 md:p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 block print:block scroll-mt-48 md:scroll-mt-32"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs sm:text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <GraduationCap className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="inline-flex flex-wrap items-baseline gap-x-1">
                <span className="whitespace-nowrap">Shri Ram</span>
                <span className="whitespace-nowrap">Smart Minds Academy</span>
              </span>
            </span>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5 break-words">
              PAGE 2: YOUR STRENGTHS
            </h2>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs whitespace-nowrap">
              {isTeacherView ? 'PAGE 2 OF 6' : 'PAGE 2 OF 5'}
            </span>
          </div>
        </div>

        {/* Top 3 Strengths */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
              {report.strengthsTitle || 'YOUR STRENGTHS'}
            </h3>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Top Performance Categories
            </span>
          </div>

          {report.strengths.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              No syllabus categories scored 50% or above in this test. Focused revision will help build your core strengths!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {report.strengths.map((s) => {
                const podiumMedal = s.rank === 1 ? '🥇 #1' : s.rank === 2 ? '🥈 #2' : '🥉 #3';
                const medalClass = s.rank === 1
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
                  : s.rank === 2
                    ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-xs'
                    : 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-xs';

                const isCore = s.percentage >= 70;
                const isPotential = s.percentage < 60;
                const cardTag = isCore
                  ? 'Verified Core Strength'
                  : isPotential
                    ? 'Areas with Most Potential'
                    : 'Emerging Strength';

                return (
                  <div
                    key={s.rank}
                    className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${isCore
                      ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-teal-950/20'
                      : 'border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-indigo-50/30 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/20'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-md font-black text-xs tracking-wider uppercase ${medalClass}`}>
                          {podiumMedal}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${isCore
                          ? 'bg-emerald-100/70 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-blue-100/70 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                          }`}>
                          {s.percentage}%
                        </span>
                      </div>

                      <h4 className="mt-3 text-base font-black text-slate-900 dark:text-white">
                        {s.name}
                      </h4>

                      {/* Faculty Feedback reason callout */}
                      <div className={`mt-3 rounded-xl p-3 border text-xs font-medium leading-relaxed shadow-2xs ${isCore
                        ? 'bg-emerald-500/10 border-emerald-300/60 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'bg-blue-500/10 border-blue-300/60 text-blue-950 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200'
                        }`}>
                        <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider mb-1 opacity-90">
                          <Sparkles className="size-3 shrink-0" />
                          <span>Faculty Evaluation</span>
                        </div>
                        <p>{s.reason}</p>
                      </div>
                    </div>

                    <div className={`mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold ${isCore
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-blue-700 dark:text-blue-400'
                      }`}>
                      {isCore ? (
                        <>
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{cardTag}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{cardTag}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Time Management Section (When TMS >= 70%: Displayed as Strength on Page 2) */}
        {report.timeManagement && isTmsStrength && (
          <TimeManagementReportSection
            timeManagement={report.timeManagement}
            isStrength={true}
          />
        )}

        {/* Question Structure Performance */}
        {(() => {
          const PATTERNS = [
            {
              name: 'Direct',
              icon: <Zap className="size-4 text-amber-500" />,
              iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
              borderHover: 'hover:border-amber-300 dark:hover:border-amber-700/60',
            },
            {
              name: 'Multi-step',
              icon: <Layers className="size-4 text-indigo-500" />,
              iconBg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
              borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
            },
            {
              name: 'Diagram-based',
              icon: <Compass className="size-4 text-emerald-500" />,
              iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
              borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
            },
            {
              name: 'Application-based',
              icon: <Wrench className="size-4 text-blue-500" />,
              iconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
              borderHover: 'hover:border-blue-300 dark:hover:border-blue-700/60',
            },
            {
              name: 'Word Problem',
              icon: <BookOpen className="size-4 text-purple-500" />,
              iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
              borderHover: 'hover:border-purple-300 dark:hover:border-purple-700/60',
            },
          ];

          const sortedPatterns = PATTERNS.map((p) => {
            const found = report.structures.find((s) => s.type.toLowerCase() === p.name.toLowerCase());
            const st = found ?? { type: p.name, correct: 0, total: 0, percentage: 0 };
            const starRating = Math.round((st.percentage / 100) * 5 * 10) / 10;
            return { p, st, starRating };
          }).sort((a, b) => b.st.percentage - a.st.percentage);

          return (
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="size-4 text-brand-600 dark:text-brand-400" />
                  Your Performance Pattern (By Question Type)
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">5 Performance Patterns</span>
              </div>

              {/* Mobile View: Preserved Table Layout */}
              <div className="md:hidden rounded-2xl border border-slate-200/90 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                      <TableHead className="text-xs font-bold uppercase tracking-wider py-3 px-3 sm:px-4 whitespace-nowrap">Performance Pattern</TableHead>
                      <TableHead className="text-left sm:text-right text-xs font-bold uppercase tracking-wider py-3 px-3 sm:px-4 whitespace-nowrap">Rating (up to 5 Stars)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPatterns.map(({ p, st, starRating }) => (
                      <TableRow key={st.type} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <TableCell className="py-3 px-3 sm:px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                              {p.icon}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {st.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3 sm:px-4 text-left sm:text-right whitespace-nowrap shrink-0">
                          <EcommerceStarRating rating={starRating} align="responsive" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Desktop View: All 5 Cards in a Single Line */}
              <div className="hidden md:grid md:grid-cols-5 gap-3">
                {sortedPatterns.map(({ p, st, starRating }) => (
                  <div
                    key={st.type}
                    className={`flex flex-col items-center justify-between text-center rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 group ${p.borderHover}`}
                  >
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className={`flex size-9 items-center justify-center rounded-xl ${p.iconBg} shadow-2xs group-hover:scale-110 transition-transform duration-200`}>
                        {p.icon}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tracking-tight leading-tight min-h-[2.25rem] flex items-center justify-center text-center">
                        {st.type}
                      </span>
                    </div>
                    <div className="mt-3 pt-2.5 w-full border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center">
                      <EcommerceStarRating rating={starRating} align="center" layout="stacked" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* What This Tells You Narrative Box */}
        <div className="mt-8 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-brand-500/10 p-5 sm:p-6 dark:border-amber-500/40 dark:bg-gradient-to-r dark:from-amber-950/35 dark:via-orange-950/25 dark:to-slate-900 shadow-md">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-md font-black text-sm">
              <Brain className="size-5" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                Pattern Analysis
              </div>
              <h4 className="text-sm sm:text-base font-black tracking-wider uppercase text-amber-950 dark:text-amber-100">
                What This Tells You
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium dark:text-slate-200">
                {report.performancePatternInsight}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PAGE 3: WHERE SHOULD YOU IMPROVE?
          ========================================================================= */}
      <section
        id="report-page-3"
        className="report-page-container report-page-3 relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-7 md:p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 block print:block scroll-mt-48 md:scroll-mt-32"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs sm:text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <GraduationCap className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="inline-flex flex-wrap items-baseline gap-x-1">
                <span className="whitespace-nowrap">Shri Ram</span>
                <span className="whitespace-nowrap">Smart Minds Academy</span>
              </span>
            </span>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5 break-words">
              Page 3: WHERE SHOULD YOU IMPROVE?
            </h2>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs whitespace-nowrap">
              {isTeacherView ? 'PAGE 3 OF 6' : 'PAGE 3 OF 5'}
            </span>
          </div>
        </div>

        {/* Priority Gaps */}
        {(() => {
          const weaknessGaps = (report.priorityGaps || []).filter((g) => g.scorePercent < 50).slice(0, 4);
          return (
            <div className="mt-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="size-4 text-brand-600 dark:text-brand-400" />
                  Your Priority Gaps
                </h3>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  High-Impact Growth Frontiers
                </span>
              </div>

              {weaknessGaps.length === 0 ? (
                <div className="relative overflow-hidden flex flex-col items-center justify-center rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 via-teal-50/40 to-emerald-50/70 p-6 sm:p-8 text-center shadow-xs dark:border-emerald-500/30 dark:bg-gradient-to-b dark:from-slate-900 dark:via-emerald-950/25 dark:to-slate-900 dark:shadow-[0_0_35px_-5px_rgba(16,185,129,0.18)]">
                  {/* Ambient celebratory radial glow */}
                  <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 size-48 rounded-full bg-emerald-400/20 dark:bg-emerald-400/15 blur-2xl" />

                  {/* Trophy Medallion */}
                  <div className="relative flex size-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-emerald-400/30 dark:bg-emerald-400/20 blur-md animate-pulse" />
                    <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-300 dark:ring-emerald-400/60">
                      <Award className="size-7 text-slate-950" />
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-400/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-400/30 shadow-2xs">
                    <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Excellence Benchmark Achieved</span>
                  </div>

                  <h4 className="mt-3 text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    Congratulations! No Weakness Areas Detected
                  </h4>

                  <p className="mt-2 max-w-lg text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                    Outstanding performance! You scored 50% or above across all evaluated syllabus categories. Keep up the phenomenal work for your board exams!
                  </p>

                  {/* 3 Academic Milestone Badges */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-emerald-200/60 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-emerald-100 dark:border-slate-700 shadow-2xs">
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      All Categories &gt;= 50%
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-emerald-100 dark:border-slate-700 shadow-2xs">
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      Zero Critical Deficits
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-emerald-100 dark:border-slate-700 shadow-2xs">
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      Board Ready Pacing
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-3 sm:grid-cols-2 ${weaknessGaps.length === 1
                    ? 'lg:grid-cols-1 max-w-md'
                    : weaknessGaps.length === 2
                      ? 'lg:grid-cols-2'
                      : weaknessGaps.length === 3
                        ? 'lg:grid-cols-3'
                        : 'lg:grid-cols-4'
                    }`}
                >
                  {weaknessGaps.map((g) => {
                    const isHighPriority = g.priority === 'High Priority';
                    const borderClass = isHighPriority
                      ? 'border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-900 dark:to-rose-950/20'
                      : 'border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20';

                    return (
                      <div
                        key={g.rank}
                        className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${borderClass}`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">#{g.rank} Priority Focus</span>
                            {getPriorityBadge(g.priority)}
                          </div>
                          <h4 className="mt-2.5 text-base font-black text-slate-900 dark:text-white">
                            {formatWeaknessName(g.name)}
                          </h4>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <EcommerceStarRating rating={Math.round((g.scorePercent / 100) * 5 * 10) / 10} align="start" />
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                              {g.scorePercent}%
                            </span>
                          </div>
                        </div>
                        {g.message && (
                          <div className={`mt-3 rounded-xl p-3 border-2 text-xs font-medium leading-relaxed shadow-xs ${isHighPriority
                            ? 'bg-amber-50/95 border-amber-400 text-amber-950 dark:border-amber-500/70 dark:bg-amber-950/40 dark:text-amber-200'
                            : 'bg-amber-50/90 border-amber-300 text-amber-950 dark:border-amber-600/70 dark:bg-amber-950/40 dark:text-amber-200'
                            }`}>
                            <div className="flex items-center gap-1 font-extrabold text-[10px] uppercase tracking-wider mb-1">
                              <Target className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span className="text-amber-900 dark:text-amber-300 font-extrabold">Improvement Feedback</span>
                            </div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{g.message}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Time Management Section (When TMS < 70%: Displayed as Area for Improvement on Page 3) */}
        {report.timeManagement && !isTmsStrength && (
          <TimeManagementReportSection
            timeManagement={report.timeManagement}
            isStrength={false}
          />
        )}

        {/* Topics to Revisit: 2 Distinct Tables (Mathematics & Science) */}
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="size-4 text-brand-600 dark:text-brand-400" />
              Topics to Revisit
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Key chapters in Mathematics and Science where you can review questions and strengthen your concepts:
            </p>
          </div>

          {/* TABLE 1: Mathematics */}
          {(() => {
            const allMathsTopics = report.topicsToRevisit.filter(
              (t) => t.subject.toLowerCase() === 'maths' || t.subject.toLowerCase() === 'mathematics',
            );
            const mathsTopics = getDisplayedMathsTopics(allMathsTopics, 3);
            const hasTooFast = mathsTopics.some(
              (t) => t.category === 'Too Fast but Incorrect' || t.category === 'Rapid Guesswork',
            );
            const hasTooSlow = mathsTopics.some(
              (t) =>
                t.category === 'Too Slow' ||
                t.category === 'Severe Overtime' ||
                t.category === 'Pacing / Time Management',
            );
            const hasUnattempted = mathsTopics.some((t) => t.category === 'Unattempted');

            return (
              <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold text-xs dark:bg-blue-950 dark:text-blue-300 shadow-2xs">
                      📐
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Mathematics — Topics to Revisit ({mathsTopics.length})
                    </h4>
                  </div>
                </div>

                {/* Mobile Question Cards (< md) */}
                <div className="space-y-2.5 md:hidden">
                  {mathsTopics.map((t) => (
                    <div
                      key={t.qno}
                      className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center justify-center size-6 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-black text-xs shadow-2xs">
                          Q{t.qno}
                        </span>
                        <div className="shrink-0">
                          {getRevisitBadge(t.category)}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {t.chapter}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.topic}
                        </div>
                      </div>
                    </div>
                  ))}
                  {mathsTopics.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      🎉 No Mathematics topics require revisit. High accuracy and disciplined pacing maintained!
                    </div>
                  )}
                </div>

                {/* Desktop Academic Table (>= md) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                        <TableHead className="w-14 text-center text-xs font-bold uppercase tracking-wider">Q#</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Chapter &amp; Topic</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mathsTopics.map((t) => (
                        <TableRow key={t.qno} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <TableCell className="text-center font-bold text-slate-900 dark:text-white">
                            {t.qno}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{t.chapter}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t.topic}</div>
                          </TableCell>
                          <TableCell className="text-right">{getRevisitBadge(t.category)}</TableCell>
                        </TableRow>
                      ))}
                      {mathsTopics.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-6 text-center text-slate-400 dark:text-slate-500">
                            🎉 No Mathematics topics require revisit. High accuracy and disciplined pacing maintained!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {(hasTooFast || hasTooSlow || hasUnattempted) && (
                  <div className="pt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-slate-800/60">
                    {hasTooFast && (
                      <p>
                        <span className="font-bold text-orange-600 dark:text-orange-400">* Too Fast but Incorrect:</span> Questions answered in under 8 seconds that resulted in an incorrect response. Take extra care to read questions thoroughly before answering.
                      </p>
                    )}
                    {hasTooSlow && (
                      <p>
                        <span className="font-bold text-amber-600 dark:text-amber-400">* Too Slow:</span> Questions taking more than double the expected time limit. Timed drill practice will help refine solving speed.
                      </p>
                    )}
                    {hasUnattempted && (
                      <p>
                        <span className="font-bold text-slate-600 dark:text-slate-300">* Unattempted Chapters:</span> Questions left unattempted during the exam. Practice these chapters independently to build speed and confidence.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TABLE 2: Science */}
          {(() => {
            const allScienceTopics = report.topicsToRevisit.filter((t) =>
              ['physics', 'chemistry', 'biology', 'science'].includes(t.subject.toLowerCase()),
            );
            const scienceTopics = getDisplayedScienceTopics(allScienceTopics, 3);
            const hasTooFast = scienceTopics.some(
              (t) => t.category === 'Too Fast but Incorrect' || t.category === 'Rapid Guesswork',
            );
            const hasTooSlow = scienceTopics.some(
              (t) =>
                t.category === 'Too Slow' ||
                t.category === 'Severe Overtime' ||
                t.category === 'Pacing / Time Management',
            );
            const hasUnattempted = scienceTopics.some((t) => t.category === 'Unattempted');

            return (
              <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300 shadow-2xs">
                      🧪
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Science — Topics to Revisit ({scienceTopics.length})
                    </h4>
                  </div>
                </div>

                {/* Mobile Question Cards (< md) */}
                <div className="space-y-2.5 md:hidden">
                  {scienceTopics.map((t) => (
                    <div
                      key={t.qno}
                      className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center size-6 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-black text-xs shadow-2xs">
                            Q{t.qno}
                          </span>
                          <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            {t.subject}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {getRevisitBadge(t.category)}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {t.chapter}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.topic}
                        </div>
                      </div>
                    </div>
                  ))}
                  {scienceTopics.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      🎉 No Science topics require revisit. High accuracy and disciplined pacing maintained!
                    </div>
                  )}
                </div>

                {/* Desktop Academic Table (>= md) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                        <TableHead className="w-14 text-center text-xs font-bold uppercase tracking-wider">Q#</TableHead>
                        <TableHead className="w-24 text-xs font-bold uppercase tracking-wider">Branch</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Chapter &amp; Topic</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scienceTopics.map((t) => (
                        <TableRow key={t.qno} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <TableCell className="text-center font-bold text-slate-900 dark:text-white">
                            {t.qno}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800 capitalize dark:text-slate-200">
                            {t.subject}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{t.chapter}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{t.topic}</div>
                          </TableCell>
                          <TableCell className="text-right">{getRevisitBadge(t.category)}</TableCell>
                        </TableRow>
                      ))}
                      {scienceTopics.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-slate-400 dark:text-slate-500">
                            🎉 No Science topics require revisit. High accuracy and disciplined pacing maintained!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {(hasTooFast || hasTooSlow || hasUnattempted) && (
                  <div className="pt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-slate-800/60">
                    {hasTooFast && (
                      <p>
                        <span className="font-bold text-orange-600 dark:text-orange-400">* Too Fast but Incorrect:</span> Questions answered in under 8 seconds that resulted in an incorrect response. Take extra care to read questions thoroughly before answering.
                      </p>
                    )}
                    {hasTooSlow && (
                      <p>
                        <span className="font-bold text-amber-600 dark:text-amber-400">* Too Slow:</span> Questions taking more than double the expected time limit. Timed drill practice will help refine solving speed.
                      </p>
                    )}
                    {hasUnattempted && (
                      <p>
                        <span className="font-bold text-slate-600 dark:text-slate-300">* Unattempted Chapters:</span> Questions left unattempted during the exam. Practice these chapters independently to build speed and confidence.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <p className="text-[11px] text-slate-400 italic text-center sm:text-left">
            *Topic observations are based only on the questions tested.*
          </p>
        </div>

        {/* Official Academic Seal & Certification Footer */}
        <div className="mt-8 border-t border-slate-200/80 dark:border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 font-black text-xs border border-brand-200/50">
              ✓
            </span>
            <div>
              Official Diagnostic Dossier for <strong className="text-slate-800 dark:text-slate-200">{report.studentName}</strong> • {studentDetails?.isFormFilled ? `${studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} ${studentDetails.board || 'CBSE'}` : 'Class X Board Readiness Challenge'}
            </div>
          </div>
          <div className="text-center sm:text-right font-semibold text-slate-600 dark:text-slate-400">
            Shri Ram Smart Minds Academy • Academic Evaluation Office
          </div>
        </div>
      </section>

      {/* =========================================================================
          PAGE 4: RECOMMENDATIONS (CIRCUIT ROADMAP STEPPER DESIGN)
          ========================================================================= */}
      {(() => {
        const prepNorm = String(report.levelOfPreparation || '').trim().toLowerCase();
        const isHigh = prepNorm.includes('high achievement') || prepNorm === 'advanced' || (report.briScore ?? 0) >= 70;
        const isMed = !isHigh && (prepNorm.includes('conceptually strong') || prepNorm === 'proficient' || (report.briScore ?? 0) >= 50);
        const isBasic = !isHigh && !isMed && !isVeryLowPrep;

        type RecommendationStep = {
          step: string;
          nodeIcon: React.ReactNode;
          cardIcon: React.ReactNode;
          title: string;
          headlineFocus: string;
          description?: string;
          actionBox?: React.ReactNode;
          tags?: Array<{ label: string; className: string }>;
        };

        let badgeLabel = '🎯 Level of Preparation: Conceptually Strong';
        let badgeStyle = 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40';
        let heroTitle = 'TURN YOUR CURRENT PERFORMANCE INTO STRONGER BOARD PREPARATION';
        let heroSubtitle = 'You have built solid conceptual understanding across core topics. The next critical leap is turning that understanding into dependable exam-style problem solving, higher accuracy under timer conditions, and mastery of multi-step questions.';
        let steps: RecommendationStep[] = [];

        if (isHigh) {
          badgeLabel = '🏆 Level of Preparation: High Achievement Potential';
          badgeStyle = 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40';
          heroTitle = 'HOW TO MOVE FROM STRONG TO EXCELLENT';
          heroSubtitle = 'Your diagnostic performance confirms strong grasp across standard chapters. To reach the top tier and secure 95%+ in Boards, your strategic focus must now shift towards unfamiliar problem varieties, cross-chapter synthesis, and high execution speed under timed pressure.';
          steps = [
            {
              step: '01',
              nodeIcon: <Puzzle className="size-4 text-emerald-600 dark:text-emerald-400" />,
              cardIcon: <Puzzle className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'CHALLENGE YOURSELF',
              headlineFocus: 'Regularly include unfamiliar and higher-order problems',
              description: 'Do not spend all your practice time on questions you can already solve.',
              actionBox: (
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  ★ High-Impact: Devote 40%+ of study time to unfamiliar &amp; Competency-based problems
                </span>
              ),
            },
            {
              step: '02',
              nodeIcon: <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />,
              cardIcon: <RotateCcw className="size-3.5 text-amber-600 dark:text-amber-400" />,
              title: 'PRACTISE MIXED PROBLEMS',
              headlineFocus: 'Solve mixed-topic sets instead of only single-chapter questions',
              description: 'Train your brain to recognize the relevant concept without knowing the chapter in advance.',
              actionBox: (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Cognitive Strategy: Train brain to recognize chapter and concept automatically
                </span>
              ),
            },
            {
              step: '03',
              nodeIcon: <Target className="size-4 text-rose-600 dark:text-rose-400" />,
              cardIcon: <Target className="size-3.5 text-rose-600 dark:text-rose-400" />,
              title: 'ANALYSE RECURRING MISTAKES',
              headlineFocus: 'Keep a targeted error list for higher-level questions',
              tags: [
                { label: '• Concept Gap', className: 'bg-rose-500 text-white font-bold' },
                { label: '• Misread Trap', className: 'bg-amber-500 text-slate-950 font-bold' },
                { label: '• Calculation', className: 'bg-purple-600 text-white font-bold' },
                { label: '• Pacing Rush', className: 'bg-sky-500 text-white font-bold' },
              ],
              actionBox: (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Error Tagging: Categorize every missed mark into root-cause buckets
                </span>
              ),
            },
            {
              step: '04',
              nodeIcon: <Timer className="size-4 text-sky-600 dark:text-sky-400" />,
              cardIcon: <Timer className="size-3.5 text-sky-600 dark:text-sky-400" />,
              title: 'SIMULATING TIMED EXAM CONDITION',
              headlineFocus: 'Complete full question sections strictly against the clock',
              description: 'Timed practice ensures speed and composure during the final examination.',
              actionBox: (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Pacing Cadence: 3-hour timed Board simulation once every 10–14 days
                </span>
              ),
            },
            {
              step: '05',
              nodeIcon: <Award className="size-4 text-amber-600 dark:text-amber-400" />,
              cardIcon: <Award className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'BOARD-STYLE MASTERY',
              headlineFocus: 'Focus on step-marking, justification and precise presentation',
              description: 'CBSE awards marks per step. Write answers with explicit intermediate steps.',
              actionBox: (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Board Target: Full sample papers, Assertion-Reason, and Case Study formats
                </span>
              ),
            },
          ];
        } else if (isMed) {
          badgeLabel = '🎯 Level of Preparation: Conceptually Strong';
          badgeStyle = 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40';
          heroTitle = 'TURN YOUR CURRENT PERFORMANCE INTO STRONGER BOARD PREPARATION';
          heroSubtitle = 'You have built solid conceptual understanding across core topics. The next critical leap is turning that understanding into dependable exam-style problem solving, higher accuracy under timer conditions, and mastery of multi-step questions.';
          steps = [
            {
              step: '01',
              nodeIcon: <Puzzle className="size-4 text-indigo-600 dark:text-indigo-400" />,
              cardIcon: <Puzzle className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'MOVE BEYOND DIRECT QUESTIONS',
              headlineFocus: 'For every chapter you study, include application-based and multi-step questions—not only straightforward exercises.',
              actionBox: (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100/80 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  Action: Complement textbook drills with scenario-based &amp; application questions
                </span>
              ),
            },
            {
              step: '02',
              nodeIcon: <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />,
              cardIcon: <RotateCcw className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'REWORK EVERY IMPORTANT MISTAKE',
              headlineFocus: 'After a test, first attempt the incorrect question again without seeing the solution. Then identify whether the issue was:',
              tags: [
                { label: '• Concept', className: 'rounded-md border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
                { label: '• Application', className: 'rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
                { label: '• Accuracy', className: 'rounded-md border border-purple-300 bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
                { label: '• Interpretation', className: 'rounded-md border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
              ],
            },
            {
              step: '03',
              nodeIcon: <Target className="size-4 text-rose-600 dark:text-rose-400" />,
              cardIcon: <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'PRACTISE CONSISTENTLY',
              headlineFocus: 'A manageable amount of focused practice every day is more valuable than occasional long study sessions.',
              actionBox: (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Consistency Principle: 5–8 high-quality problems daily builds compounding confidence
                </span>
              ),
            },
            {
              step: '04',
              nodeIcon: <Timer className="size-4 text-sky-600 dark:text-sky-400" />,
              cardIcon: <Timer className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'TEST YOURSELF EVERY 1–2 WEEKS',
              headlineFocus: 'Use mixed, timed questions to check whether your improvement is carrying across chapters.',
              actionBox: (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Pacing Cadence: 30–45 min bi-weekly mixed chapter assessments
                </span>
              ),
            },
            {
              step: '05',
              nodeIcon: <Award className="size-4 text-amber-600 dark:text-amber-400" />,
              cardIcon: <FileText className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'SHIFT TOWARDS BOARD-STYLE PRACTICE',
              headlineFocus: 'As the examination approaches, progressively increase your practice of sample papers, case-based questions and mixed-chapter questions.',
              actionBox: (
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-100/80 px-2.5 py-1 text-xs font-bold text-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
                  Board Target: Full sample papers, Assertion-Reason, and Case Study formats
                </span>
              ),
            },
          ];
        } else if (isBasic) {
          badgeLabel = '⚡ Level of Preparation: Basic';
          badgeStyle = 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
          heroTitle = 'TURN YOUR GAPS INTO PROGRESS';
          heroSubtitle = 'A lower starting score is not a setback—it is your clearest roadmap to improvement. By addressing fundamental ideas before memorising formulas, you will see rapid gains in speed, understanding, and exam confidence.';
          steps = [
            {
              step: '01',
              nodeIcon: <Brain className="size-4 text-amber-600 dark:text-amber-400" />,
              cardIcon: <Brain className="size-3.5 text-amber-600 dark:text-amber-400" />,
              title: 'STRENGTHEN THE BASICS',
              headlineFocus: 'Make sure you can explain the idea before memorising the method',
              description: 'Revisit the concepts behind the questions you could not solve.',
              actionBox: (
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  Golden Principle: Understand concepts from first principles before memorising steps
                </span>
              ),
            },
            {
              step: '02',
              nodeIcon: <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />,
              cardIcon: <TrendingUp className="size-3.5 text-blue-600 dark:text-blue-400" />,
              title: 'PRACTISE A FEW QUESTIONS EVERY DAY',
              headlineFocus: 'Follow a simple three-step progression',
              tags: [
                { label: 'Basic', className: 'bg-emerald-600 text-white font-bold' },
                { label: 'Standard', className: 'bg-blue-600 text-white font-bold' },
                { label: 'Application', className: 'bg-purple-600 text-white font-bold' },
              ],
              actionBox: (
                <span className="text-slate-700 dark:text-slate-300">
                  Focus on quality and consistency rather than solving a very large number of questions.
                </span>
              ),
            },
            {
              step: '03',
              nodeIcon: <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />,
              cardIcon: <BookOpen className="size-3.5 text-purple-600 dark:text-purple-400" />,
              title: 'KEEP AN ERROR NOTEBOOK',
              headlineFocus: 'For every important mistake, record 3 key reflections',
              actionBox: (
                <span className="text-slate-700 dark:text-slate-200">
                  1. What did I get wrong? • 2. Why? • 3. What is the correct approach?
                </span>
              ),
            },
            {
              step: '04',
              nodeIcon: <Timer className="size-4 text-sky-600 dark:text-sky-400" />,
              cardIcon: <Timer className="size-3.5 text-sky-600 dark:text-sky-400" />,
              title: 'TEST YOURSELF REGULARLY',
              headlineFocus: 'Take a short mixed test every 1–2 weeks and track recurring mistakes',
              actionBox: (
                <span className="text-slate-700 dark:text-slate-300">
                  Frequency: 15–20 question short mixed test every 7–14 days
                </span>
              ),
            },
            {
              step: '05',
              nodeIcon: <Award className="size-4 text-amber-600 dark:text-amber-400" />,
              cardIcon: <Award className="size-3.5 text-amber-600 dark:text-amber-400" />,
              title: 'MASTER YOUR PRESCRIBED TEXTBOOK',
              headlineFocus: 'Become confident with examples and exercises before moving to advanced material',
              actionBox: (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Priority Rule: 100% textbook example &amp; exercise mastery first
                </span>
              ),
            },
          ];
        } else {
          // Foundational (BRI < 20)
          badgeLabel = '🌱 Level of Preparation: Foundational';
          badgeStyle = 'bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40';
          heroTitle = 'START FRESH: BUILD YOUR BOARD CONFIDENCE';
          heroSubtitle = 'A diagnostic test is simply a starting compass, not a limit on what you can achieve. With calm, step-by-step guidance starting from textbook basics, you will see your marks and confidence grow steadily.';
          steps = [
            {
              step: '01',
              nodeIcon: <Compass className="size-4 text-violet-600 dark:text-violet-400" />,
              cardIcon: <Compass className="size-3.5 text-violet-600 dark:text-violet-400" />,
              title: 'REFRAME YOUR STARTING BASELINE',
              headlineFocus: 'A diagnostic test identifies where to begin, not what you can achieve',
              actionBox: (
                <span className="font-bold text-violet-800 dark:text-violet-300">
                  🌱 Mindset Anchor: Every top score starts from zero • Progress begins today
                </span>
              ),
            },
            {
              step: '02',
              nodeIcon: <Target className="size-4 text-emerald-600 dark:text-emerald-400" />,
              cardIcon: <Target className="size-3.5 text-emerald-600 dark:text-emerald-400" />,
              title: 'TARGET QUICK-WIN CHAPTERS FIRST',
              headlineFocus: 'Focus initial effort on high-weightage, predictable chapters',
              actionBox: (
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  🎯 Quick-Win Target: 2–3 core chapters secure your first 20–25 marks
                </span>
              ),
            },
            {
              step: '03',
              nodeIcon: <BookOpen className="size-4 text-amber-600 dark:text-amber-400" />,
              cardIcon: <BookOpen className="size-3.5 text-amber-600 dark:text-amber-400" />,
              title: 'MASTER NCERT SOLVED EXAMPLES BY HAND',
              headlineFocus: 'Practice textbook solved examples line-by-line',
              actionBox: (
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  ✍️ CBSE Step-Marking: Formula + Given data earns marks on every question
                </span>
              ),
            },
            {
              step: '04',
              nodeIcon: <Clock className="size-4 text-sky-600 dark:text-sky-400" />,
              cardIcon: <Clock className="size-3.5 text-sky-600 dark:text-sky-400" />,
              title: 'KEEP PRACTICE CALM AND CONSISTENT',
              headlineFocus: 'Solving 3 to 5 simple textbook problems daily builds steady momentum',
              actionBox: (
                <span className="text-slate-700 dark:text-slate-300">
                  ⏱️ Consistency Rule: 3–5 solved questions a day creates compounding confidence
                </span>
              ),
            },
            {
              step: '05',
              nodeIcon: <Brain className="size-4 text-teal-600 dark:text-teal-400" />,
              cardIcon: <Brain className="size-3.5 text-teal-600 dark:text-teal-400" />,
              title: 'SEEK GUIDANCE WITHOUT HESITATION',
              headlineFocus: 'Most roadblocks come from minor past gaps that can be resolved quickly',
              actionBox: (
                <span className="font-semibold text-teal-800 dark:text-teal-300">
                  🤝 Mentorship: Clearing basic doubts early leads to rapid score jumps
                </span>
              ),
            },
          ];
        }

        return (
          <section
            id="report-page-4"
            className="report-page-container report-page-4 relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-7 md:p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 block print:block scroll-mt-48 md:scroll-mt-32"
          >
            {/* Top Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span className="inline-flex flex-wrap items-baseline gap-x-1">
                    <span className="whitespace-nowrap">Shri Ram</span>
                    <span className="whitespace-nowrap">Smart Minds Academy</span>
                  </span>
                </span>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5 break-words">
                  PAGE 4: RECOMMENDATIONS
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs whitespace-nowrap">
                  {isTeacherView ? 'PAGE 4 OF 6' : 'PAGE 4 OF 5'}
                </span>
              </div>
            </div>

            {/* Hero Header */}
            <div className="mt-6 mb-7 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`rounded-md px-2.5 py-0.5 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-xs ${badgeStyle}`}>
                  {badgeLabel}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  BRI: <strong className="text-slate-900 dark:text-white">{report.briScore}/100</strong>
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                {heroTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {heroSubtitle}
              </p>
            </div>

            {/* 5 Recommendation Action Steps (Circuit Roadmap Stepper) */}
            <div className="relative space-y-5 sm:space-y-6 pl-1">
              {/* Continuous vertical connecting line passing through node centers */}
              <div className="absolute left-[26px] sm:left-[30px] top-[32px] bottom-[32px] w-0.5 bg-gradient-to-b from-blue-400/60 via-indigo-400/40 to-slate-200 dark:from-blue-500/70 dark:via-indigo-500/50 dark:to-slate-700/60 z-0 pointer-events-none" />

              {steps.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-3 sm:gap-4.5 group z-10">
                  {/* Step Node */}
                  <div className="shrink-0 w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white border border-slate-200 dark:bg-[#0f172a] dark:border-slate-700/80 shadow-md flex flex-col items-center justify-center group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors">
                    <span className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                      {item.step}
                    </span>
                    <div className="mt-0.5">
                      {item.nodeIcon}
                    </div>
                  </div>

                  {/* Card Container */}
                  <div className="flex-1 min-w-0 rounded-2xl bg-slate-50/90 border border-slate-200 dark:bg-[#111c38]/90 dark:border-slate-700/60 p-4 sm:p-5 shadow-2xs group-hover:border-blue-400/70 dark:group-hover:border-blue-500/40 transition-all space-y-2.5">
                    {/* Title Row with small blue badge icon */}
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30">
                        {item.cardIcon}
                      </span>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wide">
                        {item.title}
                      </h4>
                    </div>

                    {/* Guidance sentence */}
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {item.headlineFocus}
                    </p>

                    {/* Extra Description if available */}
                    {item.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300/90 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Tags if available */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {item.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className={`rounded-full px-3 py-0.5 text-xs ${tag.className}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Box if available */}
                    {item.actionBox && (
                      <div className="rounded-xl bg-white border border-slate-200/90 dark:bg-[#0a1024] dark:border-slate-800/80 p-2.5 sm:p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs">
                        {item.actionBox}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Parent Support Hub */}
            <div className="mt-10 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-slate-50 to-blue-50/60 dark:border-indigo-500/30 dark:bg-gradient-to-br dark:from-[#090f24] dark:via-[#0e173a] dark:to-[#090f24] p-5 sm:p-7 text-slate-900 dark:text-white shadow-md dark:shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100 border border-indigo-200 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-indigo-800 dark:bg-indigo-500/20 dark:border-indigo-400/30 dark:text-indigo-300 mb-2">
                    <Info className="size-3 sm:size-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>A Note For Parents</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    PARENT SUPPORT HUB
                  </h3>
                </div>
                {/* Visual Parent-Child Illustration */}
                <div className="shrink-0 flex items-center justify-end">
                  <svg
                    viewBox="0 0 160 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-24 sm:w-36 h-auto drop-shadow-sm"
                    aria-hidden="true"
                  >
                    <circle cx="80" cy="60" r="54" fill="#3B82F6" fillOpacity="0.18" />
                    <circle cx="28" cy="38" r="2" fill="#60A5FA" />
                    <circle cx="140" cy="75" r="2.5" fill="#A78BFA" />
                    <rect x="15" y="105" width="130" height="6" rx="3" fill="#475569" />
                    <path
                      d="M55 102C65 98 75 98 80 101C85 98 95 98 105 102V105C95 101 85 101 80 104C75 101 65 101 55 105V102Z"
                      fill="#93C5FD"
                    />
                    <path d="M80 101V105" stroke="#1E3A8A" strokeWidth="1.5" strokeLinecap="round" />
                    <path
                      d="M102 72C102 66 110 62 118 62C126 62 134 66 134 72L138 105H98L102 72Z"
                      fill="#F87171"
                    />
                    <rect x="114" y="52" width="8" height="12" rx="4" fill="#FCD34D" />
                    <circle cx="118" cy="44" r="13" fill="#FDE68A" />
                    <path
                      d="M105 44C105 32 115 28 126 31C134 34 135 44 135 50C135 55 130 52 127 49C122 44 112 45 108 52C106 50 105 47 105 44Z"
                      fill="#334155"
                    />
                    <path
                      d="M130 42C133 46 134 56 130 64C128 60 128 54 129 48Z"
                      fill="#334155"
                    />
                    <circle cx="113" cy="43" r="1.5" fill="#475569" />
                    <path
                      d="M110 48C112 50 115 50 117 48"
                      stroke="#475569"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M106 72C100 78 92 88 88 100"
                      stroke="#F87171"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    <circle cx="88" cy="100" r="3.5" fill="#FCD34D" />
                    <path
                      d="M50 78C50 73 57 70 64 70C71 70 78 73 78 78L82 105H46L50 78Z"
                      fill="#3B82F6"
                    />
                    <rect x="60" y="62" width="7" height="9" rx="3" fill="#FCD34D" />
                    <circle cx="63.5" cy="54" r="11" fill="#FDE68A" />
                    <path
                      d="M52 53C52 42 61 39 71 42C76 44 76 50 75 54C72 49 66 48 60 50C56 51 53 52 52 53Z"
                      fill="#334155"
                    />
                    <circle cx="66" cy="55" r="1.3" fill="#475569" />
                    <path
                      d="M65 59C67 60 69 60 70 59"
                      stroke="#475569"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                    <path
                      d="M54 78C58 84 66 94 72 98"
                      stroke="#3B82F6"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <circle cx="73" cy="98" r="3" fill="#FCD34D" />
                    <path d="M72 98L77 94" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Quick Checklist & Avoid / Reduce in Elevated Card */}
              <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs dark:bg-[#060c1e] dark:border-indigo-500/20 p-4 sm:p-5 relative overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10">
                  {/* Quick Checklist */}
                  <div className="space-y-3 rounded-xl bg-emerald-50/30 p-3.5 sm:p-4 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 shadow-2xs shrink-0">
                        <Check className="size-4 stroke-[3]" />
                      </span>
                      <span>Quick Checklist to support your child</span>
                    </h4>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-snug">Identify where they stand today, don&apos;t label their ability.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-snug">Encourage regular practice &amp; maintain consistency.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-snug">Focus on the gaps highlighted in this report.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Avoid / Reduce */}
                  <div className="space-y-3 rounded-xl bg-rose-50/30 p-3.5 sm:p-4 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-rose-600 text-white dark:bg-rose-500 shadow-2xs shrink-0">
                        <X className="size-4 stroke-[3]" />
                      </span>
                      <span>Avoid / Reduce</span>
                    </h4>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0 mt-0.5">✕</span>
                        <span className="leading-snug">Avoid unnecessary pressure or comparing with others.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0 mt-0.5">✕</span>
                        <span className="leading-snug">Don&apos;t rush; let your child develop at their own pace.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Reassurance Note for Foundational/Low baseline */}
              {isVeryLowPrep && (
                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/40 dark:bg-violet-950/40 dark:text-violet-200 p-3.5 text-xs sm:text-sm leading-relaxed">
                  <strong className="text-violet-800 dark:text-violet-300">A reassuring note for parents: </strong>
                  An initial diagnostic score under timer pressure is completely normal and not a measure of your child&apos;s capability. With patient encouragement, regular daily practice, and small wins, students from this baseline routinely make fast, significant gains in marks.
                </div>
              )}

              <div className="mt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200/80 dark:border-slate-800/80 pt-4 space-y-3">

                <div className="p-3 sm:p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/70 dark:border-indigo-500/30 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200">
                  <p className="font-semibold leading-relaxed">
                    We hope Shri Ram Smart Minds Academy could provide you and your child a good plan of action for Class X Board Exams. Wish you all the best! You may contact us if you need any further guidance for your child. Thanks!
                  </p>
                </div>
              </div>
            </div>

            {/* Official Academic Seal & Certification Footer */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-xs border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
                  ✓
                </span>
                <div>
                  Personalized Growth Blueprint for <strong className="text-slate-900 dark:text-white">{report.studentName}</strong> • {studentDetails?.isFormFilled ? `${studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} ${studentDetails.board || 'CBSE'}` : 'Class X Board Readiness Challenge'}
                </div>
              </div>
              <div className="text-center sm:text-right font-semibold text-slate-600 dark:text-slate-400">
                Shri Ram Smart Minds Academy • Academic Evaluation Office
              </div>
            </div>
          </section>
        );
      })()}

      {/* =========================================================================
          PAGE 5: SUPPORT & BOARD MASTERY COURSE (DESKTOP & MOBILE OPTIMIZED)
          ========================================================================= */}
      <section
        id="report-page-5"
        className="report-page-container report-page-5 relative overflow-hidden rounded-3xl border border-slate-700/60 bg-[#0B132B] text-slate-100 p-4 sm:p-7 md:p-8 shadow-xl transition block print:block scroll-mt-48 md:scroll-mt-32"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs sm:text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <GraduationCap className="size-4 text-blue-400 shrink-0" />
              <span className="inline-flex flex-wrap items-baseline gap-x-1">
                <span className="whitespace-nowrap">Shri Ram</span>
                <span className="whitespace-nowrap">Smart Minds Academy</span>
              </span>
            </span>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white mt-1.5 break-words">
              Page 5: NEED STRUCTURED SUPPORT?
            </h2>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-black text-slate-200 shadow-2xs whitespace-nowrap">
              {isTeacherView ? 'PAGE 5 OF 6' : 'PAGE 5 OF 5'}
            </span>
          </div>
        </div>

        {/* Course Recommendation Notice */}
        <div className="mt-3.5 text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
          We recommend joining our Board Mastery Course to excel in the upcoming Board Exams. Online, Offline and Combined Batches begin from 26th October onwards.
        </div>

        {/* 1. Diagnostic Review Hero CTA Banner */}
        <div className="mt-4 rounded-2xl sm:rounded-3xl border border-amber-400/40 bg-[#0d1629] p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Faculty Amal Avatar */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative size-16 sm:size-20 rounded-full overflow-hidden border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-lg bg-amber-50">
                <img
                  src="/board-challenge/faculty_amal.webp"
                  alt="Mr. Amal M Das"
                  className="size-full object-cover object-center"
                />
              </div>
              <div className="mt-1.5 flex flex-col items-center text-center space-y-0.5">
                <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                  B.Tech, IIT KGP
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                  M.A Psychology
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-teal-400 leading-tight">
                  Academic Director
                </span>
              </div>
            </div>

            {/* Description & Buttons */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Book a Free One to One Academic Consultation with Mr. Amal M Das
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Want to Understand your report better? Want to know how Board Mastery Course can help your child excel?
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={() => handleWhatsAppAction('whatsapp_consultation')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 text-xs sm:text-sm shadow-md transition active:scale-[0.98]"
                >
                  <Calendar className="size-4" />
                  <span>Book Free 1-on-1 Consultation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBrochureModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 text-xs sm:text-sm shadow-md transition active:scale-[0.98]"
                >
                  <FileText className="size-4" />
                  <span>View Full Brochure</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. The Class X Gap vs. SRSMA Board Mastery Course Solution */}
        <div className="mt-8 space-y-4">
          <h3 className="text-base sm:text-xl font-black uppercase tracking-wide text-white">
            2. The Class X Gap vs. SRSMA Board Mastery Course Solution
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* The Class X Gap Column (Red/Rose Tint) */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <span>THE CLASS X GAP</span>
                  <span className="text-base">❌</span>
                </h4>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl bg-[#131b31]/90 border border-rose-500/20 p-3 flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs mt-0.5">
                    ✕
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium">
                    School teaches the chapter, but unfamiliar questions feel difficult
                  </p>
                </div>

                <div className="rounded-xl bg-[#131b31]/90 border border-rose-500/20 p-3 flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs mt-0.5">
                    ✕
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium">
                    Knows formulas, but struggles with multi-step board application.
                  </p>
                </div>
              </div>

              {/* Student Quotes */}
              <div className="space-y-1.5 text-xs text-slate-300 italic pt-1">
                <p className="rounded-lg bg-[#0e162d] p-2 border border-slate-800">
                  “I know the formula… but don&apos;t know when to use it.”
                </p>
                <p className="rounded-lg bg-[#0e162d] p-2 border border-slate-800">
                  “I understood the chapter… but can&apos;t solve a new question.”
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-2 text-center text-xs font-black text-rose-400 border border-rose-500/30">
                SRSMA BOARD MASTERY COURSE CLOSES THIS GAP!
              </div>
            </div>

            {/* SRSMA Course Solution Column (Green/Emerald Tint) */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>SRSMA COURSE SOLUTION</span>
                  <span className="text-base">✅</span>
                </h4>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl bg-[#131b31]/90 border border-emerald-500/20 p-3 flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium">
                    Concept-first fundamentals that bridge critical gaps
                  </p>
                </div>

                <div className="rounded-xl bg-[#131b31]/90 border border-emerald-500/20 p-3 flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium">
                    Extensive practice with board-level, application-based questions (PYQs)
                  </p>
                </div>
              </div>

              {/* The Four Pillars summary */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="rounded-lg bg-[#0e162d] p-2 border border-slate-800">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <Brain className="size-3 text-emerald-400" /> Concept Clarity
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Fundamentals rebuilt</div>
                </div>
                <div className="rounded-lg bg-[#0e162d] p-2 border border-slate-800">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <BookOpen className="size-3 text-emerald-400" /> Deep Practice
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Basic → PYQs</div>
                </div>
                <div className="rounded-lg bg-[#0e162d] p-2 border border-slate-800">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <Target className="size-3 text-emerald-400" /> Feedback
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Pinpoint lost marks</div>
                </div>
                <div className="rounded-lg bg-[#0e162d] p-2 border border-slate-800">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <Zap className="size-3 text-emerald-400" /> Exam Skills
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Speed &amp; presentation</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-2 text-center text-xs font-black text-emerald-400 border border-emerald-500/30">
                FROM KNOWING THE CHAPTER TO SOLVING UNFAMILIAR PROBLEMS!
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DIVIDER LINE WITH GENEROUS GAP (USER EXPLICIT REQUIREMENT)
            ========================================================================= */}
        <div className="my-10 sm:my-14">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-700/80" />
            </div>
          </div>
        </div>

        {/* 3. The 100-Hour Board Mastery Course Roadmap */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h3 className="text-base sm:text-xl font-black uppercase tracking-wide text-white">
              3. The 100-Hour Board Mastery Course Roadmap
            </h3>
            <p className="text-xs sm:text-sm font-bold text-amber-400">
              100 Hours. 12 Weeks. One Clear Goal.
            </p>
          </div>

          {/* 3 Phases: UNDERSTAND, MASTER, PERFORM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Phase 1: Understand */}
            <div className="rounded-2xl border border-blue-500/30 bg-[#0e172e] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs">
                  UNDERSTAND
                </span>
                <span className="text-[10px] font-extrabold uppercase text-blue-300 tracking-wider">
                  Phase 1
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-100">
                Strengthen weak fundamentals in Maths &amp; Science.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono font-bold">01</span>
                  <span>Close gaps from first principles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono font-bold">02</span>
                  <span>Learn the why, not just the formula</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono font-bold">03</span>
                  <span>Connect concepts across chapters</span>
                </li>
              </ul>
            </div>

            {/* Phase 2: Master */}
            <div className="rounded-2xl border border-amber-500/30 bg-[#0e172e] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-slate-950 shadow-xs">
                  MASTER
                </span>
                <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider">
                  Phase 2
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-100">
                Practice competency-based &amp; higher-order Board pattern questions.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">01</span>
                  <span>Basic &amp; Concept-First problems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">02</span>
                  <span>Application &amp; Scenario questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">03</span>
                  <span>Competency &amp; Board PYQ Mastery</span>
                </li>
              </ul>
            </div>

            {/* Phase 3: Perform */}
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0e172e] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs">
                  PERFORM
                </span>
                <span className="text-[10px] font-extrabold uppercase text-emerald-300 tracking-wider">
                  Phase 3
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-100">
                6 Full-Length Mock Tests with detailed analysis.
              </p>
              <div className="rounded-lg bg-emerald-600/10 border border-emerald-500/20 p-2 text-xs">
                <div className="font-bold text-emerald-300">3 Maths + 3 Science Mock Tests</div>
                <div className="text-[11px] text-slate-300 mt-0.5">Attempt → Analyse → Correct → Improve</div>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                • Speed • Accuracy • Time Management • Strategy
              </p>
            </div>
          </div>



          {/* Star Faculty Guiding Your Child */}
          <div className="pt-6 space-y-4">
            <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-white text-center sm:text-left">
              Star Faculty Guiding Your Child in the Board Mastery Course
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
              {/* Amal M Das */}
              <div className="flex flex-col items-center justify-end rounded-2xl bg-[#0e172e] border border-slate-800 p-3">
                <div className="relative size-14 sm:size-16 rounded-full overflow-hidden border-2 border-amber-400 ring-2 ring-amber-400/40 mb-2 shadow-xs bg-amber-50">
                  <img
                    src="/board-challenge/faculty_amal.webp"
                    alt="Mr. Amal M Das"
                    className="size-full object-cover object-center"
                  />
                </div>
                <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-xs">
                  MR. AMAL M DAS
                </span>
                <div className="mt-1 flex flex-col space-y-0.5">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                    B.Tech, IIT KGP
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                    M.A Psychology
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-teal-400 leading-tight">
                    Academic Director
                  </span>

                </div>
              </div>

              {/* Brajesh */}
              <div className="flex flex-col items-center justify-end rounded-2xl bg-[#0e172e] border border-slate-800 p-3">
                <div className="relative size-14 sm:size-16 rounded-full overflow-hidden border-2 border-amber-400 ring-2 ring-amber-400/40 mb-2 shadow-xs bg-amber-50">
                  <img
                    src="/board-challenge/faculty_brajesh.webp"
                    alt="Mr. Brajesh"
                    className="size-full object-cover object-center"
                  />
                </div>
                <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-xs">
                  MR. BRAJESH
                </span>
                <div className="mt-1 flex flex-col space-y-0.5">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                    B.Tech, IIT Madras
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-teal-400 leading-tight">
                    Physics HOD
                  </span>
                </div>
              </div>

              {/* Ninad */}
              <div className="flex flex-col items-center justify-end rounded-2xl bg-[#0e172e] border border-slate-800 p-3">
                <div className="relative size-14 sm:size-16 rounded-full overflow-hidden border-2 border-amber-400 ring-2 ring-amber-400/40 mb-2 shadow-xs bg-amber-50">
                  <img
                    src="/board-challenge/faculty_ninad.webp"
                    alt="Mr. Ninad"
                    className="size-full object-cover object-center"
                  />
                </div>
                <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-xs">
                  MR. NINAD
                </span>
                <div className="mt-1 flex flex-col space-y-0.5">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                    B.Tech, IIT Madras
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-teal-400 leading-tight">
                    Chemistry HOD
                  </span>
                </div>
              </div>

              {/* Thirumala */}
              <div className="flex flex-col items-center justify-end rounded-2xl bg-[#0e172e] border border-slate-800 p-3">
                <div className="relative size-14 sm:size-16 rounded-full overflow-hidden border-2 border-amber-400 ring-2 ring-amber-400/40 mb-2 shadow-xs bg-amber-50">
                  <img
                    src="/board-challenge/faculty_thirumala.webp"
                    alt="Mr. Thirumala"
                    className="size-full object-cover object-center"
                  />
                </div>
                <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-xs">
                  MR. THIRUMALA
                </span>
                <div className="mt-1 flex flex-col space-y-0.5">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                    M.Tech, NIT Warangal
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-teal-400 leading-tight">
                    Maths Faculty
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enroll Now CTA Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => handleWhatsAppAction('whatsapp_enroll_now')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-4 text-xs sm:text-sm shadow-lg transition-all active:scale-[0.99]"
            >
              <MessageCircle className="size-4" />
              <span>Enroll Now via WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Academic Seal Footer */}
        <div className="mt-8 border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-5 sm:size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-black text-xs border border-blue-500/30">
              ✓
            </span>
            <div>
              Academic Mentorship Pathway for <strong className="text-white">{report.studentName}</strong> • {studentDetails?.isFormFilled ? `${studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} ${studentDetails.board || 'CBSE'}` : 'Class X Board Readiness Challenge'}
            </div>
          </div>
          <div className="text-center sm:text-right font-semibold text-slate-400">
            Shri Ram Smart Minds Academy • Academic Mentorship Cell
          </div>
        </div>

        {/* Action Button after Page 5: Go to Solutions Tab */}
        {onGoToSolutions && (
          <div className="no-print mt-8 rounded-2xl border border-blue-500/30 bg-[#0d1629] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Diagnostic Report Review Complete</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Ready to review question derivations and faculty solutions?
              </h3>
              <p className="text-xs text-slate-300">
                Jump directly to the Solutions tab to view question-by-question analysis, answer keys, and timing audit.
              </p>
            </div>
            <Button
              type="button"
              onClick={onGoToSolutions}
              className="shrink-0 w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-2.5 shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Go to Solutions Tab</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </section>

      {/* =========================================================================
          PAGE 6: DIAGNOSTIC AUDIT & STEP-BY-STEP CALCULATIONS (DEVELOPMENT ONLY)
          ========================================================================= */}
      {isTeacherView && report.calculationSteps && (
        <section
          id="report-page-6"
          className="report-page-container report-page-6 relative overflow-hidden rounded-3xl border border-amber-300 bg-white p-4 sm:p-8 shadow-sm transition dark:border-amber-700/60 dark:bg-slate-900 block print:block scroll-mt-48 md:scroll-mt-32"
        >
          {/* Header watermark & Brand bar */}
          <div className="flex items-center justify-between border-b border-amber-200 pb-4 dark:border-amber-900/60 gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Diagnostic Audit Engine
                </span>
                <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Teacher View
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5 break-words">
                PAGE 6 — DIAGNOSTIC AUDIT &amp; STEP-BY-STEP CALCULATIONS
              </h2>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-800 dark:text-amber-300 border border-amber-500/30">
                PAGE 6 OF 6
              </span>
              <p className="mt-1 text-xs text-slate-400 hidden sm:block">Faculty Audit Ledger</p>
            </div>
          </div>

          {/* Dev Mode Explanatory Notice */}
          <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-orange-50/40 p-4 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/20">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
                <Wrench className="size-4" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  Development Audit Trail &amp; Verification
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  This page documents all raw sums, diagnostic weights ($W_i$), step-by-step percentage formulas, and individual question audit traces.
                  Designed to verify computations against specifications; this page can be toggled or removed for final production.
                </p>
              </div>
            </div>
          </div>

          {/* Executive Diagnostic Scorecard — All Master Scores in One Glance */}
          <div className="mt-6 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-5 shadow-xs dark:border-amber-800/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/60 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Master Diagnostic Scorecard &amp; Key Evaluation Metrics
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Summary of all evaluated diagnostic axes
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {/* BRI Score */}
              <div className="rounded-xl border border-brand-200/80 bg-brand-50/50 p-3 dark:border-brand-900/40 dark:bg-brand-950/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  BRI Index
                </span>
                <div className="mt-1 text-xl font-black text-brand-700 dark:text-brand-300 tnum">
                  {report.briScore}%
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {report.levelOfPreparation}
                </p>
              </div>

              {/* Raw Marks */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Raw Score
                </span>
                <div className="mt-1 text-xl font-black text-slate-900 dark:text-white tnum">
                  {report.totalRawScore} / {report.totalQuestions}
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {Math.round((report.totalRawScore / report.totalQuestions) * 100)}% unweighted
                </p>
              </div>

              {/* Accuracy */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Accuracy
                </span>
                <div className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400 tnum">
                  {report.skills.accuracy.scorePercent}%
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {report.skills.accuracy.correctCount} of {report.skills.accuracy.attemptedCount} att.
                </p>
              </div>

              {/* TMS */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  TMS Pacing
                </span>
                <div className="mt-1 text-xl font-black text-indigo-600 dark:text-indigo-400 tnum">
                  {report.timeManagement.finalScorePercent}%
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {report.timeManagement.rating}
                </p>
              </div>

              {/* Maths & Science */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Subject Scores
                </span>
                <div className="mt-1 flex items-baseline gap-1.5 font-mono text-sm font-black text-slate-900 dark:text-white">
                  <span>M: {report.breakdown.mathematics.percentage}%</span>
                  <span>•</span>
                  <span>S: {report.breakdown.science.percentage}%</span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  Maths vs Science
                </p>
              </div>

              {/* Strengths / Gaps Count */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Identified Gaps
                </span>
                <div className="mt-1 flex items-baseline gap-2 font-mono text-sm font-black">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {report.strengths.length} Str.
                  </span>
                  <span>•</span>
                  <span className={report.priorityGaps.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {report.priorityGaps.length} Weak.
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {report.priorityGaps.length === 0 ? 'Excellence achieved' : 'Action items'}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Scoring & BRI Derivation */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-black">
                <Calculator className="size-4" />
              </div>
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                1. Scoring &amp; Board Readiness Index (BRI) Derivation
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Questions (N)</span>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tnum">
                  {report.calculationSteps.scoring.totalQuestionsN}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Total items evaluated</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Raw Score Sum (Σ S_i)</span>
                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tnum">
                  {report.calculationSteps.scoring.rawScoreSum} / {report.calculationSteps.scoring.totalQuestionsN}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">1 mark per correct answer</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Diagnostic Weight (Σ W_i)</span>
                <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 tnum">
                  {report.calculationSteps.scoring.diagnosticWeightSum}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Sum of all question weights</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Earned Weighted Score</span>
                <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 tnum">
                  {report.calculationSteps.scoring.weightedScoreSum}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Σ (S_i × W_i)</p>
              </div>
            </div>

            {/* BRI Calculation Box */}
            <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5 dark:border-brand-900/40 dark:bg-brand-950/20">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-brand-300">
                    BRI Formula &amp; Step-by-Step Fraction:
                  </div>
                  <div className="font-mono text-xs bg-white/80 p-3 rounded-lg border border-brand-200/60 dark:bg-slate-900/80 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    BRI = ( Σ(S_i × W_i) / Σ(W_i) ) × 100%
                    <br />
                    BRI = {report.calculationSteps.scoring.briFraction}
                    <br />
                    <strong className="text-brand-700 dark:text-brand-400">
                      BRI = {report.calculationSteps.scoring.briResult}%
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-brand-300">
                    Preparation Level Classification Rule:
                  </div>
                  <div className="font-mono text-xs bg-white/80 p-3 rounded-lg border border-brand-200/60 dark:bg-slate-900/80 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    {report.calculationSteps.scoring.levelRule}
                    <div className="mt-2 flex items-center gap-2 font-sans font-bold">
                      <span>Evaluated Result:</span>
                      {getPrepLevelBadge(report.calculationSteps.scoring.levelResult).label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Area, Science Discipline & Difficulty Breakdown Derivations */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-black">
                <Layers className="size-4" />
              </div>
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                2. Area, Science Discipline &amp; Difficulty Breakdown Derivations
              </h3>
            </div>

            {/* 2.1 Core Areas & Difficulty */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Dimension</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Filter Condition</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Matching Qs</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Score / Total</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Formula &amp; Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.calculationSteps.breakdowns.map((b) => (
                    <TableRow key={b.area}>
                      <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                        {b.area}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {b.filterCondition}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {b.matchingQuestions.map((q) => (
                            <span key={q} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Q{q}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tnum text-xs text-slate-800 dark:text-slate-200">
                        {b.score} / {b.total}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-brand-700 dark:text-brand-400">
                        {b.formula}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 2.2 Science Sub-Disciplines Breakdown */}
            {report.calculationSteps.scienceDisciplineBreakdowns && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Science Sub-Disciplines Breakdown (Physics, Chemistry, Biology)
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400">Itemized Science scores</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Discipline</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Matching Qs</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Score / Total</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Formula</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.calculationSteps.scienceDisciplineBreakdowns.map((sd) => (
                        <TableRow key={sd.discipline}>
                          <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                            {sd.discipline}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {sd.matchingQuestions.map((q) => (
                                <span key={q} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  Q{q}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold tnum text-xs text-slate-800 dark:text-slate-200">
                            {sd.score} / {sd.total}
                          </TableCell>
                          <TableCell className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {sd.formula}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-brand-700 dark:text-brand-400">
                            {sd.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* 2.3 Subject × Difficulty Cross-Tabulation */}
            {report.calculationSteps.subjectDifficultyMatrix && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Subject × Difficulty Cross-Tabulation
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400">Easy vs Medium vs Difficult across Mathematics and Science</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Subject</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Difficulty Tier</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Score / Total</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Formula</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Accuracy %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.calculationSteps.subjectDifficultyMatrix.map((m) => (
                        <TableRow key={`${m.subject}-${m.difficulty}`}>
                          <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                            {m.subject}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${m.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : m.difficulty === 'Medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}>
                              {m.difficulty}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold tnum text-xs text-slate-800 dark:text-slate-200">
                            {m.score} / {m.total}
                          </TableCell>
                          <TableCell className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {m.formula}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-brand-700 dark:text-brand-400">
                            {m.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* 3. Primary Cognitive Skills & Accuracy Derivations */}
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
              3. Primary Cognitive Skills &amp; Accuracy Derivations
            </h3>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Skill Dimension</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Filter Logic</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Matching Qs</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Earned W / Total W</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Formula &amp; %</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Category Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.calculationSteps.skills.map((s) => (
                    <TableRow key={s.skillName}>
                      <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                        {s.skillName}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {s.filterCondition}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.matchingQuestions.map((q) => (
                            <span key={q} className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Q{q}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tnum text-xs text-slate-800 dark:text-slate-200">
                        {s.earnedWeights} / {s.totalWeights}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-brand-700 dark:text-brand-400">
                        {s.formula}
                      </TableCell>
                      <TableCell className="text-center">
                        {getSkillCategoryBadge(s.categoryResult)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 4. Question Structure Derivations */}
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
              4. Question Structure Performance Derivations
            </h3>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Structure Type</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Matching Qs</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Correct / Total</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Formula &amp; %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.calculationSteps.structures.map((st) => (
                    <TableRow key={st.structureType}>
                      <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                        {st.structureType}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {st.matchingQuestions.length > 0 ? (
                            st.matchingQuestions.map((q) => (
                              <span key={q} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Q{q}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">None tested</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tnum text-xs text-slate-800 dark:text-slate-200">
                        {st.correctCount} / {st.totalCount}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-brand-700 dark:text-brand-400">
                        {st.formula}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 5. Strengths Derivation & Ranking Audit */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-black">
                <Sparkles className="size-4" />
              </div>
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                5. Strengths Derivation &amp; Ranking Audit
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider">Rank</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Strength Area</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Classification Tier</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Score %</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Evaluated Evidence &amp; Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.calculationSteps.strengthsRanking.map((s) => {
                    const isCore = s.percentage >= 70;
                    return (
                      <TableRow key={s.rank}>
                        <TableCell className="text-center font-bold text-xs">
                          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-black mx-auto">
                            #{s.rank}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                          {s.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isCore
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/40'
                            }`}>
                            {s.tag || (isCore ? 'Verified Core Strength' : 'Areas with Most Potential')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {s.percentage}%
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
                          {s.reason}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 6. Weakness Engine Evaluation Matrix & Priority Gaps Audit */}
          <div className="mt-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-rose-600 text-white text-xs font-black">
                  <Target className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                    6. Weakness Engine Evaluation Matrix &amp; Priority Gaps Audit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Faculty audit of all 9 diagnostic weakness labels, thresholds (&lt; 50%), mutual exclusion pairs, and final priority gap assignments.
                  </p>
                </div>
              </div>
            </div>

            {/* 6.1 Priority Gaps Audit (Final Selected Weaknesses) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-rose-500" />
                  6.1 Selected Priority Gaps (Final Weaknesses on Page 3)
                </h4>
                <span className="text-[11px] font-semibold text-slate-400">
                  {report.calculationSteps.priorityGapsRanking.length} Priority Gap{report.calculationSteps.priorityGapsRanking.length === 1 ? '' : 's'} Selected
                </span>
              </div>

              {report.calculationSteps.priorityGapsRanking.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-emerald-900 dark:text-emerald-300 font-bold block">
                      Faculty Audit Confirmation: Zero Weakness Areas Detected (&lt; 50%)
                    </strong>
                    <span className="text-emerald-800/90 dark:text-emerald-400">
                      All evaluated syllabus categories scored 50% or above. The student achieved the academic excellence benchmark across all evaluated dimensions.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {report.calculationSteps.priorityGapsRanking.map((g) => (
                    <div
                      key={g.rank}
                      className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white to-rose-50/40 p-4 shadow-xs dark:border-rose-900/40 dark:from-slate-900 dark:to-rose-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">#{g.rank} Priority Focus</span>
                        {getPriorityBadge(g.priority)}
                      </div>
                      <h5 className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                        {formatWeaknessName(g.name)}
                      </h5>
                      <div className="mt-2 flex items-center justify-between">
                        <EcommerceStarRating rating={Math.round((g.scorePercent / 100) * 5 * 10) / 10} align="start" />
                        <span className="font-mono text-xs font-black text-rose-700 dark:text-rose-400">
                          {g.scorePercent}%
                        </span>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        <strong>Trigger:</strong> {g.ruleApplied}
                      </div>
                      {g.message && (
                        <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                          &ldquo;{g.message}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6.2 Complete 9-Label Weakness Engine Matrix (All Evaluated Values) */}
            {report.calculationSteps.allWeaknessEvaluations && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    6.2 Complete 9-Label Weakness Evaluation Engine Matrix (All Values)
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Full Evaluation Ledger &bull; 9 Engine Labels + Fallback Pacing
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Weakness Dimension</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Category Type</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Evaluated Value</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Diagnostic Formula / Base</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Threshold Rule</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Trigger Status</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Priority Band</TableHead>
                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Selection Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.calculationSteps.allWeaknessEvaluations.map((w) => {
                        const isSelected = w.status === 'Selected Priority Gap';
                        const isSuppressed = w.status.includes('Suppressed');
                        const isMet = w.status === 'Benchmark Met (>= 50%)';

                        return (
                          <TableRow
                            key={w.id}
                            className={
                              isSelected
                                ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                : isSuppressed
                                  ? 'bg-amber-50/30 dark:bg-amber-950/15'
                                  : undefined
                            }
                          >
                            <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                              <div>{formatWeaknessName(w.name)}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                {w.triggerReason}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {w.categoryType}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-xs tnum">
                              <span
                                className={
                                  w.evaluatedScore < 50
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }
                              >
                                {w.evaluatedScore}%
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-400 max-w-xs">
                              {w.formula}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {w.thresholdCondition}
                            </TableCell>
                            <TableCell className="text-center">
                              {w.isTriggered ? (
                                <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  <AlertTriangle className="size-3" /> Deficit Triggered
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  <Check className="size-3" /> Benchmark Met
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {w.priority === 'Benchmark Met (>= 50%)' ? (
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  &ge; 50% Satisfied
                                </span>
                              ) : (
                                getPriorityBadge(w.priority as PriorityLevel)
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {isSelected ? (
                                <span className="inline-block rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-2xs">
                                  Selected #{w.selectedRank}
                                </span>
                              ) : isSuppressed ? (
                                <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  {w.status}
                                </span>
                              ) : isMet ? (
                                <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  No Deficit (&ge; 50%)
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Not Triggered</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* 7. Time Management & Pacing Derivations (TMS) */}
          {report.calculationSteps.timeManagement && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-black">
                  <Clock className="size-4" />
                </div>
                <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                  7. Time Management &amp; Pacing Derivations (TMS)
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scoring Formula</span>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      TMS (%) = (Σ (Qi × Wi) / Σ Wi) * 100
                    </p>
                    <p className="mt-1 text-xs text-brand-600 dark:text-brand-400 font-bold">
                      {report.calculationSteps.timeManagement.formula} = {report.calculationSteps.timeManagement.finalScorePercent}%
                    </p>
                    <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      t_est = Mean of Lowerbound &amp; Upperbound
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Piecewise Qi Rules</span>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      <li>• Correct, r ≤ 1.0: <strong className="text-emerald-600">Efficient Mastery (1.0)</strong></li>
                      <li>• Correct, r &gt; 1.0: <strong className="text-teal-600">Over-Invested (max 0.25, 1/r)</strong></li>
                      <li>• Incorrect, r &lt; 0.70: <strong className="text-amber-600">Careless Rushing</strong></li>
                      <li>• Incorrect, 0.70-1.30: <strong className="text-blue-600">Disciplined Attempt (0.50)</strong></li>
                      <li>• Incorrect, r &gt; 1.30: <strong className="text-rose-600">Time Trap</strong></li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classification &amp; Flags</span>
                    <div className="mt-1 flex items-center gap-2">
                      {getTimeManagementBadge(report.calculationSteps.timeManagement.ratingResult)}
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {report.calculationSteps.timeManagement.finalScorePercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      ≥85% Optimal | 70-84% Good | 50-69% Moderate | &lt;50% Needs Intervention
                    </p>
                    {report.calculationSteps.timeManagement.guessworkQuestions.length > 0 ? (
                      <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                        ⚠️ Guesswork: Q{report.calculationSteps.timeManagement.guessworkQuestions.join(', Q')} (&lt;8s)
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ No guesswork flags (&lt;8s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Detailed Category Count Badges */}
                {report.calculationSteps.timeManagement.categoryCounts && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Behavioral Distribution:
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                      Efficient Mastery: {report.calculationSteps.timeManagement.categoryCounts['EFFICIENT_MASTERY'] || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50">
                      Over-Invested: {report.calculationSteps.timeManagement.categoryCounts['OVER_INVESTED_SUCCESS'] || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                      Disciplined Attempt: {report.calculationSteps.timeManagement.categoryCounts['DISCIPLINED_ATTEMPT'] || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                      Careless Rushing: {report.calculationSteps.timeManagement.categoryCounts['CARELESS_RUSHING'] || 0}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                      Time Trap: {report.calculationSteps.timeManagement.categoryCounts['TIME_TRAP'] || 0}
                    </span>
                    {(report.calculationSteps.timeManagement.categoryCounts['UNATTEMPTED'] || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Unattempted: {report.calculationSteps.timeManagement.categoryCounts['UNATTEMPTED']}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. Chapter Score & Priority Classification Audit */}
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
              8. Chapter Score &amp; Priority Classification Audit
            </h3>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Chapter Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Subject</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Score / Total</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Accuracy %</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Priority Classification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.calculationSteps.allChapterScores.map((c) => (
                    <TableRow key={`${c.subject}-${c.chapter}`}>
                      <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                        {c.chapter}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {c.subject}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {c.correct} / {c.total}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-brand-700 dark:text-brand-400">
                        {c.percentage}%
                      </TableCell>
                      <TableCell className="text-center">
                        {getPriorityBadge(c.priority)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 9. Full Question-by-Question Diagnostic Audit */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                  9. Full Question-by-Question Audit Table ({report.calculationSteps.questionAudit.length} Questions)
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Itemized record of responses, time taken, time limits, weights, and revisit classifications:
                </p>
              </div>

              {/* Filter controls */}
              <div className="no-print flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setAuditFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${auditFilter === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                >
                  All ({report.calculationSteps.questionAudit.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('incorrect')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${auditFilter === 'incorrect'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                >
                  Incorrect ({report.calculationSteps.questionAudit.filter((q) => !q.isCorrect).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('overtime')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${auditFilter === 'overtime'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                >
                  Overtime ({report.calculationSteps.questionAudit.filter((q) => q.timeLimitExceeded).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('revisit')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${auditFilter === 'revisit'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                >
                  Revisit Flags ({report.calculationSteps.questionAudit.filter((q) => Boolean(q.revisitCategory)).length})
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="w-10 text-center text-xs font-bold uppercase tracking-wider">Q#</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Subject &amp; Chapter</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Diff &amp; Skill</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Weight (W_i)</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Time (Actual vs ETS)</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Answer / Key</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Weighted Score</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Revisit Trigger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.calculationSteps.questionAudit
                    .filter((item) => {
                      if (auditFilter === 'incorrect') return !item.isCorrect;
                      if (auditFilter === 'overtime') return item.timeLimitExceeded;
                      if (auditFilter === 'revisit') return Boolean(item.revisitCategory);
                      return true;
                    })
                    .map((item) => (
                      <TableRow key={item.qno} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <TableCell className="text-center font-bold text-slate-900 dark:text-white text-xs">
                          {item.qno}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs dark:text-slate-100">
                            {item.subject}: {item.chapter}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.topic}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {item.difficulty}
                          </span>
                          <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                            {item.primarySkill}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-xs text-indigo-700 dark:text-indigo-400">
                          {item.diagnosticWeight}x
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {item.timeTakenS}s / ETS {item.expectedBenchmarkS ?? item.expectedUpperBoundS}s
                          </div>
                          <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                            {item.timeManagementLabel && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${item.timeManagementCategory === 'EFFICIENT_MASTERY'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : item.timeManagementCategory === 'OVER_INVESTED_SUCCESS'
                                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                                    : item.timeManagementCategory === 'DISCIPLINED_ATTEMPT'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                      : item.timeManagementCategory === 'CARELESS_RUSHING'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  }`}
                              >
                                {item.timeManagementLabel} {item.timeManagementQi !== undefined ? `(Q: ${item.timeManagementQi})` : ''}
                              </span>
                            )}
                            {item.isGuesswork && (
                              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-950 dark:bg-amber-900/60 dark:text-amber-200">
                                ⚡ &lt;8s Guesswork
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">
                              {item.selectedOption ?? '—'}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {item.correctAnswer}
                            </span>
                          </div>
                          <div className="mt-0.5">
                            {!item.attempted ? (
                              <span className="text-[10px] text-slate-400">Skipped</span>
                            ) : item.isCorrect ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check className="size-3" /> Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="size-3" /> Incorrect
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">
                          <span className={item.weightedScore > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                            {item.weightedScore.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.revisitCategory ? (
                            <div>
                              {getRevisitBadge(item.revisitCategory)}
                              {item.revisitIssue && (
                                <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 max-w-xs">
                                  {item.revisitIssue}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer certification note */}
          <div className="mt-8 border-t border-amber-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 dark:border-amber-900/60">
            <div>
              Generated for <strong className="text-slate-700 dark:text-slate-300">{report.studentName}</strong> • Internal Calculation Audit
            </div>
            <div>
              SRSMA Diagnostic Engine v1.0 • Verification &amp; Development Mode
            </div>
          </div>
        </section>
      )}

      {/* Full Brochure Lightbox Modal */}
      {showBrochureModal && (
        <Dialog
          isOpen={showBrochureModal}
          onClose={() => setShowBrochureModal(false)}
          size="2xl"
          title="SRSMA Class 10 Board Mastery Course Brochure"
          footer={
            <div className="flex w-full items-center justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowBrochureModal(false)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="max-h-[75vh] overflow-y-auto p-1">
            <img
              src="/board-challenge/brochure_full_300dpi.webp"
              alt="SRSMA Board Mastery Course Brochure"
              className="w-full rounded-lg object-contain shadow-md"
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}
