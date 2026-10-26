import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProps } from '../../src/props';
import { LabLogic } from '../../src/logic/LabLogic';
import { FLOWS, LAB, SCEN } from '../../src/data';
import { createReferenceLogic } from './reference-data';

type CaseAction = (logic: any) => void;

function setupLogic() {
  const logic = attachHost(new LabLogic({ ...defaultProps }));
  logic.componentDidMount();
  return logic;
}

function setupReference() {
  const logic = attachHost(createReferenceLogic({
    window: globalThis.window,
    document: globalThis.document,
    setTimeout,
    clearTimeout
  }, { ...defaultProps }));
  logic.componentDidMount();
  return logic;
}

function attachHost(logic: any) {
  logic.__host = {
    __setLogicState(update: any, callback?: () => void) {
      const current = logic.state;
      const patch = typeof update === 'function' ? update(current) : update;
      logic.state = { ...current, ...(patch || {}) };
      logic.componentDidUpdate(logic.props);
      callback?.();
    },
    forceUpdate(callback?: () => void) { callback?.(); }
  };
  return logic;
}

function prepare(logic: any, flowId: string, caseId: string) {
  const flow = logic.labFlows().find(item => item.id === flowId);
  if (!flow) throw new Error(`No existe el flujo ${flowId}`);
  logic.labSelect(flow);
  logic.labStartCase(caseId);
}

async function runJsActions(logic: any, reference: any, actions: CaseAction[]) {
  for (const action of actions) {
    action(logic);
    action(reference);
    await vi.advanceTimersByTimeAsync(260);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });
  vi.stubGlobal('document', {
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    getElementById: vi.fn(() => null)
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('LabLogic smoke sin DOM', () => {
  it('conserva la preferencia al entrar y salir de un flujo con plan fijado', () => {
    const logic = setupLogic();
    logic.labSetSimPlan('premium');
    const freeFlow = logic.labFlows()[0];
    logic.labSelect(freeFlow);
    expect(logic.state.labPlan).toBe('premium');
    expect(logic.world().plan).toBe('free');

    const flexibleFlow = logic.labFlows().find(flow => logic.labAllowed(flow).length === 2);
    logic.labSelect(flexibleFlow);
    expect(logic.state.labPlan).toBe('premium');
    expect(logic.world().plan).toBe('premium');
  });

  it('reinicia los flujos que cambian de escenario o rol entre planes', async () => {
    const variants = [
      { kind: 'alt', flow: FLOWS.find(flow => LAB[flow.id]?.alt) },
      { kind: 'famByPlan', flow: FLOWS.find(flow => LAB[flow.id]?.famByPlan) }
    ];
    for (const variant of variants) {
      const logic = setupLogic();
      const flow = variant.flow;
      if (!flow) throw new Error(`Falta un flujo ${variant.kind}`);
      logic.labSelect(flow);
      const plan = logic.world().plan === 'premium' ? 'free' : 'premium';
      logic.labPickPlan(plan);
      await vi.advanceTimersByTimeAsync(0);

      expect(logic.state.labPlan).toBe(plan);
      expect(logic.state.lab.notice).toContain('reiniciado');
      if (variant.kind === 'alt') expect(logic.state.scen).toBe(LAB[flow.id].alt[plan] || flow.scen);
      else expect(logic.state.fam.role).toBe(LAB[flow.id].famByPlan[plan]);
    }
  });

  it('Premium no crea administración familiar y unirse al grupo activa Premium', () => {
    const logic = setupLogic();
    logic.labSelect(logic.labFlows()[0]);
    logic.labSetSimPlan('premium');
    expect(logic.state.fam.role).toBe('none');

    logic.state = {
      ...logic.state,
      labPlan: 'free',
      simPlan: 'free',
      world: logic.scenWorld(SCEN['free-recien']),
      fam: {
        ...logic.state.fam,
        join: { ...(logic.state.fam.join || {}), age: true, share: {} },
        mem: { ...(logic.state.fam.mem || {}), share: {}, pets: [] }
      }
    };
    logic.famJoin();
    expect(logic.state.fam.role).toBe('member');
    expect(logic.state.labPlan).toBe('premium');
    expect(logic.world().plan).toBe('premium');
  });

  it('registro.c2 alcanza los tres pasos de referencia', async () => {
    const logic = setupLogic();
    const reference = setupReference();
    await prepare(logic, 'registro', 'c2');
    prepare(reference, 'registro', 'c2');
    await vi.advanceTimersByTimeAsync(700);
    await runJsActions(logic, reference, [
      current => current.auSignup(),
      current => current.auSet({ terms: true }),
      current => current.auSignup()
    ]);
    const count = logic.labCase().steps.length;
    expect(logic.state.lab.reached).toEqual(reference.state.lab.reached);
    expect(logic.state.lab.reached).toEqual({ 0: 1, 1: 1, 2: 1, 3: 1 });
    expect(Object.keys(logic.state.lab.reached).length - 1).toBe(count);
  });

  it('bienvenida.c2 alcanza todos los pasos de referencia', async () => {
    const logic = setupLogic();
    const reference = setupReference();
    prepare(logic, 'bienvenida', 'c2');
    prepare(reference, 'bienvenida', 'c2');
    await vi.advanceTimersByTimeAsync(700);
    await runJsActions(logic, reference, [
      current => current.obSet({ temas: {} }),
      current => current.obNext()
    ]);
    const count = logic.labCase().steps.length;
    expect(logic.state.lab.reached).toEqual(reference.state.lab.reached);
    expect(Object.keys(logic.state.lab.reached).length - 1).toBe(count);
    expect(Object.keys(logic.state.lab.reached).sort()).toEqual(['0', ...Array.from({ length: count }, (_, index) => String(index + 1))].sort());
  });

  it('tope.c2 alcanza los pasos tras los mismos cambios JS de QA', async () => {
    const logic = setupLogic();
    const reference = setupReference();
    prepare(logic, 'tope', 'c2');
    prepare(reference, 'tope', 'c2');
    await vi.advanceTimersByTimeAsync(700);
    await runJsActions(logic, reference, [
      current => current.renderVals().an.buy(),
      current => current.activatePremium('anual'),
      current => current.anAnalyze()
    ]);
    await vi.advanceTimersByTimeAsync(2100);
    const count = logic.labCase().steps.length;
    expect(logic.state.lab.reached).toEqual(reference.state.lab.reached);
    expect(Object.keys(logic.state.lab.reached).length - 1).toBe(count);
    expect(Object.keys(logic.state.lab.reached).sort()).toEqual(['0', ...Array.from({ length: count }, (_, index) => String(index + 1))].sort());
  });
});
