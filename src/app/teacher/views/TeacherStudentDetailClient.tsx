'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  Mail,
  Phone,
  RotateCw,
  Search,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  buttonClass,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@/components/ui';
import { StudentAnalyticsClient } from '@/app/student/analytics/StudentAnalyticsClient';

type StudentProfile = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string | null;
  batch: string | null;
  isActive: boolean;
  canLogin: boolean;
  createdAt: string;
  isProvisional: boolean;
};

type AttemptSummary = {
  attemptId: string;
  testId: string;
  testTitle: string;
  attemptNo: number;
  status: string;
  totalMarks: number | null;
  maxMarks: number | null;
  submittedAt: string | null;
};

type AllStudentOption = {
  id: string;
  fullName: string;
  username: string;
  batch: string | null;
};

export function TeacherStudentDetailClient({
  studentId,
  initialTab = 'analytics',
}: {
  studentId: string;
  initialTab?: 'analytics' | 'responses';
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [allStudents, setAllStudents] = useState<AllStudentOption[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'responses'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Load student profile & attempts
  useEffect(() => {
    async function fetchStudent() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/students/${studentId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load student details');
        }
        const json = await res.json();
        setStudent(json.student);
        setAttempts(json.attempts || []);
      } catch (err: any) {
        setError(err.message || 'Could not load student');
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  // Load roster list for the Quick Student Switcher
  useEffect(() => {
    async function loadAllStudents() {
      try {
        const res = await fetch('/api/students?limit=200');
        if (res.ok) {
          const json = await res.json();
          if (json.students) {
            setAllStudents(
              json.students.map((s: any) => ({
                id: s.id,
                fullName: s.fullName,
                username: s.username,
                batch: s.batch,
              })),
            );
          }
        }
      } catch {
        // Soft fail for quick switcher
      }
    }
    loadAllStudents();
  }, []);

  const completedAttempts = attempts.filter(
    (a) => a.status === 'submitted' || a.status === 'auto_submitted',
  );

  // Delete student permanently
  async function handleDeleteStudent() {
    if (!student) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch('/api/students/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [student.id], purge: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete student');
      toast.success(`Deleted ${student.fullName}`);
      router.push('/teacher/students');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <>
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Top Breadcrumb & Switcher Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link
            href="/teacher/students"
            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Students Roster
          </Link>
          <ChevronRight className="size-3 text-slate-300 dark:text-slate-600" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {student ? student.fullName : 'Student View'}
          </span>
        </div>

        {/* Quick Student Switcher */}
        {allStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Switch Student:
            </span>
            <Select
              value={studentId}
              onChange={(e) => {
                if (e.target.value && e.target.value !== studentId) {
                  router.push(`/teacher/students/${e.target.value}${activeTab === 'responses' ? '?tab=responses' : ''}`);
                }
              }}
              className="text-xs py-1 px-2.5 h-8 w-56 sm:w-64"
              aria-label="Switch student"
            >
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.batch || 'General'})
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {error ? (
        <Alert tone="red" title="Error">
          {error}
        </Alert>
      ) : null}

      {/* Student Identity Card */}
      {student && (
        <Card className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardBody className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Identity details */}
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-xl font-black text-white shadow-md">
                  {student.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      {student.fullName}
                    </h1>
                    <Badge tone={student.batch && student.batch !== 'General' ? 'brand' : 'slate'}>
                      {student.batch ?? 'General Batch'}
                    </Badge>
                    {student.isProvisional ? (
                      <Badge tone="amber">Prospective Lead</Badge>
                    ) : null}
                    <Badge tone={student.isActive ? 'green' : 'red'}>
                      {student.isActive ? 'Active Account' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      @{student.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="size-3 text-slate-400" />
                      {student.email}
                    </span>
                    {student.phone ? (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="size-3 text-slate-400" />
                        {student.phone}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-slate-400" />
                      Joined {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Quick Summary KPIs */}
              <div className="flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 lg:border-t-0 lg:pt-0">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center dark:border-slate-800 dark:bg-slate-800/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tests Taken
                  </p>
                  <p className="tnum text-xl font-black text-slate-900 dark:text-slate-100">
                    {completedAttempts.length}
                  </p>
                </div>

                <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-center dark:border-brand-900/40 dark:bg-brand-950/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                    Total Attempts
                  </p>
                  <p className="tnum text-xl font-black text-brand-700 dark:text-brand-400">
                    {attempts.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                title="Delete student permanently"
              >
                <Trash2 className="mr-1 size-3.5" />
                Delete Student
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === 'analytics'
                ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="size-4" />
            Board Readiness &amp; Analytics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responses')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === 'responses'
                ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileCheck className="size-4" />
            Test Responses &amp; Solutions ({attempts.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Analytics & Board Readiness */}
      {activeTab === 'analytics' && (
        <div>
          {loading && !student ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-8 text-brand-600 dark:text-brand-400" />
            </div>
          ) : (
            <StudentAnalyticsClient
              studentId={studentId}
              studentName={student?.fullName}
              isTeacherView={true}
            />
          )}
        </div>
      )}

      {/* Tab 2: Test Responses & Solutions */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Submitted Tests &amp; Question Responses
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Click &quot;View Response &amp; Solutions&quot; to review question-by-question responses, solutions, and time analysis.
            </span>
          </div>

          {attempts.length === 0 ? (
            <EmptyState
              title="No tests attempted yet"
              hint={`${student ? student.fullName : 'This student'} has not attempted or submitted any tests yet.`}
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Attempt #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((a) => {
                    const isCompleted =
                      a.status === 'submitted' || a.status === 'auto_submitted';
                    const scorePct =
                      a.totalMarks !== null && a.maxMarks && a.maxMarks > 0
                        ? Math.round((Number(a.totalMarks) / Number(a.maxMarks)) * 100)
                        : null;

                    return (
                      <TableRow key={a.attemptId}>
                        <TableCell>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {a.testTitle}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            ID: {a.testId}
                          </p>
                        </TableCell>
                        <TableCell className="tnum font-semibold text-slate-700 dark:text-slate-300">
                          #{a.attemptNo}
                        </TableCell>
                        <TableCell>
                          {isCompleted ? (
                            <Badge tone="green">Submitted</Badge>
                          ) : a.status === 'in_progress' ? (
                            <Badge tone="amber">In Progress</Badge>
                          ) : (
                            <Badge tone="slate">{a.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {a.totalMarks !== null && a.maxMarks !== null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="tnum text-base font-black text-slate-900 dark:text-slate-100">
                                {a.totalMarks}
                              </span>
                              <span className="text-xs text-slate-400">/ {a.maxMarks} M</span>
                              {scorePct !== null && (
                                <span className={`tnum ml-1 rounded px-1.5 py-0.5 text-xs font-bold ${
                                  scorePct >= 75
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : scorePct >= 40
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}>
                                  {scorePct}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="tnum text-xs text-slate-500 dark:text-slate-400">
                          {a.submittedAt
                            ? `${new Date(a.submittedAt).toLocaleDateString()} at ${new Date(a.submittedAt).toLocaleTimeString()}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {isCompleted ? (
                            <Link
                              href={`/teacher/students/${studentId}/attempts/${a.attemptId}`}
                              className={buttonClass('primary', 'sm')}
                              title="Review full student responses, solutions, and diagnostics"
                            >
                              <Eye className="size-3.5" />
                              <span>View Response &amp; Solutions</span>
                            </Link>
                          ) : (
                            <span className="text-xs italic text-slate-400">
                              Not submitted
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}
    </div>

    {/* Delete Student Confirm Dialog */}
    <ConfirmDialog
      isOpen={deleteConfirmOpen}
      onClose={() => !deleteSubmitting && setDeleteConfirmOpen(false)}
      onConfirm={handleDeleteStudent}
      title={`Delete ${student?.fullName}?`}
      description={`This will permanently delete ${student?.fullName} (${student?.username}) and all their test attempts, exam history, and scores. This action cannot be undone.`}
      confirmText={deleteSubmitting ? 'Deleting…' : 'Delete Permanently'}
      tone="danger"
    />
    </>
  );
}
