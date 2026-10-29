import { afterEach, describe, expect, it, vi } from 'vitest';
import { labBridge } from '../../src/review/bridges';
import { LAB_ALL_FLOWS } from '../../src/current/data';

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
    const flowId = LAB_ALL_FLOWS[0].id;
    const labOpen = vi.fn();
    const labPlan = vi.fn();
    const lab = {
      state: { lab: { cur: flowId } },
      world: () => ({ plan: 'basic' }),
      labOpen,
      labPlan
    };
    setPrototype('current', lab);

    const bridge = labBridge();
    expect(bridge?.proto).toBe('current');
    expect(bridge?.current()).toEqual({ flow: flowId, plan: 'free' });
    expect(bridge?.select(flowId, 'premium')).toBe(true);
    expect(labOpen).toHaveBeenCalledExactlyOnceWith(flowId);
    expect(labPlan).toHaveBeenCalledExactlyOnceWith('premium');
    expect(bridge?.select('missing')).toBe(false);
  });

  it('validates known flows without an instance list and returns false without __lab', () => {
    const flowId = LAB_ALL_FLOWS[0].id;
    const labOpen = vi.fn();
    setPrototype('current', { labOpen });
    expect(labBridge()?.select(flowId)).toBe(true);
    expect(labOpen).toHaveBeenCalledExactlyOnceWith(flowId);

    expect(labBridge()?.select('missing')).toBe(false);

    setPrototype('current');
    expect(labBridge()?.select(flowId)).toBe(false);
  });
});
