'use client';

import 'katex/contrib/mhchem';
import katex from 'katex';
import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { parseBody, parseInline, type TableSegment } from '@/lib/question-render';

/** Renders a single LaTeX expression. Throws are caught and shown inline as a
 * red error rather than blowing up the whole page — the editor's live preview
 * (stage 5) relies on being able to catch this per-expression. */
export function KatexSpan({ tex, display = false }: { tex: string; display?: boolean }) {
  const result = useMemo(() => {
    try {
      const html = katex.renderToString(tex, {
        displayMode: display,
        throwOnError: true,
        strict: 'warn',
        trust: false,
      });
      return { ok: true as const, html };
    } catch (err) {
      return { ok: false as const, message: (err as Error).message };
    }
  }, [tex, display]);

  if (!result.ok) {
    return (
      <span
        className="rounded bg-red-50 px-1 font-mono text-xs text-red-700 ring-1 ring-inset ring-red-200"
        title={result.message}
      >
        LaTeX error: {tex}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'max-w-full align-middle [scrollbar-width:thin]',
        display ? 'block my-2 overflow-x-auto' : 'inline-block overflow-x-auto',
      )}
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  );
}

export type ImageResolver = (placeholderId: string) => React.ReactNode;

function InlineCellContent({ text, renderImage }: { text: string; renderImage: ImageResolver }) {
  const parts = useMemo(() => parseInline(text), [text]);
  return (
    <>
      {parts.map((p, idx) => {
        if (p.kind === 'math') return <KatexSpan key={idx} tex={p.tex} display={p.display} />;
        if (p.kind === 'image') return <span key={idx}>{renderImage(p.placeholderId)}</span>;
        return <span key={idx}>{p.text}</span>;
      })}
    </>
  );
}

function RenderedTable({
  table,
  renderImage,
}: {
  table: TableSegment;
  renderImage: ImageResolver;
}) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-950">
      <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
          <tr>
            {table.headers.map((h, hIdx) => {
              const align = table.alignments[hIdx] || 'left';
              return (
                <th
                  key={hIdx}
                  scope="col"
                  className={cn(
                    'border-b border-slate-200 px-3.5 py-2.5 font-semibold whitespace-normal dark:border-slate-800',
                    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  <InlineCellContent text={h} renderImage={renderImage} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {table.rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
            >
              {row.map((cell, cIdx) => {
                const align = table.alignments[cIdx] || 'left';
                return (
                  <td
                    key={cIdx}
                    className={cn(
                      'px-3.5 py-2 text-slate-700 whitespace-normal dark:text-slate-300',
                      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    <InlineCellContent text={cell} renderImage={renderImage} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders a full question `body`: plain text passed through as-is (whitespace-pre-wrap,
 * line breaks), $inline$ and $$display$$ math via KaTeX, [[IMG:id]] placeholders
 * via the caller-supplied resolver, and structured markdown tables.
 */
export function QuestionBody({
  body,
  renderImage,
  className,
}: {
  body: string;
  renderImage: ImageResolver;
  className?: string;
}) {
  const segments = useMemo(() => parseBody(body), [body]);

  return (
    <div className={`q-render whitespace-pre-wrap break-words min-w-0 max-w-full overflow-hidden ${className ?? ''}`}>
      {segments.map((seg, i) => {
        if (seg.kind === 'math') return <KatexSpan key={i} tex={seg.tex} display={seg.display} />;
        if (seg.kind === 'image') return <span key={i}>{renderImage(seg.placeholderId)}</span>;
        if (seg.kind === 'table') return <RenderedTable key={i} table={seg} renderImage={renderImage} />;
        return <span key={i}>{seg.text}</span>;
      })}
    </div>
  );
}

