import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every `/api/...` URL the client code fetches must correspond to a route
 * handler that actually exists, and every handler must export the verb the
 * caller uses.
 *
 * This exists because two shipped features were broken by nothing more than a
 * wrong path — `/api/tests/:id/start` (the real route is `/attempts`, so no
 * student could ever begin a test) and `/api/analytics/student` (the real route
 * is `/student/me`). Both 404'd, both returned Next's HTML error page, and both
 * surfaced to the user as a JSON parse error. TypeScript cannot see inside a
 * template literal, and the 33 unit tests covered only pure functions, so
 * nothing caught either one.
 */

import { ALL_REGISTERED_ROUTES } from '@/server/api/router';

const ROOT = path.resolve(import.meta.dirname, '../..');
const API_DIR = path.join(ROOT, 'src/app/api');
const SRC_DIR = path.join(ROOT, 'src');

type RouteFile = { urlPattern: RegExp; verbs: Set<string>; file: string };

function walk(dir: string, filter: (name: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, filter));
    else if (filter(entry.name)) out.push(full);
  }
  return out;
}

/** Collect every registered route from the unified API router, with the HTTP verbs it exports. */
function collectRoutes(): RouteFile[] {
  // Sort routes so exact literal paths are matched before parameterized segments (e.g. /questions/bulk before /questions/[id])
  const sorted = [...ALL_REGISTERED_ROUTES].sort((a, b) => {
    const aParamCount = (a.pattern.match(/\[/g) || []).length;
    const bParamCount = (b.pattern.match(/\[/g) || []).length;
    if (aParamCount !== bParamCount) return aParamCount - bParamCount;
    return b.pattern.length - a.pattern.length;
  });

  return sorted.map((r) => {
    const pattern = new RegExp(
      '^' +
        r.pattern
          .split('/')
          .map((seg) => (seg.startsWith('[') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
          .join('/') +
        '$',
    );

    return { urlPattern: pattern, verbs: new Set(r.verbs), file: `src/server/api/router.ts (${r.pattern})` };
  });
}

/** Every distinct /api/... URL referenced from a fetch/href/action in src/. */
function collectReferences(): { url: string; verb: string; file: string }[] {
  const refs: { url: string; verb: string; file: string }[] = [];

  const files = walk(SRC_DIR, (n) => /\.tsx?$/.test(n)).filter((f) => !f.includes('.test.'));

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');

    // fetch(`/api/...`, { method: 'X' })  |  fetch('/api/...')
    for (const m of source.matchAll(/fetch\(\s*[`'"](\/api\/[^`'"]*)[`'"]\s*(?:,\s*(\{[\s\S]{0,300}?\}))?\s*\)/g)) {
      const verbMatch = m[2]?.match(/method:\s*['"](\w+)['"]/);
      refs.push({ url: m[1], verb: (verbMatch?.[1] ?? 'GET').toUpperCase(), file: path.relative(ROOT, file) });
    }

    // navigator.sendBeacon(`/api/...`) — always a POST.
    for (const m of source.matchAll(/sendBeacon\(\s*[`'"](\/api\/[^`'"]*)[`'"]/g)) {
      refs.push({ url: m[1], verb: 'POST', file: path.relative(ROOT, file) });
    }

    // <a href="/api/..."> / <Link href={`/api/...`}> — a plain navigation.
    for (const m of source.matchAll(/href=\{?\s*[`'"](\/api\/[^`'"]*)[`'"]/g)) {
      refs.push({ url: m[1], verb: 'GET', file: path.relative(ROOT, file) });
    }
  }

  return refs;
}

/** `/api/tests/${test.id}/attempts` → `/api/tests/<x>/attempts` */
function normalise(url: string): string {
  return url.replace(/\$\{[^}]*\}/g, '<x>').split('?')[0].replace(/\/$/, '');
}

/**
 * Known-broken references allowlist (empty now that A-1 and A-2 are fixed).
 */
const KNOWN_BROKEN = new Set<string>();

describe('API route references', () => {
  const routes = collectRoutes();
  const references = collectReferences();

  it('finds route handlers and client references to check', () => {
    expect(routes.length).toBeGreaterThan(10);
    expect(references.length).toBeGreaterThan(10);
  });

  it('every fetched /api/ URL resolves to a route handler', () => {
    const broken: string[] = [];

    for (const ref of references) {
      const url = normalise(ref.url);
      if (KNOWN_BROKEN.has(url)) continue;
      if (!routes.some((r) => r.urlPattern.test(url))) {
        broken.push(`${ref.file}: ${ref.verb} ${ref.url} → no route handler`);
      }
    }

    expect(broken, `Broken API references:\n${broken.join('\n')}`).toEqual([]);
  });

  it('every KNOWN_BROKEN entry is still actually broken', () => {
    // Stops the allowlist rotting: once someone fixes the path, this fails and
    // tells them to delete the entry rather than leaving a dead exemption that
    // could mask a future regression on the same URL.
    const stale = [...KNOWN_BROKEN].filter((url) => routes.some((r) => r.urlPattern.test(url)));
    expect(stale, `These are fixed — remove them from KNOWN_BROKEN:\n${stale.join('\n')}`).toEqual([]);
  });

  it('every fetched /api/ URL is served by a handler exporting that verb', () => {
    const broken: string[] = [];

    for (const ref of references) {
      const url = normalise(ref.url);
      const match = routes.find((r) => r.urlPattern.test(url));
      if (!match) continue; // reported by the previous test
      if (!match.verbs.has(ref.verb)) {
        broken.push(
          `${ref.file}: ${ref.verb} ${ref.url} → ${match.file} exports only [${[...match.verbs].join(', ')}]`,
        );
      }
    }

    expect(broken, `Verb mismatches:\n${broken.join('\n')}`).toEqual([]);
  });

  it('enforces Vercel Hobby plan limit with a single unified route handler in src/app/api', () => {
    const appApiRoutes = walk(API_DIR, (n) => n === 'route.ts' || n === 'route.tsx');
    expect(appApiRoutes.length).toBe(1);
    expect(appApiRoutes[0]).toContain('[[...slug]]');
  });
});
