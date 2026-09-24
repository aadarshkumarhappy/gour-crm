"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { EmptyState, Icon, PageHeader, StatCard } from "@/components/ui";
import LeadModal, { LeadItem } from "@/components/LeadModal";
import { STAGES, STAGE } from "@/lib/constants";

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<number | null>(null);
  const [editing, setEditing] = useState<LeadItem | null>(null);

  async function load() {
    try {
      const res = await api<{ leads: LeadItem[] }>("/api/leads");
      setLeads(res.leads);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load pipeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byStage: Record<number, LeadItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const l of leads) (byStage[l.stage] ||= []).push(l);

  function onDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    setDragId(id);
    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>, stage: number) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    setOverStage(stage);
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>, stage: number) {
    e.preventDefault();
    setOverStage(null);
    const id = e.dataTransfer?.getData("text/plain") || dragId;
    setDragId(null);
    if (!id || Number(stage) === undefined) return;
    try {
      await api(`/api/leads/${id}`, { method: "PATCH", body: { stage: Number(stage) } });
      await load();
    } catch {
      /* keep board as-is */
    }
  }

  const openPipeline = leads.filter((l) => l.stage < 5).length;
  const closed = leads.filter((l) => l.stage === 5).length;

  return (
    <Shell>
      <PageHeader
        title="Sales Pipeline"
        subtitle="Drag a card to move it — New → Contacted → Qualified → Proposal → Closed."
      />

      {error && (
        <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-600">{error}</div>
      )}

      {!loading && leads.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon="pipeline"
            title="Your pipeline is empty"
            hint="Add a lead in the Leads directory and you'll see it here, ready to drag."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total leads" value={String(leads.length)} sub="Across all stages" accent="text-indigo-700" />
          <StatCard label="Active pipeline" value={String(openPipeline)} sub="Stages 1 – 4" accent="text-sky-700" />
          <StatCard label="Closed deals" value={String(closed)} sub="Logged to your archive" accent="text-emerald-600" />
          <StatCard label="Win rate" value={leads.length ? `${Math.round((closed / leads.length) * 100)}%` : "—"} sub="Closed ÷ total leads" accent="text-violet-700" />
        </div>
      )}

      <div className="mt-5 flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((label, i) => {
          const stage = i + 1;
          const cards = byStage[stage] ?? [];
          const isOver = overStage === stage && dragId;
          return (
            <div
              key={label}
              onDragOver={(e) => onDragOver(e, stage)}
              onDragLeave={() => setOverStage(null)}
              onDrop={(e) => onDrop(e, stage)}
              className={`flex min-w-[230px] flex-1 flex-col rounded-2xl border bg-white shadow-sm ${
                isOver ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50" : "border-slate-200"
              }`}
            >
              <header className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColor(stage)}`} />
                  <h2 className="text-sm font-bold text-slate-700">{label}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{cards.length}</span>
              </header>

              <div className="px-3 py-3 space-y-2">
                {cards.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                    {dragId ? "Drop here" : "Empty"}
                  </p>
                ) : (
                  cards.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, l.id)}
                      onDragEnd={() => setDragId(null)}
                      className={`cursor-grab rounded-xl border bg-slate-50 p-3 shadow-sm transition hover:border-indigo-300 active:cursor-grabbing ${
                        dragId === l.id ? "opacity-50" : ""
                      } ${stage === 5 ? "border-emerald-200" : "border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="truncate text-sm font-semibold text-slate-800">{l.name}</p>
                        {stage === 5 && <Icon name="check" className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <p className="truncate text-xs text-slate-400">{l.company || "—"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {l.email && (
                          <a href={`mailto:${l.email}`} className="truncate text-[11px] text-sky-700 hover:underline">✉ {l.email}</a>
                        )}
                        {l.phone && <span className="text-[11px] text-slate-500">☎ {l.phone}</span>}
                        {(l.openTaskCount ?? 0) > 0 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            {l.openTaskCount} task{l.openTaskCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setEditing(l)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        <Icon name="edit" className="h-3 w-3" /> Edit
                      </button>
                    </div>
                  ))
                )}
              </div>

              {isOver && (
                <p className="mb-1 text-center text-[10px] font-semibold text-indigo-500">Release to move here</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Closing a deal (moving to <span className="font-semibold">Closed</span>) automatically logs a "won" entry in your Completed archive.
      </p>

      <LeadModal key={editing ? `edit-${editing.id}` : "edit-none"} open={!!editing} lead={editing} onClose={() => setEditing(null)} onSaved={() => load()} />
    </Shell>
  );
}

function dotColor(stage: number): string {
  return ["bg-slate-400", "bg-sky-500", "bg-amber-500", "bg-violet-500", "bg-emerald-500"][stage - 1];
}