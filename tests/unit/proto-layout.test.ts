import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function declarations(style: string): Record<string, string> {
  return Object.fromEntries(style.split(';').flatMap(part => {
    const separator = part.indexOf(':');
    return separator < 0 ? [] : [[part.slice(0, separator).trim(), part.slice(separator + 1).trim()]];
  }));
}

describe('prototype layout source geometry', () => {
  it('keeps Concept outer spacing and columns aligned with Current', () => {
    const conceptCss = readFileSync(path.join(root, 'src/styles/main.css'), 'utf8');
    const currentHtml = readFileSync(path.join(root, 'design/current/current.html'), 'utf8');
    const conceptRule = conceptCss.match(/\.lab\s*\{([^}]*)\}/)?.[1];
    const currentLabStyle = currentHtml.match(/<div class="lab" style="([^"]*)"/)?.[1];
    const currentGridStyle = currentHtml.match(/<div class="lab-grid" style="([^"]*)"/)?.[1];

    expect(conceptRule, 'Concept .lab rule').toBeTruthy();
    expect(currentLabStyle, 'Current .lab inline style').toBeTruthy();
    expect(currentGridStyle, 'Current .lab-grid inline style').toBeTruthy();

    const concept = declarations(conceptRule!);
    const currentLab = declarations(currentLabStyle!);
    const currentGrid = declarations(currentGridStyle!);

    expect(concept.padding).toBe(currentLab.padding);
    expect(concept.gap).toBe(currentGrid.gap);
    expect(concept['grid-template-columns']).toBe(currentGrid['grid-template-columns']);
  });
});
