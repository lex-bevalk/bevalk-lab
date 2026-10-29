import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LAB_ALL_FLOWS } from '../../src/current/data';
import { LabLogic } from '../../src/current/logic/LabLogic';
import { defaultProps } from '../../src/current/props';

function attachHost(logic: any) {
  logic.__host = {
    __setLogicState(update: any, callback?: () => void) {
      const patch = typeof update === 'function' ? update(logic.state) : update;
      logic.state = { ...logic.state, ...(patch || {}) };
      logic.componentDidUpdate(logic.props);
      callback?.();
    },
    forceUpdate(callback?: () => void) { callback?.(); }
  };
  return logic;
}

function setupLogic() {
  const logic = attachHost(new LabLogic({ ...defaultProps }));
  logic.componentDidMount();
  return logic;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('document', {
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => [])
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('lógica extraída de Current', () => {
  it('monta y renderiza los 63 flujos al abrirlos', () => {
    expect(LAB_ALL_FLOWS).toHaveLength(63);
    for (const flow of LAB_ALL_FLOWS) {
      const logic = setupLogic();
      expect(() => {
        logic.labOpen(flow.id);
        logic.renderVals();
      }, flow.id).not.toThrow();
      expect(logic.state.lab.cur, flow.id).toBe(flow.id);
    }
  });

  it('cambia el plan visible entre premium y free', () => {
    const logic = setupLogic();
    logic.labPlan('premium');
    expect(logic.world().plan).toBe('premium');
    logic.labPlan('free');
    expect(logic.world().plan).toBe('free');
  });

  it('ejecuta casos de tres flujos distintos y llega a su pantalla', () => {
    const cases = [
      { flowId: 'A01', caseId: 'login', screen: 'auth' },
      { flowId: 'A04', caseId: 'calculo', screen: 'bienvenida' },
      { flowId: 'F10', caseId: 'pendiente', screen: 'familia' }
    ];
    for (const item of cases) {
      const flow = LAB_ALL_FLOWS.find(candidate => candidate.id === item.flowId);
      expect(flow, item.flowId).toBeTruthy();
      const scenario = flow!.casos.find(candidate => candidate.caso === item.caseId);
      expect(scenario?.tipo, `${item.flowId}.${item.caseId}`).toBe('Ejecutable');
      const logic = setupLogic();
      logic.labOpen(item.flowId, scenario!.caso);
      expect(logic.state.screen, `${item.flowId}.${item.caseId}`).toBe(item.screen);
      expect(() => logic.renderVals(), `${item.flowId}.${item.caseId}`).not.toThrow();
    }
  });
});
