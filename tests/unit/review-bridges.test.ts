import { afterEach, describe, expect, it, vi } from 'vitest';
import { labBridge } from '../../src/review/bridges';

afterEach(() => vi.unstubAllGlobals());

function setPrototype(proto: 'concept' | 'current', lab?: unknown) {
  vi.stubGlobal('document', { documentElement: { dataset: { proto } } });
  vi.stubGlobal('window', { __lab: lab });
}

describe('review bridge for concept', () => {
  it('reads current flow and plan and selects an existing flow', () => {
    const labSelect = vi.fn();
    const lab = {
      state: { flow: 'famplan', labPlan: 'free', simPlan: 'premium' },
      world: () => ({ plan: 'premium' }),
      labFlows: () => [{ id: 'famplan' }],
      labSelect
    };
    setPrototype('concept', lab);

    const bridge = labBridge();
    expect(bridge?.proto).toBe('concept');
    expect(bridge?.current()).toEqual({ flow: 'famplan', plan: 'premium' });
    expect(bridge?.select('famplan', 'free')).toBe(true);
    expect(labSelect).toHaveBeenCalledExactlyOnceWith({ id: 'famplan' }, { plan: 'free' });
    expect(bridge?.select('missing')).toBe(false);
  });
});

describe('review bridge for current', () => {
  it('reads current flow and plan, opens a known flow, and applies its plan', () => {
    const labOpen = vi.fn();
    const labPlan = vi.fn();
    const lab = {
      state: { lab: { cur: 'flow-1' } },
      world: () => ({ plan: 'basic' }),
      labAllFlows: () => [{ id: 'flow-1' }],
      labOpen,
      labPlan
    };
    setPrototype('current', lab);

    const bridge = labBridge();
    expect(bridge?.proto).toBe('current');
    expect(bridge?.current()).toEqual({ flow: 'flow-1', plan: 'free' });
    expect(bridge?.select('flow-1', 'premium')).toBe(true);
    expect(labOpen).toHaveBeenCalledExactlyOnceWith('flow-1');
    expect(labPlan).toHaveBeenCalledExactlyOnceWith('premium');
    expect(bridge?.select('missing')).toBe(false);
  });

  it('tries labOpen when the flow list is unavailable and returns false without __lab', () => {
    const labOpen = vi.fn();
    setPrototype('current', { labOpen });
    expect(labBridge()?.select('flow-2')).toBe(true);
    expect(labOpen).toHaveBeenCalledExactlyOnceWith('flow-2');

    setPrototype('current');
    expect(labBridge()?.select('flow-2')).toBe(false);
  });
});
