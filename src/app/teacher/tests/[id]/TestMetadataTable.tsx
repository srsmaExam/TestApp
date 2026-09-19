'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Layers,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  buttonClass,
  Card,
  CardBody,
  Dialog,
  Input,
  Label,
  Select,
  Spinner,
  StatTile,
  useToast,
} from '@/components/ui';
import { QuestionBody } from '@/components/Katex';
import {
  generateSampleMetadataCsv,
  parseMetadataCsv,
  type ParsedMetadataRow,
} from '@/lib/metadata-csv';

export type EditableQuestion = {
  testId: string;
  questionId: string;
  position: number;
  subject: string;
  type: 'mcq' | 'integer';
  body: string;
  options: any[];
  answer?: any;
  solution?: string | null;
  humanCode?: string | null;
  difficulty?: number | null;
  expectedTimeS?: number | null;
  chapter?: string | null;
  topic?: string | null;
  metadata?: any;
};

type QuestionRowState = {
  chapter: string;
  topic: string;
  difficulty: number; // 1, 2, 3
  difficultyLabel: string;
  primarySkill: string;
  secondarySkill: string;
  cognitiveLevel: string;
  conceptTested: string;
  prerequisiteConcept: string;
  questionStructure: string;
  visualDependency: string;
  calculationIntensity: string;
  expectedTime: string;
  diagnosticWeight: number;
};

const PRIMARY_SKILLS = [
  'Concept Application',
  'Conceptual Foundation',
  'Analytical Reasoning',
  'Calculation',
  'Data Interpretation',
  'Scientific Inquiry',
  'Formula Recall',
  'Evaluation & Synthesis',
];

const SECONDARY_SKILLS = [
  'Calculation',
  'Elimination',
  'Visual Interpretation',
  'Formula Recall',
  'Step Verification',
  'None',
];

const COGNITIVE_LEVELS = ['Recall', 'Application', 'Analysis', 'Evaluation'];
const STRUCTURES = ['Direct', 'Multi-step', 'Statement-based', 'Case-study', 'Assertion-Reason'];
const VISUAL_DEPENDENCIES = ['None', 'Low', 'Medium', 'High'];
const CALCULATION_INTENSITIES = ['Low', 'Medium', 'High'];

