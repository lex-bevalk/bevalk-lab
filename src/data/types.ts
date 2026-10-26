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

export type AlertFactory = (fresh: boolean) => {
  auth: boolean;
  consent: boolean;
  err: boolean;
  sites: Record<string, unknown>[];
};

export interface RichSegment {
  text: string;
  weight: string;
  color: string;
}

export type RichSegmentsFactory = (str: string) => RichSegment[];
export type PasswordPredicate = (value: string) => boolean;
export type PasswordRule = [string, PasswordPredicate];
export type PasswordScorer = (value: string) => number;
export type ScoreBand = [number, "red" | "orange" | "yellow" | "green"];
export type LabColorConverter = (hex: string) => number[];
export type HexColorConverter = (lab: number[]) => string;
export type ScoreColorResolver = (score: number, kind?: "ring" | "text") => string;
