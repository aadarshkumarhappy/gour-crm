export const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Closed"];

/** Badge color classes per pipeline stage (1-based) */
export const STAGE = [
  "bg-slate-200 text-slate-600",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
];

export const STAGE_DOT = [
  "bg-slate-400",
  "bg-sky-400",
  "bg-amber-400",
  "bg-violet-400",
  "bg-emerald-400",
];

export const PAGE_TITLES: Record<string, string> = {};

export function stageName(stage: number): string {
  return STAGES[Math.max(0, Math.min(4, stage - 1))];
}