"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Field, Modal, inputCls } from "@/components/ui";

export interface LeadOption {
  id: string;
  name: string;
  company: string;
}

export interface TaskItem {
  id: string;
  leadId: string | null;
  title: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
  completedAt: string | null;
}

/** Local YYYY-MM-DD (matches the server's todayKey) */
export function localToday(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export default function TaskModal({
  open,
  onClose,
  onSaved,
  leads,
  task = null,
  defaultLeadId = "",
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (task: TaskItem) => void;
  leads: LeadOption[];
  task?: TaskItem | null;
  defaultLeadId?: string;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(localToday());
  const [leadId, setLeadId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDueDate(task?.dueDate ?? localToday());
    setLeadId(task?.leadId ?? defaultLeadId ?? "");
    setError("");
  }, [open, task, defaultLeadId]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const body = { title, dueDate, leadId: leadId || null };
      if (task) {
        const res = await api<{ task: TaskItem }>(`/api/tasks/${task.id}`, { method: "PATCH", body });
        onSaved(res.task);
      } else {
        const res = await api<{ task: TaskItem }>("/api/tasks", { method: "POST", body });
        onSaved(res.task);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "New follow-up task"}>
      <Field label="What needs doing? *">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Send proposal & pricing" autoFocus />
      </Field>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Due date *">
          <input className={inputCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Lead">
          <select className={inputCls} value={leadId || ""} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">None — general task</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.company ? ` · ${l.company}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">⚠ {error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={saving || !title.trim() || !dueDate}>
          {saving ? "Saving…" : task ? "Save changes" : "Add task"}
        </Button>
      </div>
    </Modal>
  );
}