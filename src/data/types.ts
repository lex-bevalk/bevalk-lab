export type Plan = "free" | "premium";

export interface Escenario {
  plan?: Plan;
  alertsLeft?: number;
  [key: string]: unknown;
}

export interface Flujo {
  id: string;
  label: string;
  group?: string;
  sub?: string;
  scen?: string;
  fam?: string;
  [key: string]: unknown;
}

export interface PasoCaso {
  l: string;
  ok(state: any, context: any): boolean;
}

export interface CasoExtremo {
  id: string;
  t: string;
  d: string;
  cat: string;
  sev: "critical" | "high" | "medium" | "low";
  plans?: Plan[];
  obs?: boolean;
  scen: string;
  trig: string;
  exp: string;
  rec: string;
  end: string;
  ac: string[];
  prep(context: any): void;
  fire?: { label: string; run(context: any): void };
  steps?: PasoCaso[];
  [key: string]: unknown;
}

export interface DatosFlujoLab {
  plans?: Plan[];
  cases?: CasoExtremo[];
  [key: string]: unknown;
}
