/** Pure helpers for parsing a question `body` string. No React here, so this
 * is usable from both server routes (the verify gate) and client components
 * (the editor preview) without pulling in a DOM. */

const IMG_TOKEN_RE = /\[\[IMG:([^\]]+)\]\]/g;

export function extractImageTokens(body: string): string[] {
  const ids = [...body.matchAll(IMG_TOKEN_RE)].map((m) => m[1]);
  return [...new Set(ids)];
}

/**
 * A [[IMG:id]] token can appear in the question body OR in an option's body —
 * match-the-column questions routinely put a diagram in one column (LLD §6
 * rule 6), and any option can carry a figure. Every consumer that needs "every
 * placeholder this question references" (ingest validation, the verify gate,
 * the editor's unresolved-image count) must scan both, or an image placeholder
 * living only inside an option silently bypasses whichever check forgot it.
 */
export function extractAllImageTokens(body: string, optionBodies: string[]): string[] {
  return [...new Set([...extractImageTokens(body), ...optionBodies.flatMap(extractImageTokens)])];
}

export type TableAlignment = 'left' | 'center' | 'right';

export type TableSegment = {
  kind: 'table';
  headers: string[];
  alignments: TableAlignment[];
  rows: string[][];
};

export type BodySegment =
  | { kind: 'text'; text: string }
  | { kind: 'math'; tex: string; display: boolean }
  | { kind: 'image'; placeholderId: string }
  | TableSegment;

function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

function parseSeparatorCell(cell: string): TableAlignment | null {
  const c = cell.trim();
  if (!/^:?-{2,}:?$/.test(c)) return null;
  const leftColon = c.startsWith(':');
  const rightColon = c.endsWith(':');
  if (leftColon && rightColon) return 'center';
  if (rightColon) return 'right';
  return 'left';
}

/**
 * Splits text into inline/display math and image tokens.
 */
export function parseInline(text: string): (
  | { kind: 'text'; text: string }
  | { kind: 'math'; tex: string; display: boolean }
  | { kind: 'image'; placeholderId: string }
)[] {
  const segments: (
    | { kind: 'text'; text: string }
    | { kind: 'math'; tex: string; display: boolean }
    | { kind: 'image'; placeholderId: string }
  )[] = [];

  const tokenRe = /((?<!\\)\$\$[\s\S]+?(?<!\\)\$\$|(?<!\\)\$[^$\n]+?(?<!\\)\$|\[\[IMG:[^\]]+\]\])/g;
  const unescape = (t: string) => t.replace(/\\\$/g, '$');

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(text))) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', text: unescape(text.slice(lastIndex, match.index)) });
    }
    const token = match[0];
    if (token.startsWith('[[IMG:')) {
      segments.push({ kind: 'image', placeholderId: token.slice(6, -2) });
    } else if (token.startsWith('$$')) {
      segments.push({ kind: 'math', tex: token.slice(2, -2), display: true });
    } else {
      segments.push({ kind: 'math', tex: token.slice(1, -1), display: false });
    }
    lastIndex = tokenRe.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', text: unescape(text.slice(lastIndex)) });
  }
  return segments;
}

/**
 * Splits a question body into ordered segments: plain text/markdown, $inline$
 * and $$display$$ math, [[IMG:id]] placeholders, and markdown tables. KaTeX renders the math
 * segments; <Katex> (the component) handles that. Kept as a pure string ->
 * data-structure function so it's unit-testable without a DOM.
 */
export function parseBody(body: string): BodySegment[] {
  if (!body) return [];

  const lines = body.split(/\r?\n/);
  const segments: BodySegment[] = [];
  let textBuffer: string[] = [];

  const flushTextBuffer = () => {
    if (textBuffer.length === 0) return;
    const blockText = textBuffer.join('\n');
    textBuffer = [];
    if (blockText.length > 0) {
      segments.push(...parseInline(blockText));
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check if lines[i] and lines[i+1] look like a table header + separator
    if (i + 1 < lines.length && line.includes('|') && lines[i + 1].includes('|')) {
      const headerCells = splitTableRow(line);
      const sepCells = splitTableRow(lines[i + 1]);

      if (headerCells.length >= 2 && sepCells.length === headerCells.length) {
        const alignments = sepCells.map(parseSeparatorCell);
        const isValidTable = alignments.every((a): a is TableAlignment => a !== null);

        if (isValidTable) {
          // Collect consecutive data rows
          let rowIdx = i + 2;
          const rows: string[][] = [];

          while (rowIdx < lines.length) {
            const rowLine = lines[rowIdx];
            if (!rowLine.trim() || !rowLine.includes('|')) break;
            const cells = splitTableRow(rowLine);
            while (cells.length < headerCells.length) cells.push('');
            rows.push(cells.slice(0, headerCells.length));
            rowIdx++;
          }

          if (rows.length > 0) {
            // Trim trailing empty lines from textBuffer before the table
            while (textBuffer.length > 0 && textBuffer[textBuffer.length - 1].trim() === '') {
              textBuffer.pop();
            }
            flushTextBuffer();

            segments.push({
              kind: 'table',
              headers: headerCells,
              alignments: alignments as TableAlignment[],
              rows,
            });

            i = rowIdx;
            // Skip any immediate blank line after the table to prevent excessive spacing
            if (i < lines.length && lines[i].trim() === '') {
              i++;
            }
            continue;
          }
        }
      }
    }

    textBuffer.push(line);
    i++;
  }

  flushTextBuffer();
  return segments;
}

