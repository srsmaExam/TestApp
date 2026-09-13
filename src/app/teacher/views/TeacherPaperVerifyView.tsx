import { eq, inArray, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getDb } from '@/db/client';
import { papers, questions, questionImages } from '@/db/schema';
import { PaperVerifyStudio } from '../papers/[id]/verify/PaperVerifyStudio';

export async function TeacherPaperVerifyView({ paperId }: { paperId: string }) {
  const db = await getDb();

  const [paper] = await db.select().from(papers).where(eq(papers.id, paperId));
  if (!paper) notFound();

  const paperQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, paperId))
    .orderBy(asc(questions.sourceQno), asc(questions.createdAt));

  const questionIds = paperQuestions.map((q) => q.id);
  const images =
    questionIds.length > 0
      ? await db.select().from(questionImages).where(inArray(questionImages.questionId, questionIds))
      : [];

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-var(--app-header-h))] flex-col sm:-mx-6">
      <PaperVerifyStudio initialPaper={paper} initialQuestions={paperQuestions} initialImages={images} />
    </div>
  );
}
