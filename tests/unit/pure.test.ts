import assert from 'node:assert/strict';
import { describe, expect, it } from 'vitest';
import { FLOWS, LAB, SCEN } from '../../src/data';
import { labTrack, planWorld, scoreColor } from '../../src/logic/pure';
import { evaluateReferenceData } from './reference-data';

const original = evaluateReferenceData().data;

describe('planWorld', () => {
  it('compone Premium con 99 avisos sin activar vigilancia ni mutar el mundo de entrada', () => {
    const source = { plan: 'free', alertsLeft: 4, vig: { email: 0 } };
    const before = structuredClone(source);
    const result = planWorld(source, 'premium');
    expect(result).toEqual({ plan: 'premium', alertsLeft: 99, vig: { email: 0 } });
    expect(source).toEqual(before);
    expect(result).not.toBe(source);
  });

  it('restaura cuatro avisos al volver a Freemium', () => {
    expect(planWorld({ plan: 'premium', alertsLeft: 99 }, 'free')).toEqual({ plan: 'free', alertsLeft: 4 });
  });

  it('conserva las asignaciones de plan al añadir los 36 flujos de Mi Familia', () => {
    const familyIds = ['famdescubre','famdescubrean','famoferta','famcrear','famtienda','fampendiente','famcalma','famadmin','famficha','famavisar','famfichapep','famunido','faminvitar','famajustes','famretirar','famlleno','famplan','fambaja','famcancelado','famterminado','fameliminar','faminvite','famcaducada','fampremiumpropio','fammember','famayuda','famayudaan','famcomparto','famverlucia','famplanmiembro','famsalir','famtermina','famfuera','famterminadomiembro','famretirado','famcerrar'];
    expect(FLOWS.filter(flow => flow.id.startsWith('fam')).map(flow => flow.id)).toEqual(familyIds);
    expect([...new Set(FLOWS.filter(flow => flow.id.startsWith('fam')).map(flow => flow.group))]).toEqual([
      'Mi Familia · descubrir y contratar', 'Mi Familia · quien gestiona, día a día', 'Mi Familia · quien gestiona, el grupo',
      'Mi Familia · quien gestiona, plan y baja', 'Mi Familia · persona invitada', 'Mi Familia · miembro, día a día',
      'Mi Familia · miembro, plan y salida', 'Mi Familia · avisos de Inicio'
    ]);
    expect(FLOWS.filter(flow => LAB[flow.id]?.plans?.length === 1 && LAB[flow.id].plans[0] === 'free').map(flow => flow.id))
      .toEqual(['nuevo','registro','bienvenida','dia1','tema1','tope','famdescubre','famdescubrean','famoferta','famtienda','fampendiente','famterminado','faminvite','famcaducada','famfuera','famterminadomiembro','famretirado']);
    expect(FLOWS.filter(flow => LAB[flow.id]?.plans?.length === 1 && LAB[flow.id].plans[0] === 'premium').map(flow => flow.id))
      .toEqual(['nvborrado','premnuevo','premmitad','premmax','famcrear','famcalma','famadmin','famficha','famavisar','famfichapep','famunido','faminvitar','famajustes','famretirar','famlleno','famplan','fambaja','famcancelado','fameliminar','fampremiumpropio','fammember','famayuda','famayudaan','famcomparto','famverlucia','famplanmiembro','famsalir','famtermina']);
  });

  it('mantiene SCEN intacto al componer mundos derivados', () => {
    const before = JSON.stringify(SCEN);
    for (const scenario of Object.values(SCEN)) {
      planWorld({ ...(scenario as any), base: { ...((scenario as any).base || {}) } }, 'free');
      planWorld({ ...(scenario as any), base: { ...((scenario as any).base || {}) } }, 'premium');
    }
    expect(JSON.stringify(SCEN)).toBe(before);
  });
});

describe('labTrack', () => {
  const steps = [
    { l: 'primero', ok: (state: any) => !!state.first },
    { l: 'segundo', ok: (state: any) => !!state.second }
  ];

  it('no marca pasos al preparar ni cuando el predicado aún no se ha visto falso', () => {
    const lab = { case: 'c1', prepping: true, reached: { 0: 1 }, armed: {} };
    expect(labTrack({ first: true, second: true }, lab, { steps }, {})).toBeNull();
    expect(labTrack({ first: true, second: true }, { ...lab, prepping: false }, { steps }, {})).toBeNull();
  });

  it('arma al observar falso y marca cada paso solo después de su predecesor', () => {
    const currentCase = { steps };
    const initial = { case: 'c1', prepping: false, reached: { 0: 1 }, armed: {} };
    const armed = labTrack({ first: false, second: false }, initial, currentCase, {});
    assert.deepStrictEqual(armed?.armed, { 1: 1, 2: 1 });
    expect(armed?.reached).toEqual({ 0: 1 });

    const firstDone = labTrack({ first: true, second: false }, armed, currentCase, {});
    expect(firstDone?.reached).toEqual({ 0: 1, 1: 1 });
    const bothDone = labTrack({ first: true, second: true }, firstDone, currentCase, {});
    expect(bothDone?.reached).toEqual({ 0: 1, 1: 1, 2: 1 });
  });
});

describe('scoreColor', () => {
  it('respeta los tramos de color descritos en lessons.md', () => {
    expect([18, 25, 43, 50, 68, 75].map(score => scoreColor(score, 'ring')))
      .toEqual(['#DC2626', '#F97316', '#F97316', '#EAB308', '#EAB308', '#16A34A']);
    expect(scoreColor(19, 'ring')).not.toBe('#DC2626');
    expect(scoreColor(24, 'ring')).not.toBe('#F97316');
    expect(scoreColor(44, 'ring')).not.toBe('#F97316');
    expect(scoreColor(49, 'ring')).not.toBe('#EAB308');
    expect(scoreColor(69, 'ring')).not.toBe('#EAB308');
    expect(scoreColor(74, 'ring')).not.toBe('#16A34A');
  });

  it('coincide con la función original entre 0 y 100 para ambos usos', () => {
    const referenceScoreColor = original.scoreColor as (score: number, kind?: string) => string;
    for (const kind of ['ring', 'text']) {
      for (let score = 0; score <= 100; score++) {
        expect(scoreColor(score, kind)).toBe(referenceScoreColor(score, kind));
      }
    }
  });
});
