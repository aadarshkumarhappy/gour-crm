"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { api, friendlyDate } from "@/lib/api";
import { Badge, EmptyState, Icon, PageHeader, StatCard } from "@/components/ui";
import { STAGES, STAGE } from "@/lib/constants";

interface LeadRef {
  id: string;
  name: string;
  company: string;
  stage: number;
  updatedAt: string;
  openTaskCount?: number;
}
interface TaskRef {
  id: string;
  leadId: string | null;
  title: string;
  dueDate: string;
  done: boolean;
  leadName: string | null;
  leadCompany: string | null;
}
interface Activity {
  id: string;
  kind: string;
  title: string;
  result: string;
  weekKey: string;
  leadName: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const [data, setData] = useState<{
    today: string;
    weekKey: string;
    counts: Record<string, number>;
    todayTasks: TaskRef[];
    overdueTasks: TaskRef[];
    upcomingTasks: TaskRef[];
    leadsByStage: { stage: number; count: number }[];
    recentLeads: LeadRef[];
    recentActivity: Activity[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/overview").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Shell><div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">{error}</div></Shell>;

  if (!data)
    return (
      <Shell>
        <div className="flex items-center gap-3 py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Crunching your numbers…</p>
        </div>
      </Shell>
    );

  const { counts, todayTasks, overdueTasks, upcomingTasks, leadsByStage, recentLeads, recentActivity } = data;

  async function completeTask(id: string) {
    await api(`/api/tasks/${id}`, { method: "PATCH", body: { done: true } });
    const fresh = await api("/api/overview");
    setData(fresh);
  }

  const maxStage = Math.max(1, ...leadsByStage.map((s) => s.count));

  return (
    <Shell>
      <PageHeader
        title="Dashboard"
        subtitle={`${friendlyDate(data.today)} · Week of ${friendlyDate(data.weekKey)}`}
        action={
          <Link href="/leads" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            <Icon name="plus" className="h-4 w-4" /> New lead
          </Link>
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={String(counts.leads)} sub={`${counts.weekDeals} won this week`} accent="text-indigo-700" />
        <StatCard label="Tasks due today" value={String(counts.todayTasks)} sub={counts.todayTasks ? "Don't let leads go cold!" : "All caught up 🎉"} accent={counts.todayTasks ? "text-amber-600" : "text-emerald-600"} />
        <StatCard label="Overdue follow-ups" value={String(counts.overdue)} sub="Need attention" accent={counts.overdue ? "text-rose-600" : "text-slate-500"} />
        <StatCard label="Pipeline momentum" value={String(counts.openTasks)} sub={`${counts.upcoming} upcoming`} accent="text-sky-700" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Today's tasks */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Today&apos;s tasks</h2>
            <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:underline">View all →</Link>
          </header>
          {todayTasks.length === 0 && overdueTasks.length === 0 ? (
            <EmptyState icon="tasks" title="Nothing due today" hint="Plan a follow-up to keep deals moving." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {overdueTasks.map((t) => (
                <TaskRow key={`o-${t.id}`} task={t} overdue onDone={completeTask} />
              ))}
              {todayTasks.map((t) => (
                <TaskRow key={`t-${t.id}`} task={t} onDone={completeTask} />
              ))}
            </ul>
          )}
        </section>

        {/* Pipeline snapshot */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Pipeline snapshot</h2>
          </header>
          <div className="px-4 py-5 space-y-3">
            {leadsByStage.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="w-24 text-xs font-semibold text-slate-500">{STAGES[s.stage - 1]}</span>
                <div className="relative h-3 flex-1 rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${Math.max(4, (s.count / maxStage) * 100)}%` }}
                  />
                </div>
                <span className="w-6 text-right text-sm font-bold text-slate-700">{s.count}</span>
              </div>
            ))}
            <p className="mt-2 text-xs text-slate-400">Deals move 1 → 5; reaching Closed logs them in your archive.</p>
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Recent activity</h2>
          </header>
          {recentActivity.length === 0 ? (
            <EmptyState icon="archive" title="Quiet so far" hint="Closed deals and completed follow-ups appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span className="mt-0.5 text-slate-400">
                    <Icon name={a.kind === "deal" ? "check" : a.kind === "followup" ? "clock" : "plus"} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{a.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {a.kind === "deal" ? "Deal closed · " : a.kind === "followup" ? "Follow-up done · " : "Note · "}
                      {a.leadName ? `${a.leadName} · ` : ""}
                      {friendlyDate(a.weekKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent leads */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Recently updated leads</h2>
          <Link href="/leads" className="text-xs font-semibold text-indigo-600 hover:underline">All leads →</Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
              <tr><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Company</th><th className="px-4 py-2.5">Stage</th><th className="px-4 py-2.5">Open tasks</th><th className="px-4 py-2.5">Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeads.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No leads yet — add your first contact.</td></tr>
              ) : (
                recentLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      <Link href={`/leads`} className="hover:text-indigo-600">{l.name}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{l.company || "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge label={STAGES[l.stage - 1] || STAGES[0]} className={STAGE[l.stage - 1]} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{String(l.openTaskCount ?? 0)}</td>
                    <td className="px-4 py-2.5 text-slate-400">{friendlyDay(l.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}

function friendlyDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TaskRow({ task, onDone, overdue = false }: { task: TaskRef; onDone: (id: string) => void; overdue?: boolean }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onDone(task.id)}
        className="flex h-5.5 w-5.5 items-center justify-center rounded-md border-2 border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500"
      >
        <Icon name="check" className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700">{task.title}</p>
        {task.leadName && <p className="truncate text-[11px] text-slate-400">{task.leadName}{task.leadCompany ? ` · ${task.leadCompany}` : ""}</p>}
      </div>
      {overdue && <Badge label="Overdue" className="bg-rose-100 text-rose-600" />}
    </li>
  );
}