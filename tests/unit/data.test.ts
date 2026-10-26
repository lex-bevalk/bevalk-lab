import { describe, it } from 'vitest';
import * as generatedData from '../../src/data';
import { assertEquivalent, evaluateGeneratedData, evaluateReferenceData, normalizeRuntime } from './reference-data';

const reference = evaluateReferenceData();
const generatedSource = evaluateGeneratedData(reference.names);

describe('datos portados desde Main.dc.html', () => {
  it('exporta todas las declaraciones originales', () => {
    for (const name of reference.names) {
      if (!(name in generatedData)) throw new Error(`Falta exportar ${name}`);
    }
  });

  for (const name of reference.names) {
    it(`${name} conserva el valor de la referencia`, () => {
      assertEquivalent(generatedSource[name], reference.data[name], name);
      expectRuntimeValue(name);
    });
  }
});

function expectRuntimeValue(name: string) {
  const actual = (generatedData as Record<string, unknown>)[name];
  assertEquivalent(normalizeRuntime(actual), normalizeRuntime(generatedSource[name]), `${name} runtime`);
}
