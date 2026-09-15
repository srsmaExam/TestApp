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
  Info,
  Compass,
  Calculator,
  Wrench,
} from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type {
  DiagnosticEvaluationResult,
  PreparationLevel,
  SkillValueCategory,
  PriorityLevel,
  RevisitCategory,
} from '@/lib/diagnostic-evaluator';

interface BoardReadinessReportProps {
  report: DiagnosticEvaluationResult;
  onRetakeOrBrowse?: () => void;
}

export function BoardReadinessReport({ report, onRetakeOrBrowse }: BoardReadinessReportProps) {
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
                Official Diagnostic Report
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class X CBSE</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              SRSMA Board Readiness Challenge Report
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab buttons */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All Pages (1–4)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('page1')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                activeTab === 'page1'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Page 1
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('page2')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                activeTab === 'page2'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Page 2
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('page3')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                activeTab === 'page3'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Page 3
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('page4')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                activeTab === 'page4'
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
          PAGE 1: SRSMA BOARD READINESS CHALLENGE REPORT
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'page1') && (
        <section className="report-page-container relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          {/* Header watermark & Brand bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                Shri Ram Smart Minds Academy
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                SRSMA BOARD READINESS CHALLENGE REPORT
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                PAGE 1 OF 3
              </span>
              <p className="mt-1 text-[11px] text-slate-400">Class X Diagnostic Evaluator</p>
            </div>
          </div>

          {/* Mentor Greeting Card */}
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-50/70 via-indigo-50/40 to-slate-50 p-6 border border-brand-100/80 dark:border-slate-800 dark:from-slate-900 dark:via-brand-950/20 dark:to-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-black text-base shadow-sm">
                🎓
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dear {report.studentName},</h3>
                <p className="text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
                  Congratulations on taking this first step towards becoming more Board-ready! Taking this diagnostic test shows that you care about your preparation and are willing to find out where you stand and how you can improve. Go through this report carefully—it will help you understand your strengths, identify the areas that need more attention, and know what to do next. If you use these insights well you can put yourself in a strong position to excel in your Class X Board examinations. Go ahead and explore further!
                </p>
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
            {/* BRI Radial & Level Tile */}
            <div className="sm:col-span-6 lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-inner dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Board Readiness Index (BRI)
              </span>

              <div className="my-4 flex items-center justify-center">
                <div className="relative flex size-36 items-center justify-center rounded-full border-8 border-slate-100 shadow-inner dark:border-slate-800">
                  {/* Progress Ring Simulation */}
                  <svg className="absolute inset-0 size-full -rotate-90">
                    <circle
                      cx="68"
                      cy="68"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-200 dark:text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="68"
                      cy="68"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={364}
                      strokeDashoffset={364 - (364 * Math.min(100, Math.max(0, report.briScore))) / 100}
                      strokeLinecap="round"
                      className={`${
                        report.briScore >= 80
                          ? 'text-emerald-500'
                          : report.briScore >= 60
                          ? 'text-blue-500'
                          : 'text-amber-500'
                      }`}
                      fill="transparent"
                    />
                  </svg>
                  <div className="text-center z-10">
                    <span className="tnum text-3xl font-black text-slate-900 dark:text-white">
                      {report.briScore}%
                    </span>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      BRI Score
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Level of Preparation</span>
                <div className="mt-1">
                  <span className={`inline-block rounded-xl border px-3.5 py-1 text-xs font-black tracking-wide ${prepStyle.bg}`}>
                    {prepStyle.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Snapshot Cards & Denominators */}
            <div className="sm:col-span-6 lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Raw Score</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="tnum text-2xl font-black text-slate-900 dark:text-white">
                      {report.totalRawScore}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">/ {report.totalQuestions}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${(report.totalRawScore / Math.max(1, report.totalQuestions)) * 100}%` }}
                    />
                  </div>
                  <span className="mt-1 block text-[10px] text-slate-400">Questions Answered Correctly</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Weighted Score</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="tnum text-2xl font-black text-brand-600 dark:text-brand-400">
                      {report.totalWeightedScore}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">/ {report.totalDiagnosticWeight}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${(report.totalWeightedScore / Math.max(1, report.totalDiagnosticWeight)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="mt-1 block text-[10px] text-slate-400">Diagnostic Weight Points</span>
                </div>
              </div>

              {/* Area Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                      <TableHead className="text-xs font-bold uppercase tracking-wider">Area</TableHead>
                      <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        Mathematics
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum font-black text-slate-900 dark:text-white">
                          {report.breakdown.mathematics.score} / {report.breakdown.mathematics.totalQuestions}
                        </span>
                        <span className="ml-2 inline-block text-xs font-semibold text-slate-400">
                          ({report.breakdown.mathematics.percentage}%)
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        Science
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum font-black text-slate-900 dark:text-white">
                          {report.breakdown.science.score} / {report.breakdown.science.totalQuestions}
                        </span>
                        <span className="ml-2 inline-block text-xs font-semibold text-slate-400">
                          ({report.breakdown.science.percentage}%)
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        Easy Questions
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum font-bold text-slate-800 dark:text-slate-200">
                          {report.breakdown.easy.score} / {report.breakdown.easy.totalQuestions}
                        </span>
                        <span className="ml-2 inline-block text-xs text-slate-400">
                          ({report.breakdown.easy.percentage}%)
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        Medium Questions
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum font-bold text-slate-800 dark:text-slate-200">
                          {report.breakdown.medium.score} / {report.breakdown.medium.totalQuestions}
                        </span>
                        <span className="ml-2 inline-block text-xs text-slate-400">
                          ({report.breakdown.medium.percentage}%)
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        Difficult Questions
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tnum font-bold text-slate-800 dark:text-slate-200">
                          {report.breakdown.difficult.score} / {report.breakdown.difficult.totalQuestions}
                        </span>
                        <span className="ml-2 inline-block text-xs text-slate-400">
                          ({report.breakdown.difficult.percentage}%)
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Board Readiness Profile */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                Your Board Readiness Profile
              </h4>
              <span className="text-[11px] font-semibold text-slate-400">
                (Three Levels: Good &gt;66.7% | Average 33.3%–66.7% | Needs Strengthening ≤33.3%)
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Conceptual Foundation</span>
                <div className="mt-2 flex items-center justify-between">
                  {getSkillCategoryBadge(report.skills.conceptualFoundation.category)}
                  <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                    {report.skills.conceptualFoundation.scorePercent}%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Concept Application Skill</span>
                <div className="mt-2 flex items-center justify-between">
                  {getSkillCategoryBadge(report.skills.conceptApplication.category)}
                  <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                    {report.skills.conceptApplication.scorePercent}%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Problem Solving Skill</span>
                <div className="mt-2 flex items-center justify-between">
                  {getSkillCategoryBadge(report.skills.problemSolving.category)}
                  <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                    {report.skills.problemSolving.scorePercent}%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Accuracy (Attempted)</span>
                <div className="mt-2 flex items-center justify-between">
                  {getSkillCategoryBadge(report.skills.accuracy.category)}
                  <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                    {report.skills.accuracy.scorePercent}%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Question Interpretation</span>
                <div className="mt-2 flex items-center justify-between">
                  {getSkillCategoryBadge(report.skills.questionInterpretation.category)}
                  <span className="tnum text-xs font-bold text-slate-700 dark:text-slate-300">
                    {report.skills.questionInterpretation.scorePercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

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
                Cognitive &amp; Structural Architecture
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                PAGE 2: PERFORMANCE ANALYSIS &amp; PATTERNS
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                PAGE 2 OF 3
              </span>
              <p className="mt-1 text-[11px] text-slate-400">Diagnostic Mastery</p>
            </div>
          </div>

          {/* Top 3 Strengths */}
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
              Your Strengths
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              {report.strengths.map((s) => (
                <div
                  key={s.rank}
                  className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-teal-950/20"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 font-black text-xs text-white shadow-xs">
                        #{s.rank}
                      </span>
                      <span className="tnum text-xs font-black text-emerald-800 dark:text-emerald-300">
                        {s.scoreDetails}
                      </span>
                    </div>
                    <h4 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed dark:text-slate-300">
                      {s.reason}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    <span>Verified Core Strength</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Structure Performance Table */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                Your Performance Pattern (By Question Type)
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">7 Structural Architectures</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Question Type</TableHead>
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Correct / Total</TableHead>
                    <TableHead className="w-1/3 text-xs font-bold uppercase tracking-wider">Performance Graph</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Performance (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.structures.map((st) => (
                    <TableRow key={st.type}>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {st.type}
                      </TableCell>
                      <TableCell className="text-center tnum font-semibold text-slate-700 dark:text-slate-300">
                        {st.correct} / {st.total}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                st.percentage >= 70
                                  ? 'bg-emerald-500'
                                  : st.percentage >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${st.percentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tnum font-bold text-slate-900 dark:text-white">
                        {st.percentage}%
                      </TableCell>
                    </TableRow>
                  ))}
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
                Actionable Next Steps
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                PAGE 3 — WHERE SHOULD YOU IMPROVE?
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                PAGE 3 OF 3
              </span>
              <p className="mt-1 text-[11px] text-slate-400">Targeted Interventions</p>
            </div>
          </div>

          {/* Priority Gaps */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                Your Priority Gaps
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                (Priority Benchmarks: &lt; 40% = High Priority | 40% to 55% = Medium Priority | 55% to 74% = Low Priority)
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {report.priorityGaps.map((g) => (
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
                      className={`h-full rounded-full ${
                        g.priority === 'High Priority'
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
          </div>

          {/* Topics to Revisit Table */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                  Topics to Revisit
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  List of topics where pacing or accuracy issues occurred during the test:
                </p>
              </div>

              {/* Interactive Category Filter (Hidden in Print) */}
              <div className="no-print flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setRevisitFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    revisitFilter === 'all'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  All Issues ({report.topicsToRevisit.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRevisitFilter('High Friction Gap')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    revisitFilter === 'High Friction Gap'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  High Friction ({report.topicsToRevisit.filter((t) => t.category === 'High Friction Gap').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRevisitFilter('Pacing / Time Management')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    revisitFilter === 'Pacing / Time Management'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Pacing ({report.topicsToRevisit.filter((t) => t.category === 'Pacing / Time Management').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRevisitFilter('Conceptual / Calculation Gap')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    revisitFilter === 'Conceptual / Calculation Gap'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Concepts ({report.topicsToRevisit.filter((t) => t.category === 'Conceptual / Calculation Gap').length})
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto dark:border-slate-800 dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider">Q#</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Subject</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Chapter &amp; Topic</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Issue Observed</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Category</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Recommended Focus Area</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopics.map((t) => (
                    <TableRow key={t.qno} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <TableCell className="text-center font-bold text-slate-900 dark:text-white">
                        {t.qno}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        {t.subject}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{t.chapter}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t.topic}</div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                        {t.issueObserved}
                      </TableCell>
                      <TableCell>{getRevisitBadge(t.category)}</TableCell>
                      <TableCell className="text-xs font-semibold text-brand-700 dark:text-brand-400 max-w-xs">
                        {t.recommendedFocusArea}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTopics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No topics match the selected category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center sm:text-left">
              *Topic observations are based only on the questions tested.*
            </p>
          </div>

          {/* Footer certification note */}
          <div className="mt-8 border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 dark:border-slate-800">
            <div>
              Generated for <strong className="text-slate-700 dark:text-slate-300">{report.studentName}</strong> • Class X Board Readiness Challenge
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
      {(activeTab === 'all' || activeTab === 'page4') && report.calculationSteps && (
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

          {/* 4.5 Full Question-by-Question Diagnostic Audit */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white">
                  5. Full Question-by-Question Audit Table ({report.calculationSteps.questionAudit.length} Questions)
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
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    auditFilter === 'all'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  All ({report.calculationSteps.questionAudit.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('incorrect')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    auditFilter === 'incorrect'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Incorrect ({report.calculationSteps.questionAudit.filter((q) => !q.isCorrect).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('overtime')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    auditFilter === 'overtime'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Overtime ({report.calculationSteps.questionAudit.filter((q) => q.timeLimitExceeded).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('revisit')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    auditFilter === 'revisit'
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
                    <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Time (Actual vs Exp)</TableHead>
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
                            {item.timeTakenS}s / {item.expectedTimeRaw}
                          </div>
                          {item.timeLimitExceeded ? (
                            <span className="inline-block rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              OVERTIME (+{item.timeTakenS - item.expectedUpperBoundS}s)
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              On Time
                            </span>
                          )}
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