export function TestMetadataTable({
  testId,
  testTitle,
  initialQuestions,
  onQuestionsUpdated,
}: {
  testId: string;
  testTitle?: string;
  initialQuestions: EditableQuestion[];
  onQuestionsUpdated?: (updated: EditableQuestion[]) => void;
}) {
  const { toast } = useToast();

  // Helper to map a question to RowState
  const mapToRowState = (q: EditableQuestion): QuestionRowState => {
    const m = q.metadata || {};
    const diffLevel = q.difficulty === 1 ? 1 : q.difficulty === 3 ? 3 : 2;
    const diffLabel =
      m.difficultyLabel ||
      (diffLevel === 1 ? 'Easy' : diffLevel === 3 ? 'Difficult' : 'Medium');

    return {
      chapter: q.chapter || '',
      topic: q.topic || '',
      difficulty: diffLevel,
      difficultyLabel: diffLabel,
      primarySkill: m.primarySkill || 'Concept Application',
      secondarySkill: m.secondarySkill || 'Calculation',
      cognitiveLevel: m.cognitiveLevel || 'Application',
      conceptTested: m.conceptTested || '',
      prerequisiteConcept: m.prerequisiteConcept || '',
      questionStructure: m.questionStructure || 'Direct',
      visualDependency: m.visualDependency || 'None',
      calculationIntensity: m.calculationIntensity || 'Medium',
      expectedTime: m.expectedTime || (q.expectedTimeS ? String(q.expectedTimeS) : '60'),
      diagnosticWeight: m.diagnosticWeight != null ? Number(m.diagnosticWeight) : 1,
    };
  };

  // State
  const [rows, setRows] = useState<Record<string, QuestionRowState>>(() => {
    const initial: Record<string, QuestionRowState> = {};
    for (const q of initialQuestions) {
      initial[q.questionId] = mapToRowState(q);
    }
    return initial;
  });

  const [initialSnapshot, setInitialSnapshot] = useState<Record<string, QuestionRowState>>(() => {
    const initial: Record<string, QuestionRowState> = {};
    for (const q of initialQuestions) {
      initial[q.questionId] = mapToRowState(q);
    }
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Bulk Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadErrors, setUploadErrors] = useState<Array<{ row: number; field: string; message: string }>>([]);
  const [uploadWarnings, setUploadWarnings] = useState<Array<{ row: number; field: string; message: string }>>([]);
  const [parsedUploadRows, setParsedUploadRows] = useState<ParsedMetadataRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect dirty (unsaved) modifications
  const dirtyQuestionIds = useMemo(() => {
    const dirty = new Set<string>();
    for (const q of initialQuestions) {
      const current = rows[q.questionId];
      const initial = initialSnapshot[q.questionId];
      if (!current || !initial) continue;

      if (
        current.chapter !== initial.chapter ||
        current.topic !== initial.topic ||
        current.difficulty !== initial.difficulty ||
        current.primarySkill !== initial.primarySkill ||
        current.secondarySkill !== initial.secondarySkill ||
        current.cognitiveLevel !== initial.cognitiveLevel ||
        current.conceptTested !== initial.conceptTested ||
        current.prerequisiteConcept !== initial.prerequisiteConcept ||
        current.questionStructure !== initial.questionStructure ||
        current.visualDependency !== initial.visualDependency ||
        current.calculationIntensity !== initial.calculationIntensity ||
        current.expectedTime !== initial.expectedTime ||
        current.diagnosticWeight !== initial.diagnosticWeight
      ) {
        dirty.add(q.questionId);
      }
    }
    return dirty;
  }, [initialQuestions, rows, initialSnapshot]);

  const hasUnsavedChanges = dirtyQuestionIds.size > 0;

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return initialQuestions.filter((q, idx) => {
      const r = rows[q.questionId];
      if (!r) return true;

      if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
      if (filterDifficulty !== 'all') {
        if (filterDifficulty === 'easy' && r.difficulty !== 1) return false;
        if (filterDifficulty === 'medium' && r.difficulty !== 2) return false;
        if (filterDifficulty === 'difficult' && r.difficulty !== 3) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchQno = `q${q.position}`.includes(query) || `${q.position}` === query;
        const matchChap = r.chapter.toLowerCase().includes(query);
        const matchTopic = r.topic.toLowerCase().includes(query);
        const matchConcept = r.conceptTested.toLowerCase().includes(query);
        const matchSkill = r.primarySkill.toLowerCase().includes(query);
        const matchCode = q.humanCode?.toLowerCase().includes(query);
        if (!matchQno && !matchChap && !matchTopic && !matchConcept && !matchSkill && !matchCode) {
          return false;
        }
      }

      return true;
    });
  }, [initialQuestions, rows, filterSubject, filterDifficulty, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    let fullyProfiled = 0;
    let totalWeight = 0;

    for (const q of initialQuestions) {
      const r = rows[q.questionId];
      if (!r) continue;
      totalWeight += Number(r.diagnosticWeight || 1);
      if (r.chapter && r.topic && r.conceptTested && r.primarySkill) {
        fullyProfiled++;
      }
    }

    return {
      total: initialQuestions.length,
      fullyProfiled,
      totalWeight,
    };
  }, [initialQuestions, rows]);

  // Row update handlers
  const updateRowField = <K extends keyof QuestionRowState>(
    questionId: string,
    field: K,
    value: QuestionRowState[K],
  ) => {
    setRows((prev) => {
      const existing = prev[questionId];
      if (!existing) return prev;
      return {
        ...prev,
        [questionId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleDifficultyChange = (questionId: string, label: string) => {
    const level = label === 'Easy' ? 1 : label === 'Difficult' ? 3 : 2;
    setRows((prev) => {
      const existing = prev[questionId];
      if (!existing) return prev;
      return {
        ...prev,
        [questionId]: {
          ...existing,
          difficulty: level,
          difficultyLabel: label,
        },
      };
    });
  };

  // Reset Changes
  const handleReset = () => {
    setRows(initialSnapshot);
    toast.info('Reverted all unsaved metadata changes.');
  };

  // Save Metadata API Call
  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    setSaving(true);

    try {
      const payload = {
        questions: initialQuestions.map((q) => {
          const r = rows[q.questionId];
          const timeS = Number(r.expectedTime?.split(/[,–-]/)[1] || r.expectedTime?.split(/[,–-]/)[0] || 60);

          return {
            questionId: q.questionId,
            chapter: r.chapter || null,
            topic: r.topic || null,
            difficulty: r.difficulty,
            expectedTimeS: isNaN(timeS) ? 60 : timeS,
            metadata: {
              ...(q.metadata || {}),
              primarySkill: r.primarySkill || null,
              secondarySkill: r.secondarySkill || null,
              cognitiveLevel: r.cognitiveLevel || null,
              conceptTested: r.conceptTested || null,
              prerequisiteConcept: r.prerequisiteConcept || null,
              questionStructure: r.questionStructure || null,
              visualDependency: r.visualDependency || null,
              calculationIntensity: r.calculationIntensity || null,
              expectedTime: r.expectedTime || null,
              diagnosticWeight: Number(r.diagnosticWeight) || 1,
              difficultyLabel: r.difficultyLabel,
            },
          };
        }),
      };

      const res = await fetch(`/api/tests/${testId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to save question metadata');

      setInitialSnapshot({ ...rows });
      toast.success(`Successfully saved question metadata for ${initialQuestions.length} questions!`);

      if (onQuestionsUpdated) {
        const updatedQuestions = initialQuestions.map((q) => {
          const r = rows[q.questionId];
          return {
            ...q,
            chapter: r.chapter || null,
            topic: r.topic || null,
            difficulty: r.difficulty,
            metadata: {
              ...(q.metadata || {}),
              primarySkill: r.primarySkill || null,
              secondarySkill: r.secondarySkill || null,
              cognitiveLevel: r.cognitiveLevel || null,
              conceptTested: r.conceptTested || null,
              prerequisiteConcept: r.prerequisiteConcept || null,
              questionStructure: r.questionStructure || null,
              visualDependency: r.visualDependency || null,
              calculationIntensity: r.calculationIntensity || null,
              expectedTime: r.expectedTime || null,
              diagnosticWeight: Number(r.diagnosticWeight) || 1,
              difficultyLabel: r.difficultyLabel,
            },
          };
        });
        onQuestionsUpdated(updatedQuestions);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving metadata');
    } finally {
      setSaving(false);
    }
  };

  // Download Sample or Pre-filled Template CSV
  const handleDownloadTemplate = (prefilled = true) => {
    const csvContent = generateSampleMetadataCsv(
      prefilled
        ? initialQuestions.map((q) => ({
            position: q.position,
            subject: q.subject,
            chapter: rows[q.questionId]?.chapter,
            topic: rows[q.questionId]?.topic,
            difficulty: rows[q.questionId]?.difficulty,
            expectedTimeS: q.expectedTimeS,
            metadata: {
              primarySkill: rows[q.questionId]?.primarySkill,
              secondarySkill: rows[q.questionId]?.secondarySkill,
              cognitiveLevel: rows[q.questionId]?.cognitiveLevel,
              conceptTested: rows[q.questionId]?.conceptTested,
              prerequisiteConcept: rows[q.questionId]?.prerequisiteConcept,
              questionStructure: rows[q.questionId]?.questionStructure,
              visualDependency: rows[q.questionId]?.visualDependency,
              calculationIntensity: rows[q.questionId]?.calculationIntensity,
              expectedTime: rows[q.questionId]?.expectedTime,
              diagnosticWeight: rows[q.questionId]?.diagnosticWeight,
              difficultyLabel: rows[q.questionId]?.difficultyLabel,
            },
          }))
        : undefined,
    );

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = prefilled
      ? `${(testTitle || 'test').replace(/[^a-zA-Z0-9_-]/g, '_')}-metadata-template.csv`
      : 'srsma-question-metadata-sample-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded metadata CSV template!');
  };

  // Parse Uploaded CSV content
  const handleProcessCsv = (csvText: string) => {
    setUploadText(csvText);
    const result = parseMetadataCsv(csvText);
    setUploadErrors(result.errors);
    setUploadWarnings(result.warnings);
    setParsedUploadRows(result.validRows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) handleProcessCsv(text);
    };
    reader.readAsText(file);
  };

  // Apply parsed CSV rows to table state
  const handleApplyUpload = () => {
    if (parsedUploadRows.length === 0) return;

    let appliedCount = 0;
    const nextRows = { ...rows };

    // Map by position (Qno)
    const questionByPosition = new Map<number, EditableQuestion>();
    for (const q of initialQuestions) {
      questionByPosition.set(q.position, q);
    }

    for (const row of parsedUploadRows) {
      const matchedQ = questionByPosition.get(row.qno);
      if (!matchedQ) continue;

      const qid = matchedQ.questionId;
      const current = nextRows[qid];
      if (!current) continue;

      nextRows[qid] = {
        chapter: row.chapter !== undefined && row.chapter !== null ? row.chapter : current.chapter,
        topic: row.topic !== undefined && row.topic !== null ? row.topic : current.topic,
        difficulty: row.difficulty !== undefined && row.difficulty !== null ? row.difficulty : current.difficulty,
        difficultyLabel: row.difficultyLabel || current.difficultyLabel,
        primarySkill: row.primarySkill || current.primarySkill,
        secondarySkill: row.secondarySkill || current.secondarySkill,
        cognitiveLevel: row.cognitiveLevel || current.cognitiveLevel,
        conceptTested: row.conceptTested !== undefined && row.conceptTested !== null ? row.conceptTested : current.conceptTested,
        prerequisiteConcept: row.prerequisiteConcept !== undefined && row.prerequisiteConcept !== null ? row.prerequisiteConcept : current.prerequisiteConcept,
        questionStructure: row.questionStructure || current.questionStructure,
        visualDependency: row.visualDependency || current.visualDependency,
        calculationIntensity: row.calculationIntensity || current.calculationIntensity,
        expectedTime: row.expectedTime || current.expectedTime,
        diagnosticWeight: row.diagnosticWeight != null ? Number(row.diagnosticWeight) : current.diagnosticWeight,
      };
      appliedCount++;
    }

    setRows(nextRows);
    setUploadModalOpen(false);
    toast.success(`Applied metadata profiling for ${appliedCount} question(s)! Click "Save Metadata" to save.`);
  };

  // Open Preview Modal
  const openPreview = (questionPosition: number) => {
    const idx = initialQuestions.findIndex((q) => q.position === questionPosition);
    if (idx !== -1) {
      setPreviewIndex(idx);
      setPreviewOpen(true);
    }
  };

  const currentPreviewQ = initialQuestions[previewIndex];
  const currentPreviewRow = currentPreviewQ ? rows[currentPreviewQ.questionId] : null;

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Question Metadata &amp; Profiling
            </h2>
            <Badge tone="brand">Class X BRC Engine</Badge>
            {hasUnsavedChanges && (
              <Badge tone="amber" className="animate-pulse">
                {dirtyQuestionIds.size} unsaved change{dirtyQuestionIds.size === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure primary/secondary skills, cognitive mastery level, prerequisite concepts, and diagnostic weights. Click on any{' '}
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">Question Number (Q#)</strong> to view the live preview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Sample Template */}
          <div className="relative inline-flex rounded-md shadow-2xs">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDownloadTemplate(true)}
              title="Download pre-filled CSV with current test questions"
            >
              <Download className="mr-1.5 size-3.5 text-slate-600 dark:text-slate-400" />
              Template
            </Button>
          </div>

          {/* Bulk Upload */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setUploadModalOpen(true);
              setUploadErrors([]);
              setUploadWarnings([]);
              setParsedUploadRows([]);
              setUploadText('');
            }}
          >
            <Upload className="mr-1.5 size-3.5 text-indigo-600 dark:text-indigo-400" />
            Bulk Upload
          </Button>

          {/* Revert Changes */}
          {hasUnsavedChanges && (
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving}>
              <RotateCcw className="mr-1 size-3.5" />
              Reset
            </Button>
          )}

          {/* Save Button */}
          <Button
            variant={hasUnsavedChanges ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? <Spinner className="size-3.5" /> : <Save className="mr-1.5 size-3.5" />}
            Save Metadata
          </Button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total Test Questions" value={stats.total} tone="slate" />
        <StatTile
          label="Profiled Questions"
          value={`${stats.fullyProfiled} / ${stats.total}`}
          tone={stats.fullyProfiled === stats.total ? 'emerald' : 'amber'}
        />
        <StatTile label="Total Diagnostic Weight" value={stats.totalWeight} tone="brand" />
        <StatTile label="Unsaved Changes" value={dirtyQuestionIds.size} tone={hasUnsavedChanges ? 'amber' : 'slate'} />
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Q#, chapter, topic, or concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="size-3.5 text-slate-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Subjects</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="maths">Maths</option>
              <option value="biology">Biology</option>
            </select>
          </div>

          <div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="difficult">Difficult</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          Showing {filteredQuestions.length} of {initialQuestions.length} questions
        </div>
      </div>

      {/* Main Metadata Table */}
      {initialQuestions.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <Layers className="mx-auto size-10 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">No questions in test</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Add questions to this test from the &quot;Add from Bank&quot; tab first before profiling metadata.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/95 backdrop-blur-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-100">
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2.5 shadow-xs dark:bg-slate-950">
                    Q# (Preview)
                  </th>
                  <th className="px-2.5 py-2.5">Subject</th>
                  <th className="min-w-[140px] px-2.5 py-2.5">Chapter</th>
                  <th className="min-w-[140px] px-2.5 py-2.5">Topic</th>
                  <th className="min-w-[100px] px-2.5 py-2.5">Difficulty</th>
                  <th className="min-w-[160px] px-2.5 py-2.5">Primary Skill</th>
                  <th className="min-w-[130px] px-2.5 py-2.5">Secondary Skill</th>
                  <th className="min-w-[110px] px-2.5 py-2.5">Cognitive Level</th>
                  <th className="min-w-[180px] px-2.5 py-2.5">Concept Tested</th>
                  <th className="min-w-[160px] px-2.5 py-2.5">Prerequisite Concept</th>
                  <th className="min-w-[110px] px-2.5 py-2.5">Structure</th>
                  <th className="min-w-[85px] px-2.5 py-2.5">Visual</th>
                  <th className="min-w-[85px] px-2.5 py-2.5">Calc Intensity</th>
                  <th className="min-w-[85px] px-2.5 py-2.5">Time (s)</th>
                  <th className="min-w-[70px] px-2.5 py-2.5 text-center">Weight</th>
                  <th className="px-2.5 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {filteredQuestions.map((q) => {
                  const r = rows[q.questionId];
                  if (!r) return null;
                  const isDirty = dirtyQuestionIds.has(q.questionId);

                  return (
                    <tr
                      key={q.questionId}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        isDirty ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Question Number Button (Opens Preview Modal) */}
                      <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium shadow-xs dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => openPreview(q.position)}
                          className="group inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50/80 px-2 py-1 font-mono text-xs font-bold text-brand-700 shadow-2xs transition-all hover:border-brand-400 hover:bg-brand-100 hover:text-brand-900 hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900"
                          title={`Click to view full preview of Question ${q.position}`}
                        >
                          <span>Q{q.position}</span>
                          <Eye className="size-3 text-brand-500 group-hover:scale-110 group-hover:text-brand-700 dark:text-brand-400" />
                        </button>
                      </td>

                      {/* Subject */}
                      <td className="px-2.5 py-2">
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
                          {q.subject}
                        </Badge>
                      </td>

                      {/* Chapter */}
                      <td className="px-2.5 py-2">
                        <input
                          type="text"
                          value={r.chapter}
                          onChange={(e) => updateRowField(q.questionId, 'chapter', e.target.value)}
                          placeholder="e.g. Light"
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </td>

                      {/* Topic */}
                      <td className="px-2.5 py-2">
                        <input
                          type="text"
                          value={r.topic}
                          onChange={(e) => updateRowField(q.questionId, 'topic', e.target.value)}
                          placeholder="e.g. Reflection"
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </td>

                      {/* Difficulty */}
                      <td className="px-2.5 py-2">
                        <select
                          value={r.difficultyLabel}
                          onChange={(e) => handleDifficultyChange(q.questionId, e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Difficult">Difficult</option>
                        </select>
                      </td>

                      {/* Primary Skill */}
                      <td className="px-2.5 py-2">
                        <input
                          type="text"
                          list="primary-skills-list"
                          value={r.primarySkill}
                          onChange={(e) => updateRowField(q.questionId, 'primarySkill', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </td>

                      {/* Secondary Skill */}
                      <td className="px-2.5 py-2">
                        <input
                          type="text"
                          list="secondary-skills-list"
                          value={r.secondarySkill}
                          onChange={(e) => updateRowField(q.questionId, 'secondarySkill', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </td>

                      {/* Cognitive Level */}
                      <td className="px-2.5 py-2">
                        <select
                          value={r.cognitiveLevel}
                          onChange={(e) => updateRowField(q.questionId, 'cognitiveLevel', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {COGNITIVE_LEVELS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Concept Tested */}
                      <td className="px-2.5 py-2">
                        <input
                          type="text"
                          value={r.conceptTested}
                          onChange={(e) => updateRowField(q.questionId, 'conceptTested', e.target.value)}
                          placeholder="e.g. Mirror formula"
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </td>

                      {/* Prerequisite Concept */}
                      <td className="px-2.5 py-2">
                        <input
                          type="text"
                          value={r.prerequisiteConcept}
                          onChange={(e) => updateRowField(q.questionId, 'prerequisiteConcept', e.target.value)}
                          placeholder="e.g. Sign convention"
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </td>

                      {/* Question Structure */}
                      <td className="px-2.5 py-2">
                        <select
                          value={r.questionStructure}
                          onChange={(e) => updateRowField(q.questionId, 'questionStructure', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {STRUCTURES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Visual Dependency */}
                      <td className="px-2.5 py-2">
                        <select
                          value={r.visualDependency}
                          onChange={(e) => updateRowField(q.questionId, 'visualDependency', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-1 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {VISUAL_DEPENDENCIES.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Calculation Intensity */}
                      <td className="px-2.5 py-2">
                        <select
                          value={r.calculationIntensity}
                          onChange={(e) => updateRowField(q.questionId, 'calculationIntensity', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-1 text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {CALCULATION_INTENSITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Expected Time (s) */}
                      <td className="px-2.5 py-2">
                        <input
                          type="text"
                          value={r.expectedTime}
                          onChange={(e) => updateRowField(q.questionId, 'expectedTime', e.target.value)}
                          placeholder="e.g. 45,60"
                          className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-center font-mono text-xs text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </td>

                      {/* Diagnostic Weight */}
                      <td className="px-2.5 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={r.diagnosticWeight}
                          onChange={(e) =>
                            updateRowField(q.questionId, 'diagnosticWeight', Math.max(1, Number(e.target.value) || 1))
                          }
                          className="h-7 w-14 rounded border border-slate-200 bg-white text-center font-mono text-xs font-bold text-brand-700 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-brand-400"
                        />
                      </td>

                      {/* Action */}
                      <td className="px-2.5 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => openPreview(q.position)}
                          className="inline-flex size-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Open Question Preview Modal"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Datalists for Autocomplete */}
      <datalist id="primary-skills-list">
        {PRIMARY_SKILLS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="secondary-skills-list">
        {SECONDARY_SKILLS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Question Preview Modal */}
      {previewOpen && currentPreviewQ && currentPreviewRow && (
        <Dialog
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          size="xl"
          title={
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Question Preview: Q{currentPreviewQ.position} of {initialQuestions.length}
                </span>
                <Badge
                  tone={
                    currentPreviewQ.subject === 'physics'
                      ? 'brand'
                      : currentPreviewQ.subject === 'chemistry'
                      ? 'green'
                      : currentPreviewQ.subject === 'maths'
                      ? 'amber'
                      : 'purple'
                  }
                >
                  {currentPreviewQ.subject.toUpperCase()}
                </Badge>
                <Badge tone="slate">{currentPreviewQ.type.toUpperCase()}</Badge>
              </div>

              {currentPreviewQ.humanCode && (
                <span className="font-mono text-xs text-slate-400">Code: {currentPreviewQ.humanCode}</span>
              )}
            </div>
          }
          footer={
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  disabled={previewIndex === 0}
                >
                  <ChevronLeft className="mr-1 size-3.5" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewIndex((i) => Math.min(initialQuestions.length - 1, i + 1))}
                  disabled={previewIndex === initialQuestions.length - 1}
                >
                  Next
                  <ChevronRight className="ml-1 size-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/teacher/questions/${currentPreviewQ.questionId}`}
                  target="_blank"
                  className={buttonClass('secondary', 'sm')}
                >
                  Open in Question Editor
                </Link>
                <Button variant="primary" size="sm" onClick={() => setPreviewOpen(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Quick Strip of Questions */}
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
              {initialQuestions.map((q, idx) => (
                <button
                  key={q.questionId}
                  onClick={() => setPreviewIndex(idx)}
                  className={`flex size-7 shrink-0 items-center justify-center rounded text-xs font-bold transition-all ${
                    idx === previewIndex
                      ? 'bg-brand-700 text-white shadow-xs dark:bg-brand-600'
                      : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                  title={`Question ${q.position}`}
                >
                  {q.position}
                </button>
              ))}
            </div>

            {/* Question Body */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 leading-relaxed dark:border-slate-800 dark:bg-slate-900">
              <span className="mb-2 inline-block font-mono text-xs font-bold text-slate-400">
                QUESTION BODY (LATEX &amp; FIGURES):
              </span>
              <div className="text-sm text-slate-900 dark:text-slate-100">
                <QuestionBody
                  body={currentPreviewQ.body}
                  renderImage={(placeholderId) => (
                    <div className="my-2 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
                      <img
                        src={`/api/files/images/${currentPreviewQ.questionId}/${placeholderId}`}
                        alt="Question figure"
                        className="max-h-64 object-contain"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Options / Answer Area */}
            {currentPreviewQ.type === 'mcq' ? (
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-slate-400">ANSWER OPTIONS:</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(currentPreviewQ.options ?? []).map((opt: any) => {
                    const isCorrect =
                      currentPreviewQ.answer &&
                      'key' in currentPreviewQ.answer &&
                      currentPreviewQ.answer.key === opt.key;

                    return (
                      <div
                        key={opt.key}
                        className={`relative flex items-start gap-3 rounded-lg border p-3 text-sm transition-all ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/30'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <div className="flex-1 text-slate-900 dark:text-slate-100">
                          <QuestionBody
                            body={opt.body}
                            renderImage={(imgId) => (
                              <img
                                src={`/api/files/images/${currentPreviewQ.questionId}/${imgId}`}
                                alt="Option figure"
                                className="my-1 max-h-24 object-contain"
                              />
                            )}
                          />
                        </div>
                        {isCorrect && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            <Check className="size-3" /> Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="font-bold text-slate-700 dark:text-slate-300">Numerical Answer:</span>{' '}
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {typeof currentPreviewQ.answer === 'object' && currentPreviewQ.answer?.value !== undefined
                    ? currentPreviewQ.answer.value
                    : JSON.stringify(currentPreviewQ.answer ?? '—')}
                </span>
              </div>
            )}

            {/* Solution (if available) */}
            {currentPreviewQ.solution && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/30">
                <span className="font-bold text-indigo-900 dark:text-indigo-200">Solution / Explanation:</span>
                <div className="mt-1 text-slate-800 dark:text-slate-200">
                  <QuestionBody
                    body={currentPreviewQ.solution}
                    renderImage={(imgId) => (
                      <img
                        src={`/api/files/images/${currentPreviewQ.questionId}/${imgId}`}
                        alt="Solution figure"
                        className="my-1 max-h-32 object-contain"
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* Question Profiling Snapshot */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <span className="font-bold text-slate-800 dark:text-slate-200">Metadata Profiling:</span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <span className="text-slate-500">Chapter / Topic:</span>{' '}
                  <strong className="block font-medium text-slate-800 dark:text-slate-200">
                    {currentPreviewRow.chapter || '—'} {currentPreviewRow.topic ? `> ${currentPreviewRow.topic}` : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Primary Skill:</span>{' '}
                  <strong className="block font-medium text-slate-800 dark:text-slate-200">
                    {currentPreviewRow.primarySkill}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Cognitive Level:</span>{' '}
                  <strong className="block font-medium text-slate-800 dark:text-slate-200">
                    {currentPreviewRow.cognitiveLevel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Diagnostic Weight:</span>{' '}
                  <strong className="block font-medium text-slate-800 dark:text-slate-200">
                    {currentPreviewRow.diagnosticWeight}
                  </strong>
                </div>
                {currentPreviewRow.conceptTested && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Concept Tested:</span>{' '}
                    <strong className="block font-medium text-slate-800 dark:text-slate-200">
                      {currentPreviewRow.conceptTested}
                    </strong>
                  </div>
                )}
                {currentPreviewRow.prerequisiteConcept && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Prerequisite Concept:</span>{' '}
                    <strong className="block font-medium text-slate-800 dark:text-slate-200">
                      {currentPreviewRow.prerequisiteConcept}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Bulk Upload Modal */}
      {uploadModalOpen && (
        <Dialog
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          size="lg"
          title={
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-indigo-600 dark:text-indigo-400" />
              <span>Bulk Upload Question Metadata (CSV)</span>
            </div>
          }
          footer={
            <div className="flex w-full items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => handleDownloadTemplate(false)}>
                <Download className="mr-1.5 size-3.5" />
                Sample Template
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyUpload}
                  disabled={parsedUploadRows.length === 0 || uploadErrors.length > 0}
                >
                  Apply {parsedUploadRows.length > 0 ? `${parsedUploadRows.length} Rows` : ''} to Table
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Upload a CSV file containing question profiling metadata. Questions are mapped by{' '}
              <code className="font-bold text-slate-800 dark:text-slate-200">Qno</code> (e.g. 1, 2, 3) to their test positions.
            </p>

            {/* Drag & Drop / File Input */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition-colors hover:border-brand-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-brand-500 dark:hover:bg-slate-900"
            >
              <Upload className="size-8 text-slate-400" />
              <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click to select CSV file, or drag and drop
              </p>
              <p className="text-[11px] text-slate-400">Supports .csv exported from Excel or Google Sheets</p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Paste CSV raw text option */}
            <div>
              <Label className="text-xs">Or paste CSV content directly:</Label>
              <textarea
                rows={5}
                value={uploadText}
                onChange={(e) => handleProcessCsv(e.target.value)}
                placeholder="Qno,Subject,Chapter,Topic,Difficulty,Primary Skill,Secondary Skill,Cognitive Level,Concept Tested..."
                className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-[11px] leading-relaxed text-slate-800 focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>

            {/* Upload Feedback */}
            {uploadErrors.length > 0 && (
              <Alert tone="red" title="CSV Validation Errors">
                <ul className="list-inside list-disc space-y-1 text-xs">
                  {uploadErrors.map((err, i) => (
                    <li key={i}>
                      {err.row > 0 ? `Row ${err.row}: ` : ''}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {uploadWarnings.length > 0 && (
              <Alert tone="amber" title="Warnings">
                <ul className="list-inside list-disc space-y-1 text-xs">
                  {uploadWarnings.slice(0, 5).map((w, i) => (
                    <li key={i}>
                      Row {w.row}: {w.message}
                    </li>
                  ))}
                  {uploadWarnings.length > 5 && <li>...and {uploadWarnings.length - 5} more warnings.</li>}
                </ul>
              </Alert>
            )}

            {parsedUploadRows.length > 0 && uploadErrors.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Successfully validated <strong>{parsedUploadRows.length} question rows</strong>. Click &quot;Apply to
                  Table&quot; to populate.
                </span>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
