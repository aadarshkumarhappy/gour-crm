"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api, friendlyDate } from "@/lib/api";
import { Badge, Button, EmptyState, Icon, PageHeader, StatCard } from "@/components/ui";
import TaskModal, { LeadOption, TaskItem, localToday } from "@/components/TaskModal";

interface TaskRow extends TaskItem {
  leadName: string | null;
  leadCompany: string | null;
  overdue: boolean;
  isToday: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [today, setToday] = useState(localToday());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [editor, setEditor] = useState<TaskRow | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function load() {
    try {
      const t = await api<{ tasks: TaskRow[]; today: string }>("/api/tasks");
      setTasks(t.tasks);
      setToday(t.today);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
    try {
      const l = await api<{ leads: LeadOption[] }>("/api/leads");
      setLeads(l.leads);
    } catch {
      /* leads are optional for the picker */
    }
  }

  useEffect(() => {
    load();
  }, []);

  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.dueDate < today).sort(byDate);
  const dueToday = open.filter((t) => t.dueDate === today).sort(byDate);
  const horizon = addDays(today, 7);
  const upcoming = open.filter((t) => t.dueDate > today && t.dueDate <= horizon).sort(byDate);
  const later = open.filter((t) => t.dueDate > horizon).sort(byDate);
  const completed = tasks.filter((t) => t.done).sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  async function toggleDone(t: TaskRow) {
    await api(`/api/tasks/${t.id}`, { method: "PATCH", body: { done: !t.done } });
    load();
  }

  async function removeTask(id: string) {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    setConfirmId(null);
    load();
  }

  return (
    <Shell>
      <PageHeader
        title="Today's Tasks"
        subtitle="Date-based follow-ups — so no lead ever goes cold or gets missed."
        action={
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" className="h-4 w-4" /> New task
          </Button>
        }
      />

      {error && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">{error}</div>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overdue" value={String(overdue.length)} sub="Catching up" accent={overdue.length ? "text-rose-600" : "text-emerald-600"} />
        <StatCard label="Due today" value={String(dueToday.length)} sub={friendlyDate(today)} accent="text-amber-600" />
        <StatCard label="This week" value={String(upcoming.length)} sub="Next 7 days" accent="text-sky-700" />
        <StatCard label="Completed" value={String(completed.length)} sub={showCompleted ? "Showing in list" : "Hidden — tap to show"} accent="text-indigo-700" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{friendlyDate(today)}</span> · {open.length} open, {completed.length} done
          </p>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-100"
          >
            {showCompleted ? "Hide" : "Show"} completed ({completed.length})
          </button>
        </div>

        {overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && later.length === 0 && (!showCompleted || completed.length === 0) ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState icon="tasks" title="Nothing on your plate" hint="Follow-ups keep deals warm — add a task to stay on top of your leads." />
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {overdue.length > 0 && (
              <TaskSection title={`Overdue (${overdue.length})`} tone="rose" tasks={overdue} onToggle={toggleDone} onEdit={(t) => setEditor(t)} onDelete={(id) => setConfirmId(id)} />
            )}
            {dueToday.length > 0 && (
              <TaskSection title={`Today (${dueToday.length})`} tone="amber" tasks={dueToday} onToggle={toggleDone} onEdit={(t) => setEditor(t)} onDelete={(id) => setConfirmId(id)} />
            )}
            {upcoming.length > 0 && (
              <TaskSection title={`Next 7 days (${upcoming.length})`} tone="sky" tasks={upcoming} onToggle={toggleDone} onEdit={(t) => setEditor(t)} onDelete={(id) => setConfirmId(id)} />
            )}
            {later.length > 0 && (
              <TaskSection title={`Later (${later.length})`} tone="slate" tasks={later} onToggle={toggleDone} onEdit={(t) => setEditor(t)} onDelete={(id) => setConfirmId(id)} />
            )}
            {showCompleted && completed.length > 0 && (
              <TaskSection title={`Completed (${completed.length})`} tone="emerald" tasks={completed} done onToggle={toggleDone} onEdit={(t) => setEditor(t)} onDelete={(id) => setConfirmId(id)} />
            )}
          </div>
        )}
      </div>

      <TaskModal open={showNew} onClose={() => setShowNew(false)} onSaved={load} leads={leads} defaultLeadId="" />
      <TaskModal key={editor ? `edit-${editor.id}` : "edit-none"} open={!!editor} task={editor} onClose={() => setEditor(null)} onSaved={load} leads={leads} />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && setConfirmId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-800">Delete task?</h3>
            <p className="mt-1.5 text-sm text-slate-500">This removes the follow-up without logging it to your archive.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => removeTask(confirmId)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function byDate(a: TaskRow, b: TaskRow): number {
  return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60_000).toISOString().slice(0, 10);
}

function TaskSection({
  title,
  tone,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  done = false,
}: {
  title: string;
  tone: "rose" | "amber" | "sky" | "slate" | "emerald";
  tasks: TaskRow[];
  onToggle: (t: TaskRow) => void;
  onEdit: (t: TaskRow) => void;
  onDelete: (id: string) => void;
  done?: boolean;
}) {
  const toneCls: Record<string, string> = {
    rose: "text-rose-600",
    amber: "text-amber-600",
    sky: "text-sky-700",
    slate: "text-slate-600",
    emerald: "text-emerald-600",
  };
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200">
        <span className={`h-2.5 w-2.5 rounded-full ${toneDot(tone)}`} />
        <h2 className={`text-sm font-bold ${toneCls[tone]}`}>{title}</h2>
      </header>
      <ul className="divide-y divide-slate-100">
        {tasks.map((t) => (
          <li key={t.id} className={`flex items-center gap-3 px-4 py-3 ${done ? "opacity-70" : ""}`}>
            <button
              onClick={() => onToggle(t)}
              className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-500 hover:text-emerald-500"
              }`}
              title={t.done ? "Mark as not done" : "Mark done"}
            >
              <Icon name="check" className="h-3.5 w-3.5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium text-slate-800 ${t.done ? "line-through" : ""}`}>{t.title}</p>
              <p className="truncate text-[11px] text-slate-400">
                {t.leadName ? `${t.leadName}${t.leadCompany ? ` · ${t.leadCompany}` : ""} · ` : ""}
                {friendlyDate(t.dueDate)}
              </p>
            </div>
            {t.overdue && !t.done && <Badge label="Overdue" className="bg-rose-100 text-rose-600" />}
            {t.done && t.completedAt && (
              <Badge label={`Done ${relDay(t.completedAt)}`} className="bg-emerald-100 text-emerald-700" />
            )}
            <button
              onClick={() => onEdit(t)}
              title="Edit task"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
            >
              <Icon name="edit" className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(t.id)}
              title="Delete task"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function toneDot(tone: string): string {
  return {
    rose: "bg-rose-400",
    amber: "bg-amber-400",
    sky: "bg-sky-400",
    slate: "bg-slate-400",
    emerald: "bg-emerald-400",
  }[tone];
}

function relDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "today";
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}