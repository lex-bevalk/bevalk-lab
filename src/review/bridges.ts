import type { CommentProto } from '../comments/constants';

export interface Bridge {
  proto: 'concept' | 'current';
  current(): { flow: string | null; plan: string | null };
  select(flowId: string, plan?: 'free' | 'premium'): boolean;
}

type LabApi = {
  state?: {
    flow?: string | null;
    labPlan?: string | null;
    simPlan?: string | null;
    lab?: { cur?: string | null };
  };
  world?: () => { plan?: string };
  labFlows?: () => Array<{ id: string }>;
  labSelect?: (flow: { id: string }, options?: { plan?: string }) => void;
  labOpen?: (flowId: string) => boolean | void;
  labAllFlows?: () => Array<{ id: string }>;
  labPlan?: (plan: 'free' | 'premium') => void;
};

function conceptBridge(lab: LabApi | undefined): Bridge {
  return {
    proto: 'concept',
    current() {
      try {
        return {
          flow: lab?.state?.flow || null,
          plan: lab?.world?.()?.plan || lab?.state?.labPlan || lab?.state?.simPlan || null
        };
      } catch {
        return { flow: lab?.state?.flow || null, plan: lab?.state?.labPlan || lab?.state?.simPlan || null };
      }
    },
    select(flowId, plan) {
      const flow = lab?.labFlows?.().find(candidate => candidate.id === flowId);
      if (!flow || !lab?.labSelect) return false;
      lab.labSelect(flow, plan ? { plan } : undefined);
      return true;
    }
  };
}

function currentBridge(lab: LabApi | undefined): Bridge {
  return {
    proto: 'current',
    current() {
      try {
        return {
          flow: lab?.state?.lab?.cur || null,
          plan: lab?.world?.()?.plan === 'premium' ? 'premium' : 'free'
        };
      } catch {
        return { flow: lab?.state?.lab?.cur || null, plan: 'free' };
      }
    },
    select(flowId, plan) {
      if (!lab) return false;
      const flows = lab.labAllFlows?.();
      if (flows && !flows.some(flow => flow.id === flowId)) return false;
      const open = lab.labOpen;
      const setPlan = lab.labPlan;
      if (typeof open !== 'function' || (plan && typeof setPlan !== 'function')) return false;
      if (open.call(lab, flowId) === false) return false;
      if (plan) {
        setPlan!.call(lab, plan);
      }
      return true;
    }
  };
}

export function labBridge(): Bridge | undefined {
  const lab = (window as unknown as { __lab?: LabApi }).__lab;
  const proto = document.documentElement.dataset.proto as CommentProto | undefined;
  if (proto === 'concept') return conceptBridge(lab);
  if (proto === 'current') return currentBridge(lab);
  return undefined;
}
