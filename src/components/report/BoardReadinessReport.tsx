'use client';

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Target,
  FileText,
  Printer,
  Copy,
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
} from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type {
  DiagnosticEvaluationResult,
  PreparationLevel,
  SkillValueCategory,
  PriorityLevel,
  RevisitCategory,
  SubjectDifficultyBreakdowns,
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
    },
    medium: {
      dot: 'bg-amber-500',
      fill: 'from-amber-400 to-amber-500 dark:from-amber-400 dark:to-orange-500',
    },
    hard: {
      dot: 'bg-indigo-600 dark:bg-indigo-400',
      fill: 'from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500',
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
        <span className="font-black text-slate-900 dark:text-white tnum text-xs">
          {clampedPct}%
        </span>
      </div>

      {/* Battery Container */}
      <div className="flex items-center">
        <div className="relative flex-1 h-5 rounded-md border-[1.5px] border-slate-300 bg-slate-100 p-0.5 shadow-inner dark:border-slate-700 dark:bg-slate-800/80 overflow-hidden">
          {/* Fill level */}
          <div
            className={`h-full rounded-[3px] bg-gradient-to-r ${config.fill} transition-all duration-500`}
            style={{ width: `${clampedPct}%` }}
          />

          {/* Centered battery percentage text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black tracking-wider text-slate-900 dark:text-slate-100 drop-shadow-xs tnum">
              {clampedPct}%
            </span>
          </div>
        </div>

        {/* Battery Terminal Nub */}
        <div className="h-2.5 w-1 rounded-r-xs bg-slate-300 dark:bg-slate-600 shrink-0 ml-0.5" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Amazon E-commerce Style Star Rating Component
// ---------------------------------------------------------------------------
function EcommerceStarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center justify-end gap-2.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const lower = starIndex - 1;
          const diff = rating - lower;

          if (diff >= 0.75) {
            // >= x.75 -> Full star
            return (
              <Star
                key={starIndex}
                className="size-4 fill-amber-400 text-amber-500"
              />
            );
          } else if (diff >= 0.25) {
            // x.25 to x.74 -> Half star
            return (
              <div key={starIndex} className="relative size-4">
                <Star className="absolute inset-0 size-4 fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-600" />
                <div className="absolute inset-0 w-[50%] overflow-hidden">
                  <Star className="size-4 fill-amber-400 text-amber-500" />
                </div>
              </div>
            );
          } else {
            // < x.25 -> Empty star
            return (
              <Star
                key={starIndex}
                className="size-4 fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-600"
              />
            );
          }
        })}
      </div>
      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 tnum">
        {rating.toFixed(1)} / 5
      </span>
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

  const isHigh = clamped >= 80;
  const isMed = clamped >= 60 && clamped < 80;

  return (
    <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 p-5 shadow-xs dark:border-slate-800 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950/80">
      <div className="w-full flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Board Readiness Index (BRI)
        </span>
        <span className="rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Scale 0–100
        </span>
      </div>

      {/* Speedometer Arc SVG */}
      <div className="relative my-2 flex items-center justify-center">
        <svg viewBox="0 0 180 128" className="w-52 sm:w-56 h-auto">
          <defs>
            <linearGradient id="briGradHigh" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="briGradMed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="briGradLow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
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
            stroke={isHigh ? 'url(#briGradHigh)' : isMed ? 'url(#briGradMed)' : 'url(#briGradLow)'}
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
            className={isHigh ? 'fill-emerald-500' : isMed ? 'fill-blue-500' : 'fill-amber-500'}
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

      {/* 3-Tier Mini Scale Bar */}
      <div className="w-full mt-1 grid grid-cols-3 gap-1 px-2 text-center text-[10px] font-bold">
        <div
          className={`rounded py-0.5 border ${
            !isHigh && !isMed
              ? 'bg-amber-500/15 text-amber-800 border-amber-400 dark:text-amber-300'
              : 'text-slate-400 border-transparent'
          }`}
        >
          Basic &lt;60
        </div>
        <div
          className={`rounded py-0.5 border ${
            isMed
              ? 'bg-blue-500/15 text-blue-800 border-blue-400 dark:text-blue-300'
              : 'text-slate-400 border-transparent'
          }`}
        >
          Strong 60–79
        </div>
        <div
          className={`rounded py-0.5 border ${
            isHigh
              ? 'bg-emerald-500/15 text-emerald-800 border-emerald-400 dark:text-emerald-300'
              : 'text-slate-400 border-transparent'
          }`}
        >
          High 80+
        </div>
      </div>

      {/* Level of Preparation Status Pill */}
      <div className="mt-3 w-full text-center">
        <span className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 block mb-1">
          Level of Preparation
        </span>
        <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1 text-xs sm:text-sm font-black tracking-wide shadow-xs ${prepStyle.bg}`}>
          {isHigh ? '🏆' : isMed ? '🎯' : '⚡'} {prepStyle.label}
        </div>
      </div>
    </div>
  );
}

export function BoardReadinessReport({
  report,
  studentGender,
  studentDetails,
  onRetakeOrBrowse,
  isTeacherView = false,
}: BoardReadinessReportProps) {
  const isMale = (studentGender || report.studentGender) === 'Male';
  const avatarSrc = isMale ? '/board-challenge/Male.png' : '/board-challenge/Female.png';

  const [activeTab, setActiveTab] = useState<'all' | 'page1' | 'page2' | 'page3' | 'page4'>('all');
  const [copied, setCopied] = useState(false);
  const [showRawTextModal, setShowRawTextModal] = useState(false);
  const [revisitFilter, setRevisitFilter] = useState<'all' | RevisitCategory>('all');
  const [auditFilter, setAuditFilter] = useState<'all' | 'incorrect' | 'overtime' | 'revisit'>('all');

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(report.plainTextReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy plaintext report', err);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const getTimeManagementBadge = (rating: 'Good' | 'Medium' | 'Poor' | string) => {
    switch (rating) {
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Good
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Medium
          </span>
        );
      case 'Poor':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Poor
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
      case 'Pacing / Time Management':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="size-3" />
            Pacing / Time Management
          </span>
        );
      case 'Conceptual / Calculation Gap':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="size-3" />
            Conceptual / Calculation Gap
          </span>
        );
      case 'Rapid Guesswork':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
            <Zap className="size-3 text-orange-600" />
            Rapid Guesswork
          </span>
        );
      case 'Unattempted':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <HelpCircle className="size-3 text-slate-500" />
            Unattempted
          </span>
        );
      case 'High Friction Gap':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
            <Zap className="size-3" />
            High Friction Gap
          </span>
        );
    }
  };

  const prepStyle = getPrepLevelBadge(report.levelOfPreparation);

  const filteredTopics = report.topicsToRevisit.filter((t) => {
    if (revisitFilter === 'all') return true;
    return t.category === revisitFilter;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* 1. Header Toolbar (Hidden in Print) */}
      <div className="no-print flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
            <Award className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                Shri Ram Smart Minds Academy
              </span>
              {studentDetails?.isFormFilled ? (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} • {studentDetails.board || 'CBSE'}
                  {isTeacherView && studentDetails.school && (
                    <span className="ml-1.5 text-[11px] text-slate-400">
                      ({studentDetails.school}{studentDetails.city ? `, ${studentDetails.city}` : ''})
                    </span>
                  )}
                </span>
              ) : isTeacherView ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                  ⚠️ Unlock Form: Not Filled by Student
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class X CBSE</span>
              )}
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              BOARD READINESS CHALLENGE REPORT
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab buttons */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              {isTeacherView ? 'All Pages (1–4)' : 'All Pages (1–3)'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('page1')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${activeTab === 'page1'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              Page 1
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('page2')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${activeTab === 'page2'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              Page 2
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('page3')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${activeTab === 'page3'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              Page 3
            </button>
            {isTeacherView && (
              <button
                type="button"
                onClick={() => setActiveTab('page4')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${activeTab === 'page4'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black dark:bg-amber-400'
                  : 'text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200'
                  }`}
              >
                <Calculator className="size-3" />
                Page 4 (Dev Calc Steps)
                <span className="rounded bg-amber-200 px-1 text-[9px] font-black text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                  DEV
                </span>
              </button>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={handleCopyText} title="Copy exact plaintext report">
            {copied ? <Check className="mr-1.5 size-3.5 text-emerald-600" /> : <Copy className="mr-1.5 size-3.5" />}
            {copied ? 'Copied Text' : 'Copy Text'}
          </Button>

          <Button variant="primary" size="sm" onClick={handlePrint} className="bg-brand-600 hover:bg-brand-500">
            <Printer className="mr-1.5 size-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* =========================================================================
          PAGE 1: BOARD READINESS CHALLENGE REPORT
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'page1') && (
        <section className="report-page-container relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          {/* Header watermark & Brand bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  Shri Ram Smart Minds Academy
                </span>
                {studentDetails?.isFormFilled ? (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} • {studentDetails.board || 'CBSE'}
                  </span>
                ) : isTeacherView ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    ⚠️ Unlock Form: Not Filled by Student
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                BOARD READINESS CHALLENGE REPORT
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                PAGE 1 OF 3
              </span>
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
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-50/70 via-indigo-50/40 to-slate-50 p-6 border border-brand-100/80 dark:border-slate-800 dark:from-slate-900 dark:via-brand-950/20 dark:to-slate-900">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-black text-base shadow-sm">
                  🎓
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dear {report.studentName},</h3>
                  <p className="text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
                    Congratulations on taking this first step towards becoming more Board-ready! Taking this diagnostic test shows that you care about your preparation and are willing to find out where you stand and how you can improve. Go through this report carefully—it will help you understand your strengths, identify the areas that need more attention, and know what to do next. If you use these insights well you can put yourself in a strong position to excel in your {studentDetails?.board ? `${studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} ${studentDetails.board}` : 'Class X Board'} examinations. Go ahead and explore further!
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={avatarSrc}
                  alt={isMale ? 'Male Student Mascot' : 'Female Student Mascot'}
                  className="h-32 sm:h-40 w-auto object-contain drop-shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Personal Diagnostic Report Title */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-brand-600" />
            <h3 className="text-base font-black tracking-wider uppercase text-slate-900 dark:text-white">
              Personal Diagnostic Report
            </h3>
          </div>

          {/* Hero Readiness Snapshot */}
          <div className="mt-4 grid gap-5 sm:grid-cols-12">
            {/* BRI Speedometer Gauge Arc Tile */}
            <div className="sm:col-span-6 lg:col-span-5">
              <BriSpeedometerGauge score={report.briScore} prepStyle={prepStyle} />
            </div>

            {/* Score Snapshot Cards & Denominators */}
            <div className="sm:col-span-6 lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Raw Score</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="tnum text-2xl font-black text-slate-900 dark:text-white">
                    {report.totalRawScore}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ {report.totalQuestions} Questions</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${report.totalRawScore <= 8
                      ? 'bg-rose-500'
                      : report.totalRawScore <= 14
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      }`}
                    style={{ width: `${(report.totalRawScore / Math.max(1, report.totalQuestions)) * 100}%` }}
                  />
                </div>
                <span className="mt-1 block text-[10px] text-slate-400">Questions Answered Correctly</span>
              </div>

              {/* Subject Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                      <TableHead className="text-xs font-bold uppercase tracking-wider">Subject</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        Mathematics
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum font-black text-slate-900 dark:text-white">
                          {report.breakdown.mathematics.percentage}%
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-50/40 dark:bg-slate-800/30">
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        Science
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum font-black text-slate-900 dark:text-white">
                          {report.breakdown.science.percentage}%
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-7 text-xs font-medium text-slate-600 dark:text-slate-400">
                        • Physics
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                          {report.breakdown.physics?.percentage ?? 0}%
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-7 text-xs font-medium text-slate-600 dark:text-slate-400">
                        • Chemistry
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                          {report.breakdown.chemistry?.percentage ?? 0}%
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-7 text-xs font-medium text-slate-600 dark:text-slate-400">
                        • Biology
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                          {report.breakdown.biology?.percentage ?? 0}%
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Subject Comparison Insight Box */}
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-3 text-xs leading-relaxed text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Subject Performance Insight</span>
                </div>
                <p className="mt-1 font-medium">
                  {report.breakdown.mathematics.percentage > report.breakdown.science.percentage
                    ? 'You seem to be doing better in Maths compared to Science. Continue reinforcing core Science application concepts while sustaining your Mathematics momentum.'
                    : report.breakdown.science.percentage > report.breakdown.mathematics.percentage
                      ? 'You seem to be doing better in Science compared to Maths. Continue reinforcing multi-step calculation skills in Mathematics while maintaining your strong Science foundation.'
                      : 'Your performance in Maths and Science seems to be well balanced, demonstrating steady preparation across both core subjects.'}
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty Level Performance Bar Graph (Maths & Science) */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="size-4 text-brand-600 dark:text-brand-400" />
                  Difficulty-Wise Performance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mobile battery percentage indicator of questions solved across Easy, Medium, and Hard tiers
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Battery Level (%)
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Mathematics Difficulty Card */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2 dark:border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Mathematics
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Overall: {report.breakdown.mathematics.percentage}%
                  </span>
                </div>
                <div className="space-y-3.5">
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
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Science
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Overall: {report.breakdown.science.percentage}%
                  </span>
                </div>
                <div className="space-y-3.5">
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

            {/* Difficulty Performance Insight Box */}
            <div className="mt-4 rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-3.5 text-xs leading-relaxed text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Difficulty-Wise Performance Insight</span>
              </div>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                {getDifficultyInsight(report.subjectDifficultyBreakdowns)}
              </p>
            </div>
          </div>

          {/* Front Page Guesswork Alert */}
          {report.timeManagement?.guessworkQuestions && report.timeManagement.guessworkQuestions.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-300/90 bg-amber-50/90 p-4 sm:p-5 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/40">
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 font-bold text-slate-950 text-sm shadow-xs mt-0.5">
                  ⚠️
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                    Possibility of Guesswork Detected
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-300 leading-relaxed font-medium">
                    There is possibility of guesswork being done in answering{' '}
                    <strong className="underline decoration-amber-500 underline-offset-2">
                      {report.timeManagement.guessworkQuestions.map((q) => `Q${q}`).join(', ')}
                    </strong>{' '}
                    (responses were submitted in less than 20 seconds).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Insight Analytical Box */}
          <div className="mt-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-brand-50/60 to-purple-50/60 p-6 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-brand-950/30 dark:to-purple-950/30">
            <div className="flex items-start gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black tracking-wider uppercase text-indigo-950 dark:text-indigo-200">
                  Your Key Insight
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium dark:text-slate-200">
                  {report.keyInsight}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PAGE 2: PERFORMANCE ANALYSIS & PATTERNS
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'page2') && (
        <section className="report-page-container relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Shri Ram Smart Minds Academy
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                PAGE 2: PERFORMANCE ANALYSIS &amp; PATTERNS
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                PAGE 2 OF 3
              </span>
            </div>
          </div>

          {/* Top 3 Strengths */}
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
              {report.strengthsTitle || 'YOUR STRENGTHS'}
            </h3>

            {report.strengths.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                No syllabus categories scored above 70% in this test. Focused revision will help build your core strengths!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {report.strengths.map((s) => (
                  <div
                    key={s.rank}
                    className={`flex flex-col justify-between rounded-2xl border p-4 ${s.isEmerging
                      ? 'border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/30 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20'
                      : 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-teal-950/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`flex size-7 items-center justify-center rounded-lg font-black text-xs text-white shadow-xs ${s.isEmerging ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                          #{s.rank}
                        </span>
                        <span className={`tnum text-xs font-black ${s.isEmerging ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                          {s.scoreDetails}
                        </span>
                      </div>
                      <h4 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed dark:text-slate-300">
                        {s.reason}
                      </p>
                    </div>
                    <div className={`mt-3 flex items-center gap-1 text-[11px] font-bold ${s.isEmerging ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {s.isEmerging ? (
                        <>
                          <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{report.strengthsTitle === 'AREAS WITH MOST POTENTIAL' ? 'Area with Most Potential' : 'Emerging Strength'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          <span>Verified Core Strength</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question Structure Performance Table */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                Your Performance Pattern (By Question Type)
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">5 Performance Patterns</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Performance Pattern</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Rating (up to 5 Stars)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const PATTERNS = ['Direct', 'Multi-step', 'Diagram-based', 'Application-based', 'Word Problem'];
                    const patternItems = PATTERNS.map((p) => {
                      const found = report.structures.find((s) => s.type.toLowerCase() === p.toLowerCase());
                      return found ?? { type: p, correct: 0, total: 0, percentage: 0 };
                    });
                    return patternItems.map((st) => {
                      const starRating = Math.round((st.percentage / 100) * 5 * 10) / 10;
                      return (
                        <TableRow key={st.type}>
                          <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                            {st.type}
                          </TableCell>
                          <TableCell className="text-right">
                            <EcommerceStarRating rating={starRating} />
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* What This Tells You Narrative Box */}
          <div className="mt-8 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-brand-50/50 p-6 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-brand-950/20">
            <div className="flex items-start gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-sm font-black text-sm">
                <Brain className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black tracking-wider uppercase text-amber-950 dark:text-amber-200">
                  What This Tells You
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium dark:text-slate-200">
                  {report.performancePatternInsight}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PAGE 3: WHERE SHOULD YOU IMPROVE?
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'page3') && (
        <section className="report-page-container relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Shri Ram Smart Minds Academy
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                PAGE 3 — WHERE SHOULD YOU IMPROVE?
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                PAGE 3 OF 3
              </span>
            </div>
          </div>

          {/* Priority Gaps */}
          {(() => {
            const weaknessGaps = (report.priorityGaps || []).filter((g) => g.scorePercent <= 70).slice(0, 4);
            return (
              <div className="mt-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                    Your Priority Gaps
                  </h3>
                </div>

                {weaknessGaps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/80 p-6 text-center shadow-xs dark:border-emerald-800/60 dark:bg-emerald-950/20">
                    <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                      <Sparkles className="size-6 animate-pulse" />
                    </div>
                    <h4 className="mt-3 text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                      Congratulations! No Weakness Areas Detected
                    </h4>
                    <p className="mt-1 max-w-md text-xs text-emerald-700 dark:text-emerald-400">
                      Outstanding performance! You scored above 70% across all evaluated syllabus categories. Keep up the phenomenal work for your board exams!
                    </p>
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
                    {weaknessGaps.map((g) => (
                      <div
                        key={g.rank}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">#{g.rank} Priority Area</span>
                          {getPriorityBadge(g.priority)}
                        </div>
                        <h4 className="mt-2 text-sm font-black text-slate-900 dark:text-white line-clamp-1">{g.name}</h4>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Accuracy</span>
                          <span className="tnum text-base font-black text-slate-900 dark:text-white">{g.scorePercent}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${g.priority === 'High Priority'
                              ? 'bg-rose-500'
                              : g.priority === 'Medium Priority'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                              }`}
                            style={{ width: `${Math.max(4, g.scorePercent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Topics to Revisit: 2 Distinct Tables (Mathematics & Science) */}
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                Topics to Revisit
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Detailed chapter-wise observations for Mathematics and Science requiring review or reinforcement:
              </p>
            </div>

            {/* TABLE 1: Mathematics */}
            {(() => {
              const mathsTopics = report.topicsToRevisit.filter(
                (t) => t.subject.toLowerCase() === 'maths' || t.subject.toLowerCase() === 'mathematics',
              );
              const hasGuesswork = mathsTopics.some((t) => t.category === 'Rapid Guesswork');
              const hasUnattempted = mathsTopics.some((t) => t.category === 'Unattempted');

              return (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold text-xs dark:bg-blue-950 dark:text-blue-300">
                        📐
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Mathematics — Topics to Revisit ({mathsTopics.length})
                      </h4>
                    </div>
                  </div>

                  {(hasGuesswork || hasUnattempted) && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                      <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        {hasGuesswork && (
                          <p>
                            <strong>Rapid Responses / Guesswork:</strong> Some chapters were answered very quickly. These chapters appear to be guesswork, so we cannot reliably determine conceptual competency.
                          </p>
                        )}
                        {hasUnattempted && (
                          <p>
                            <strong>Unattempted Chapters:</strong> These questions were left unattempted during the exam, so competency could not be assessed and requires independent practice.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                          <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider">Q#</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Chapter &amp; Topic</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Category</TableHead>
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
                            <TableCell>{getRevisitBadge(t.category)}</TableCell>
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
                </div>
              );
            })()}

            {/* TABLE 2: Science */}
            {(() => {
              const scienceTopics = report.topicsToRevisit.filter((t) =>
                ['physics', 'chemistry', 'biology', 'science'].includes(t.subject.toLowerCase()),
              );
              const hasGuesswork = scienceTopics.some((t) => t.category === 'Rapid Guesswork');
              const hasUnattempted = scienceTopics.some((t) => t.category === 'Unattempted');

              return (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                        🧪
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Science — Topics to Revisit ({scienceTopics.length})
                      </h4>
                    </div>
                  </div>

                  {(hasGuesswork || hasUnattempted) && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                      <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        {hasGuesswork && (
                          <p>
                            <strong>Rapid Responses / Guesswork:</strong> Some chapters were answered very quickly. These chapters appear to be guesswork, so we cannot reliably determine conceptual competency.
                          </p>
                        )}
                        {hasUnattempted && (
                          <p>
                            <strong>Unattempted Chapters:</strong> These questions were left unattempted during the exam, so competency could not be assessed and requires independent practice.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                          <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider">Q#</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Branch</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Chapter &amp; Topic</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider">Category</TableHead>
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
                            <TableCell>{getRevisitBadge(t.category)}</TableCell>
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
                </div>
              );
            })()}

            <p className="text-[11px] text-slate-400 italic text-center sm:text-left">
              *Topic observations are based only on the questions tested.*
            </p>
          </div>

          {/* Footer certification note */}
          <div className="mt-8 border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 dark:border-slate-800">
            <div>
              Generated for <strong className="text-slate-700 dark:text-slate-300">{report.studentName}</strong> • {studentDetails?.isFormFilled ? `${studentDetails.classLevel ? `Class ${studentDetails.classLevel}` : 'Class X'} ${studentDetails.board || 'CBSE'}` : 'Class X Board Readiness Challenge'}
            </div>
            <div>
              Shri Ram Smart Minds Academy • Academic Evaluation Office
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PAGE 4: DIAGNOSTIC AUDIT & STEP-BY-STEP CALCULATIONS (DEVELOPMENT ONLY)
          ========================================================================= */}
      {isTeacherView && (activeTab === 'all' || activeTab === 'page4') && report.calculationSteps && (
        <section className="report-page-container relative overflow-hidden rounded-3xl border border-amber-300 bg-white p-8 shadow-sm transition dark:border-amber-700/60 dark:bg-slate-900">
          {/* Header watermark & Brand bar */}
          <div className="flex items-center justify-between border-b border-amber-200 pb-4 dark:border-amber-900/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Diagnostic Audit Engine
                </span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Development Mode
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                PAGE 4 — DIAGNOSTIC AUDIT &amp; STEP-BY-STEP CALCULATIONS
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-800 dark:text-amber-300 border border-amber-500/30">
                PAGE 4 (DEV AUDIT)
              </span>
              <p className="mt-1 text-[11px] text-slate-400">Internal Verification Artifact</p>
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

          {/* 4.1 Scoring & BRI Derivation */}
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

          {/* 4.2 Area Breakdowns Calculation Steps */}
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
              2. Area &amp; Difficulty Breakdown Derivations
            </h3>
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
          </div>

          {/* 4.3 Cognitive Skills & Accuracy Derivations */}
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

          {/* 4.4 Question Structure Derivations */}
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

          {/* 4.5 Time Management & Pacing Derivations */}
          {report.calculationSteps.timeManagement && (
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                5. Time Management &amp; Pacing Derivations
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scoring Formula</span>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      (Total Score / (3 * Attempted)) * 100
                    </p>
                    <p className="mt-1 text-xs text-brand-600 dark:text-brand-400 font-bold">
                      {report.calculationSteps.timeManagement.formula} = {report.calculationSteps.timeManagement.finalScorePercent}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Per-Question Multipliers</span>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      <li>• Time &lt; 1.5x ETS: <strong className="text-emerald-600">Good (3 pts)</strong></li>
                      <li>• 1.5x - 2.0x ETS: <strong className="text-amber-600">Medium (2 pts)</strong></li>
                      <li>• Time &gt; 2.0x ETS: <strong className="text-rose-600">Poor (1 pt)</strong></li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rating &amp; Flags</span>
                    <div className="mt-1 flex items-center gap-2">
                      {getTimeManagementBadge(report.calculationSteps.timeManagement.ratingResult)}
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {report.calculationSteps.timeManagement.finalScorePercent}%
                      </span>
                    </div>
                    {report.calculationSteps.timeManagement.guessworkQuestions.length > 0 ? (
                      <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                        ⚠️ Guesswork: Q{report.calculationSteps.timeManagement.guessworkQuestions.join(', Q')} (&lt;20s)
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ No guesswork flags (&lt;20s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4.6 Full Question-by-Question Diagnostic Audit */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                  6. Full Question-by-Question Audit Table ({report.calculationSteps.questionAudit.length} Questions)
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
                            {item.timeTakenS}s / ETS {item.expectedUpperBoundS}s
                          </div>
                          <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                            {item.timeManagementLabel && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${item.timeManagementScore === 3
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : item.timeManagementScore === 2
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  }`}
                              >
                                {item.timeManagementLabel} ({item.timeManagementScore} pts)
                              </span>
                            )}
                            {item.isGuesswork && (
                              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-950 dark:bg-amber-900/60 dark:text-amber-200">
                                ⚡ &lt;20s Guesswork
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

          {/* 4.6 Chapter Accuracy & Priority Ranking */}
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
              6. Chapter Score &amp; Priority Classification Audit
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
    </div>
  );
}
