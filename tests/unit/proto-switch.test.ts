import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const speculationEntries = [
  { file: 'index.html', target: '/concept', title: 'BeValk Lab · Current version' },
  { file: 'concept.html', target: '/', title: 'BeValk Lab · Concept' },
  { file: 'review.html', target: '/concept/review', title: 'BeValk Lab · Current version' },
  { file: 'concept-review.html', target: '/review', title: 'BeValk Lab · Concept' }
];

describe('prototype switching documents', () => {
  it.each(speculationEntries)('$file prerenders the other prototype at the selector destination', ({ file, target, title }) => {
    const html = readFileSync(path.join(root, file), 'utf8');
    const script = html.match(/<script\s+type="speculationrules">([\s\S]*?)<\/script>/i)?.[1];

    expect(html.match(/<title>(.*?)<\/title>/i)?.[1]).toBe(title);
    expect(script, `${file} speculation rules`).toBeTruthy();
    expect(JSON.parse(script!)).toEqual({
      prerender: [{ source: 'list', urls: [target], eagerness: 'moderate' }]
    });
  });

  it('uses brief cross-document fades and disables them for reduced motion', () => {
    const css = readFileSync(path.join(root, 'src/proto-switch/proto-switch.css'), 'utf8');
    expect(css).toMatch(/@view-transition\s*\{\s*navigation:\s*auto;\s*\}/);
    expect(css).toContain('view-transition-name: proto-switch;');
    const durations = [...css.matchAll(/animation-duration:\s*([\d.]+)ms/g)].map(match => Number(match[1]));

    expect(durations.length).toBeGreaterThan(0);
    expect(Math.max(...durations)).toBeLessThanOrEqual(200);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none\s*!important;/);
  });
});
