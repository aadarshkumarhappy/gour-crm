import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { hashPassword, signJwt, verifyJwt } from "@/lib/auth";

/* ------------------------------------------------------------------
 * Lightweight JSON file store. Data lives in /workspace/data/db.json.
 * ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Closed"];
export const STAGE_COLORS = [
  "bg-slate-300 text-slate-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
];

export function id(): string {
  return crypto.randomBytes(10).toString("hex");
}

export function todayKey(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Monday of the week containing `date` (YYYY-MM-DD) */
export function weekKey(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = (date.getDay() + 6) % 7; // Mon = 0
  date.setDate(date.getDate() - dow);
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  link: string;
  source: string;
  notes: string;
  stage: number; // 1..5
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  leadId: string | null;
  title: string;
  dueDate: string; // YYYY-MM-DD
  done: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface ArchiveEntry {
  id: string;
  weekKey: string; // Monday of the week
  kind: "deal" | "followup" | "note";
  leadId: string | null;
  title: string;
  result: string;
  notes: string;
  createdAt: string;
}

interface User {
  username: string;
  passwordHash: string;
  createdAt: string;
}

interface Db {
  meta: { secret: string; seededAt: string };
  users: User[];
  leads: Lead[];
  tasks: Task[];
  archive: ArchiveEntry[];
}

function emptyDb(): Db {
  return { meta: { secret: "", seededAt: "" }, users: [], leads: [], tasks: [], archive: [] };
}

let cache: Db | null = null;
let lastMtime = 0;

export function readDb(): Db {
  try {
    const stat = fs.statSync(DB_PATH);
    if (cache && stat.mtimeMs === lastMtime) return cache;
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Db;
    cache = parsed;
    lastMtime = stat.mtimeMs;
    return parsed;
  } catch {
    const db = seed();
    writeDbSync(db);
    return db;
  }
}

export function writeDb(db: Db): void {
  writeDbSync(db);
  cache = db;
  try {
    lastMtime = fs.statSync(DB_PATH).mtimeMs;
  } catch {
    /* ignore */
  }
}

function writeDbSync(db: Db): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function mutate(fn: (db: Db) => void): Db {
  const db = readDb();
  fn(db);
  writeDb(db);
  return db;
}

/* ------------------------- seeding ------------------------- */

function seed(): Db {
  const adminUser = (process.env.GOUR_ADMIN_USERNAME || "admin").trim();
  const adminPass = process.env.GOUR_ADMIN_PASSWORD || "admin";
  const now = new Date().toISOString();
  return {
    meta: { secret: crypto.randomBytes(32).toString("hex"), seededAt: now },
    users: [{ username: adminUser, passwordHash: hashPassword(adminPass), createdAt: now }],
    leads: [],
    tasks: [],
    archive: [],
  };
}

/* ------------------------- auth helpers ------------------------- */

export function getSecret(db?: Db): string {
  const d = db ?? readDb();
  return d.meta.secret || "dev-secret-change-me";
}

export function authenticate(username: string, password: string): string | null {
  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return signJwt({ sub: user.username, username: user.username }, getSecret(db));
}

export function getTokenUser(token: string | undefined | null): { username: string; exp: number } | null {
  if (!token) return null;
  const payload = verifyJwt(token.replace(/^Bearer\s+/i, ""), getSecret());
  if (!payload) return null;
  return { username: payload.username, exp: payload.exp };
}

export function today() {
  return todayKey();
}

export function weekStart(dateStr?: string): string {
  return weekKey(dateStr ?? todayKey());
}

/** Resolve a lead + extra task info for a response payload */
export function leadWithStats(lead: Lead, tasks: Task[]) {
  const open = tasks.filter((t) => !t.done && t.leadId === lead.id);
  const activeTask = open
    .filter((t) => t.dueDate <= todayKey())
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0];
  const nextTask = open.filter((t) => t.dueDate > todayKey()).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0];
  return {
    ...lead,
    stageName: STAGES[Math.max(0, Math.min(4, lead.stage - 1))],
    openTaskCount: open.length,
    activeTask: activeTask ? { id: activeTask.id, title: activeTask.title, dueDate: activeTask.dueDate } : null,
    nextTask: nextTask ? { id: nextTask.id, title: nextTask.title, dueDate: nextTask.dueDate } : null,
  };
}