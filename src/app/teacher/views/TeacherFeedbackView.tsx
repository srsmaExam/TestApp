'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  FileText,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/Dialog';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Select,
  Spinner,
} from '@/components/ui';

type FeedbackItem = {
  id: string;
  studentId: string;
  studentName: string | null;
  studentPhone: string | null;
  studentBatch: string | null;
  studentClassLevel: string | null;
  testId: string | null;
  testTitle: string | null;
  attemptId: string | null;
  testRating: number | null;
  reportRating: number | null;
  feedbackText: string | null;
  sourceTab: string | null;
  createdAt: string;
  updatedAt: string;
};

export function TeacherFeedbackView() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'report' | 'solutions'>('all');
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteFeedback() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      const res = await fetch(`/api/student/feedback?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to delete feedback.');
      }
      setFeedbackList((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete feedback.');
    } finally {
      setDeleting(false);
    }
  }

  async function loadFeedback() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/student/feedback');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to fetch student feedback.');
      }
      const data = await res.json();
      setFeedbackList(data.feedback || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  const stats = useMemo(() => {
    if (feedbackList.length === 0) {
      return { total: 0, avgTest: 0, avgReport: 0, withComments: 0 };
    }
    const testRatings = feedbackList.map((f) => f.testRating).filter((r): r is number => r !== null && r > 0);
    const reportRatings = feedbackList.map((f) => f.reportRating).filter((r): r is number => r !== null && r > 0);
    const withComments = feedbackList.filter((f) => Boolean(f.feedbackText && f.feedbackText.trim())).length;

    const avgTest = testRatings.length > 0 ? (testRatings.reduce((a, b) => a + b, 0) / testRatings.length).toFixed(1) : '—';
    const avgReport = reportRatings.length > 0 ? (reportRatings.reduce((a, b) => a + b, 0) / reportRatings.length).toFixed(1) : '—';

    return {
      total: feedbackList.length,
      avgTest,
      avgReport,
      withComments,
    };
  }, [feedbackList]);

  const filteredList = useMemo(() => {
    return feedbackList.filter((item) => {
      if (ratingFilter !== 'all') {
        const target = Number(ratingFilter);
        const matches = item.testRating === target || item.reportRating === target;
        if (!matches) return false;
      }
      if (sourceFilter !== 'all' && item.sourceTab !== sourceFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.studentName?.toLowerCase().includes(q);
        const matchesPhone = item.studentPhone?.includes(q);
        const matchesTest = item.testTitle?.toLowerCase().includes(q);
        const matchesText = item.feedbackText?.toLowerCase().includes(q);
        return Boolean(matchesName || matchesPhone || matchesTest || matchesText);
      }
      return true;
    });
  }, [feedbackList, ratingFilter, sourceFilter, search]);

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-xs text-slate-400">Not rated</span>;
    return (
      <div className="flex items-center gap-1 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`size-3.5 ${
              star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-slate-700 dark:text-slate-300">{rating}/5</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Student Feedback
            </h1>
            <Badge tone="brand">{stats.total} submissions</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ratings and comments shared by students on their test experience and diagnostic reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadFeedback}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert tone="red" title="Error">
          {error}
        </Alert>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Reviews
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Star className="size-5 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avg Test Rating
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgTest} <span className="text-xs font-normal text-slate-400">/ 5</span></p>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avg Report Rating
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgReport} <span className="text-xs font-normal text-slate-400">/ 5</span></p>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Written Feedback
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.withComments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, phone, test or feedback comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as any)}
            className="text-xs py-1.5 px-3 h-9 w-36"
            aria-label="Filter by rating"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </Select>

          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="text-xs py-1.5 px-3 h-9 w-36"
            aria-label="Filter by source tab"
          >
            <option value="all">All Sources</option>
            <option value="report">Report Tab</option>
            <option value="solutions">Solutions Tab</option>
          </Select>
        </div>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner className="size-8 text-brand-600" />
          <p className="mt-3 text-xs text-slate-500">Loading student feedback...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-8" />}
          title="No student feedback found"
          hint={
            search || ratingFilter !== 'all' || sourceFilter !== 'all'
              ? 'Try adjusting your search filters.'
              : 'No students have submitted ratings or feedback yet.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border border-slate-200 bg-white transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <CardBody className="p-5 space-y-3">
                {/* Header: Student & Test Info */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      <User className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/teacher/students/${item.studentId}`}
                          className="font-bold text-slate-900 hover:text-brand-600 hover:underline dark:text-white dark:hover:text-brand-400"
                        >
                          {item.studentName || 'Student'}
                        </Link>
                        {item.studentBatch && (
                          <Badge tone="slate">{item.studentBatch}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {item.studentPhone && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <Phone className="size-3" />
                            {item.studentPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.testTitle && (
                      <Badge tone="brand" className="max-w-[200px] truncate">
                        {item.testTitle}
                      </Badge>
                    )}
                    <Badge tone={item.sourceTab === 'solutions' ? 'purple' : 'brand'}>
                      {item.sourceTab === 'solutions' ? 'Solutions Page' : 'Report Page'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
                      title="Delete this feedback"
                      aria-label="Delete feedback"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Rating Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 px-3 dark:bg-slate-800/50">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Overall Test Experience:
                    </span>
                    {renderStars(item.testRating)}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 px-3 dark:bg-slate-800/50">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Report Clarity & Helpfulness:
                    </span>
                    {renderStars(item.reportRating)}
                  </div>
                </div>

                {/* Written Feedback Text */}
                {item.feedbackText && (
                  <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Student Comments
                    </p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      "{item.feedbackText}"
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {deleteError && (
        <Alert tone="red" className="mt-4">
          {deleteError}
        </Alert>
      )}

      {/* Delete Feedback Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteFeedback}
        title="Delete Student Feedback?"
        description={`Are you sure you want to delete feedback from ${deleteTarget?.studentName || 'this student'}${deleteTarget?.testTitle ? ` for "${deleteTarget.testTitle}"` : ''}? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting…' : 'Delete Feedback'}
        tone="danger"
      />
    </div>
  );
}
