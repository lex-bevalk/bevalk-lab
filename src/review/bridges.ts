import { LAB_ALL_FLOWS } from '../current/data';

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
      if (!LAB_ALL_FLOWS.some(flow => flow.id === flowId)) return false;
      if (typeof lab.labOpen !== 'function') return false;
      if (lab.labOpen(flowId) === false) return false;
      if (plan) {
        if (typeof lab.labPlan !== 'function') return false;
        lab.labPlan(plan);
      }
      return true;
    }
  };
}

export function labBridge(): Bridge | undefined {
  const lab = (window as unknown as { __lab?: LabApi }).__lab;
  if (document.documentElement.dataset.proto === 'concept') return conceptBridge(lab);
  if (document.documentElement.dataset.proto === 'current') return currentBridge(lab);
  return undefined;
}
