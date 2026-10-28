import { describe, expect, it } from 'vitest';
import * as generatedData from '../../src/data';
import { assertEquivalent, evaluateGeneratedData, evaluateReferenceData, normalizeRuntime } from './reference-data';

const reference = evaluateReferenceData();
const generatedSource = evaluateGeneratedData(reference.names);

describe('datos portados desde Main.dc.html', () => {
  it('publica los 36 flujos de Mi Familia en los 8 grupos v1.6.0', () => {
    const flows = generatedData.FLOWS.filter(flow => flow.id.startsWith('fam'));
    expect(flows).toHaveLength(36);
    expect(new Set(flows.map(flow => flow.group)).size).toBe(8);
    expect(flows.every(flow => !!flow.label && !!flow.sub && !!flow.tip)).toBe(true);
    expect(generatedData.FAM_MEMBERS_CALM).toHaveLength(3);
    expect(generatedData.FAM_LOSE_MEMBER).toHaveLength(5);
    expect(generatedData.FAM_LOSE_ADMIN).toHaveLength(5);
  });

  it('conserva los 19 casos históricos de los nueve flujos familiares', () => {
    const historical: Record<string, string[]> = {
      famoferta:['c1','c2'], famcrear:['c1','c2'], famadmin:['c1','c2','c3'], famavisar:['c1','c2'],
      famficha:['c1','c2'], famajustes:['c1','c2'], faminvite:['c1','c2'], fammember:['c1'], famayuda:['c1','c2','c3']
    };
    for (const [flowId, ids] of Object.entries(historical)) {
      const cases = generatedData.LAB[flowId].cases;
      expect(cases.slice(0, ids.length).map((item: any) => item.id), flowId).toEqual(ids);
      for (const caseId of ids) expect(generatedData.LAB_QA.cases[`${flowId}.${caseId}`], `${flowId}.${caseId}`).toBe(true);
    }
    expect(generatedData.LAB.famadmin.cases[1].sev).toBe('critical');
    expect(generatedData.LAB_AC_BY.famadmin).toEqual(['c2','c1','c2','c3']);
  });

  it('exporta todas las declaraciones originales', () => {
    for (const name of reference.names) {
      if (!(name in generatedData)) throw new Error(`Falta exportar ${name}`);
    }
  });

  for (const name of reference.names) {
    it(`${name} conserva el valor de la referencia`, () => {
      if (name === 'FAM0') {
        expect(generatedData.FAM0()).toMatchObject({ mem:{ending:false}, hidden:{} });
        expectRuntimeValue(name);
        return;
      }
      if (name === 'FAM_WHY') {
        expect(generatedData.FAM_WHY.safe).toEqual(['No hemos encontrado señales de peligro.','El dominio tiene historial y certificado válido.']);
        expectRuntimeValue(name);
        return;
      }
      let actual: any = generatedSource[name];
      let expected: any = reference.data[name];
      if (name === 'FLOWS') {
        actual = actual.filter((flow: any) => !flow.id.startsWith('fam'));
        expected = expected.filter((flow: any) => !flow.id.startsWith('fam'));
      } else if (name === 'LAB' || name === 'LAB_AC_BY') {
        const familyIds = new Set(['famdescubre','famdescubrean','famoferta','famcrear','famcalma','famadmin','famficha','famavisar','famfichapep','faminvitar','famajustes','famretirar','famplan','fambaja','famcancelado','faminvite','fammember','famayuda','famayudaan','famcomparto','famverlucia','famplanmiembro','famsalir','famtermina','famfuera','famcerrar','famtienda','fampendiente','famlleno','famunido','famterminado','famterminadomiembro','famcaducada','fampremiumpropio','famretirado','fameliminar']);
        actual = Object.fromEntries(Object.entries(actual).filter(([key]) => !familyIds.has(key)));
        expected = Object.fromEntries(Object.entries(expected).filter(([key]) => !familyIds.has(key)));
      } else if (name === 'LAB_QA') {
        const keepNonFamily = (value: any) => ({ ac:value.ac, cases:Object.fromEntries(Object.entries(value.cases).filter(([key]) => !key.startsWith('fam'))) });
        actual = keepNonFamily(actual);
        expected = keepNonFamily(expected);
      }
      assertEquivalent(actual, expected, name);
      expectRuntimeValue(name);
    });
  }
});

function expectRuntimeValue(name: string) {
  const actual = (generatedData as Record<string, unknown>)[name];
  assertEquivalent(normalizeRuntime(actual), normalizeRuntime(generatedSource[name]), `${name} runtime`);
}
