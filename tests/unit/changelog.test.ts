import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { changelog, parseChangelog } from '../../src/team/changelog';

const releasedVersions = changelog.filter(version => version.version !== 'Unreleased');

function compareSemverDescending(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return rightParts[index] - leftParts[index];
  }
  return 0;
}

describe('CHANGELOG.md', () => {
  it('parses the real changelog and matches package.json version to its first release', () => {
    expect(changelog.length).toBeGreaterThan(0);
    const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(releasedVersions[0]?.version).toBe(packageJson.version);
  });

  it('keeps published releases in descending SemVer order without duplicates', () => {
    const versions = releasedVersions.map(version => version.version);
    expect(new Set(versions).size).toBe(versions.length);
    expect(versions).toEqual([...versions].sort(compareSemverDescending));
  });

  it('uses valid ISO dates in non-increasing order', () => {
    const dates = releasedVersions.map(version => version.date);
    for (const date of dates) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10)).toBe(date);
    }
    for (let index = 1; index < dates.length; index += 1) {
      expect(dates[index]! <= dates[index - 1]!).toBe(true);
    }
  });

  it('gives every published release at least one item', () => {
    expect(releasedVersions.length).toBeGreaterThan(0);
    for (const version of releasedVersions) {
      expect(version.sections.some(section => section.items.length > 0), version.version).toBe(true);
    }
  });
});

describe('parseChangelog', () => {
  it('reports the source line for unexpected content within a version', () => {
    const input = '# Changelog\n\nIntro text.\n\n## [1.2.3] - 2026-10-27\nTexto inválido';
    expect(() => parseChangelog(input)).toThrow(/línea 6/);
  });

  it('omits an empty Unreleased section', () => {
    expect(parseChangelog('## [Unreleased]\n\n## [1.0.0] - 2026-10-26\n\n### Added\n- Inicio'))
      .toEqual([{ version: '1.0.0', date: '2026-10-26', sections: [{ type: 'Added', items: ['Inicio'] }] }]);
  });

  it('rejects an unknown section type with its source line', () => {
    expect(() => parseChangelog('## [1.0.0] - 2026-10-26\n### Improved\n- Inicio'))
      .toThrow(/línea 2.*desconocido/);
  });
});
