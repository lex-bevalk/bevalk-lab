import { scoreColor } from '../data/score';

export { scoreColor };

export function planWorld<T extends Record<string, any>>(world: T, plan: string | null | undefined): T {
  if (!plan || world.plan === plan) return world;
  return {
    ...world,
    plan,
    alertsLeft: plan === 'premium' ? 99 : 4
  };
}

export function casePredicates(steps: Array<{ ok(state: any, context: any): boolean }> | undefined, state: any, context: any): boolean[] {
  if (!steps) return [];
  return steps.map(step => {
    try {
      return !!step.ok(state, context);
    } catch {
      return false;
    }
  });
}

export function labTrack(state: any, lab: any, currentCase: any, context: any): any | null {
  if (!lab || !lab.case || lab.prepping || !currentCase || !currentCase.steps || !currentCase.steps.length) return null;
  const armed = Object.assign({}, lab.armed);
  const reached = Object.assign({}, lab.reached);
  let changed = false;
  const values = casePredicates(currentCase.steps, state, context);

  values.forEach((value, index) => {
    if (!value && !armed[index + 1]) {
      armed[index + 1] = 1;
      changed = true;
    }
  });
  for (let index = 1; index <= currentCase.steps.length; index++) {
    if (!reached[index] && reached[index - 1] && armed[index] && values[index - 1]) {
      reached[index] = 1;
      changed = true;
    }
  }
  return changed ? Object.assign({}, lab, { armed, reached }) : null;
}
