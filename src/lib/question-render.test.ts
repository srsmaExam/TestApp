import { describe, expect, it } from 'vitest';
import { extractAllImageTokens, extractImageTokens, parseBody } from './question-render';

describe('extractImageTokens', () => {
  it('finds every unique [[IMG:id]] token', () => {
    expect(extractImageTokens('see [[IMG:a]] and [[IMG:b]] and [[IMG:a]] again')).toEqual(['a', 'b']);
  });

  it('returns an empty array when there are none', () => {
    expect(extractImageTokens('plain text with $x^2$ math only')).toEqual([]);
  });
});

describe('extractAllImageTokens', () => {
  it('finds a token that lives only inside an option, not the body', () => {
    expect(extractAllImageTokens('Match the column:', ['[[IMG:opt_a]]', 'plain text'])).toEqual(['opt_a']);
  });

  it('merges body and option tokens without duplicates', () => {
    expect(extractAllImageTokens('see [[IMG:fig1]]', ['[[IMG:fig1]]', '[[IMG:fig2]]'])).toEqual(['fig1', 'fig2']);
  });

  it('returns an empty array when neither body nor options reference an image', () => {
    expect(extractAllImageTokens('plain body', ['plain option'])).toEqual([]);
  });

  it('finds a token that lives inside the solution', () => {
    expect(extractAllImageTokens('plain body', ['plain option'], 'see step 2 in [[IMG:sol_fig1]]')).toEqual(['sol_fig1']);
  });

  it('merges body, option, and solution tokens without duplicates', () => {
    expect(
      extractAllImageTokens('[[IMG:fig1]]', ['[[IMG:fig2]]'], '[[IMG:fig1]] and [[IMG:fig3]]'),
    ).toEqual(['fig1', 'fig2', 'fig3']);
  });
});

describe('parseBody', () => {
  it('splits text, inline math, display math, and image tokens in order', () => {
    const segments = parseBody('before $x^2$ middle $$\\int x\\,dx$$ [[IMG:fig1]] after');
    expect(segments).toEqual([
      { kind: 'text', text: 'before ' },
      { kind: 'math', tex: 'x^2', display: false },
      { kind: 'text', text: ' middle ' },
      { kind: 'math', tex: '\\int x\\,dx', display: true },
      { kind: 'text', text: ' ' },
      { kind: 'image', placeholderId: 'fig1' },
      { kind: 'text', text: ' after' },
    ]);
  });

  it('does not let $$ display math get split by the inline-$ pattern', () => {
    const segments = parseBody('$$a + b$$');
    expect(segments).toEqual([{ kind: 'math', tex: 'a + b', display: true }]);
  });

  it('passes plain text through untouched when there is no math or image', () => {
    expect(parseBody('just plain text')).toEqual([{ kind: 'text', text: 'just plain text' }]);
  });

  it('correctly parses a markdown distribution table surrounded by text', () => {
    const raw = `For the following distribution:

| Class | Frequency |
| :--- | :--- |
| 0-5 | 10 |
| 5-10 | 15 |
| 10-15 | 12 |
| 15-20 | 20 |
| 20-25 | 9 |

The sum of lower limits of median class and modal class is`;

    const segments = parseBody(raw);
    expect(segments).toEqual([
      { kind: 'text', text: 'For the following distribution:' },
      {
        kind: 'table',
        headers: ['Class', 'Frequency'],
        alignments: ['left', 'left'],
        rows: [
          ['0-5', '10'],
          ['5-10', '15'],
          ['10-15', '12'],
          ['15-20', '20'],
          ['20-25', '9'],
        ],
      },
      { kind: 'text', text: 'The sum of lower limits of median class and modal class is' },
    ]);
  });

  it('correctly parses table with mixed alignments and inline math', () => {
    const raw = `| Column A | Column B | Column C |
| :--- | :---: | ---: |
| Left | Center | Right |
| $x_1$ | $\\alpha$ | 100 |`;

    const segments = parseBody(raw);
    expect(segments).toEqual([
      {
        kind: 'table',
        headers: ['Column A', 'Column B', 'Column C'],
        alignments: ['left', 'center', 'right'],
        rows: [
          ['Left', 'Center', 'Right'],
          ['$x_1$', '$\\alpha$', '100'],
        ],
      },
    ]);
  });
});

