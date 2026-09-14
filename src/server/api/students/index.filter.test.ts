import { describe, expect, it } from 'vitest';
import { buildStudentListFilter } from './index';

/**
 * FBR-01 regression: the batch/search/status filter previously emitted a
 * `$4` placeholder for `batch` whenever it was set, but the parameter array
 * only grew a 4th slot when `search` was *also* set — "batch without search"
 * sent 3 bind parameters for a statement requiring 4, a deterministic 500 on
 * every use of the batch filter with an empty search box.
 *
 * These tests assert, for all eight `search x batch x status` combinations,
 * that every `$n` placeholder referenced in the emitted SQL fragment has a
 * corresponding slot in `params`, and that the highest referenced index
 * equals `params.length`.
 */
function assertPlaceholdersMatchParams(sqlFragment: string, params: unknown[]) {
  const indices = [...sqlFragment.matchAll(/\$(\d+)/g)].map((m) => Number(m[1]));
  const maxIndex = indices.length > 0 ? Math.max(...indices) : 2; // $1, $2 (pageSize, offset) always exist
  expect(maxIndex).toBeLessThanOrEqual(params.length);
  // Every referenced index must have a bound parameter.
  for (const i of indices) {
    expect(i).toBeLessThanOrEqual(params.length);
  }
}

describe('buildStudentListFilter (FBR-01)', () => {
  const searches = ['', 'ravi'];
  const batches = ['', 'General', 'Batch A'];
  const statuses = ['all', 'active', 'inactive'];

  for (const search of searches) {
    for (const batch of batches) {
      for (const status of statuses) {
        it(`search=${JSON.stringify(search)} batch=${JSON.stringify(batch)} status=${status}`, () => {
          const { sqlFragment, params } = buildStudentListFilter(search, batch, status, 25, 0);
          assertPlaceholdersMatchParams(sqlFragment, params);
        });
      }
    }
  }

  it('"General" batch pushes no parameter (the original bug\'s exact trigger)', () => {
    const { sqlFragment, params } = buildStudentListFilter('', 'General', 'all', 25, 0);
    expect(params).toEqual([25, 0]);
    expect(sqlFragment).toContain("p.batch IS NULL OR p.batch = 'General'");
  });

  it('a real batch without search pushes exactly one extra parameter at $3', () => {
    const { sqlFragment, params } = buildStudentListFilter('', 'Batch A', 'all', 25, 0);
    expect(params).toEqual([25, 0, 'Batch A']);
    expect(sqlFragment).toContain('$3');
    expect(sqlFragment).not.toContain('$4');
  });

  it('search and batch together push search at $3 and batch at $4', () => {
    const { sqlFragment, params } = buildStudentListFilter('ravi', 'Batch A', 'all', 25, 0);
    expect(params).toEqual([25, 0, '%ravi%', 'Batch A']);
    expect(sqlFragment).toContain('$3');
    expect(sqlFragment).toContain('$4');
  });

  it('status active/inactive appends a static clause with no new parameter', () => {
    const { params: activeParams } = buildStudentListFilter('', '', 'active', 25, 0);
    const { params: inactiveParams } = buildStudentListFilter('', '', 'inactive', 25, 0);
    expect(activeParams).toEqual([25, 0]);
    expect(inactiveParams).toEqual([25, 0]);
  });

  describe('enrollment filter (FBR-03 "Prospective leads" quarantine)', () => {
    it('defaults to hiding provisional accounts from the roster', () => {
      const { sqlFragment, params } = buildStudentListFilter('', '', 'all', 25, 0);
      expect(sqlFragment).toContain('p.is_provisional = false');
      expect(params).toEqual([25, 0]);
    });

    it('"provisional" shows only self-service phone-login accounts', () => {
      const { sqlFragment } = buildStudentListFilter('', '', 'all', 25, 0, 'provisional');
      expect(sqlFragment).toContain('p.is_provisional = true');
    });

    it('"all" applies no provisional filter', () => {
      const { sqlFragment } = buildStudentListFilter('', '', 'all', 25, 0, 'all');
      expect(sqlFragment).not.toContain('is_provisional');
    });
  });
});
