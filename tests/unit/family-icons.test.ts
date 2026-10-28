import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('iconos de Mi Familia', () => {
  it('resuelve los iconos literales de plantilla y lógica en el mapa estático', () => {
    const template = read('mi-familia-lab/Lab.dc.html');
    const sourceTemplate = read('design/familia/Main.dc.html');
    const main = read('handoff/reference/project/Main.dc.html');
    const logic = read('src/logic/LabLogic.ts');
    const family = read('src/data/family.ts');
    const iconSource = read('src/ui/Icon.tsx');
    const familyTemplate = [
      template.slice(template.indexOf('data-screen-label="Inicio"'), template.indexOf('data-screen-label="Acceso"')),
      template.slice(template.indexOf('data-screen-label="Perfil"'), template.indexOf('data-screen-label="Analizador"')),
      template.slice(template.indexOf('data-screen-label="Analizador"'), template.indexOf('data-screen-label="Mi Familia"')),
      template.slice(template.indexOf('data-screen-label="Mi Familia"'), template.indexOf('data-screen-label="Acceso"', template.indexOf('data-screen-label="Mi Familia"'))),
      template.slice(template.indexOf('fam.sh.visible')),
    ].join('\n');
    const mainFamilyTemplate = main.split(/data-screen-label="Mi Familia"/).slice(1).join('data-screen-label="Mi Familia"');
    const used = new Set<string>();
    for (const source of [familyTemplate, mainFamilyTemplate, sourceTemplate]) {
      for (const match of source.matchAll(/data-icon="([a-z0-9-]+)"/g)) used.add(match[1]);
    }
    for (const source of [logic, family]) {
      for (const match of source.matchAll(/icon\s*:\s*"([a-z0-9-]+)"/g)) used.add(match[1]);
    }
    const available = new Set([...iconSource.matchAll(/^\s*"([a-z0-9-]+)"\s*:/gm)].map(match => match[1]));
    const missing = [...used].filter(name => !available.has(name)).sort();
    expect(missing, `iconos sin resolver: ${missing.join(', ')}`).toEqual([]);
  });

  it('detecta un icono inexistente como control negativo', () => {
    const iconSource = read('src/ui/Icon.tsx');
    const available = new Set([...iconSource.matchAll(/^\s*"([a-z0-9-]+)"\s*:/gm)].map(match => match[1]));
    const negativeControl = 'f13-icono-inexistente';
    expect(available.has(negativeControl)).toBe(false);
    expect([negativeControl].filter(name => !available.has(name))).toEqual([negativeControl]);
  });
});
