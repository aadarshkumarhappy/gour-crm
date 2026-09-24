"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Field, Modal, inputCls } from "@/components/ui";
import { STAGES } from "@/lib/constants";

export interface LeadItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  link: string;
  source: string;
  notes: string;
  stage: number;
  createdAt: string;
  updatedAt: string;
  stageName?: string;
  openTaskCount?: number;
  activeTask?: { id: string; title: string; dueDate: string } | null;
  nextTask?: { id: string; title: string; dueDate: string } | null;
}

export default function LeadModal({
  open,
  onClose,
  lead,
  defaultStage = 1,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  lead?: LeadItem | null;
  defaultStage?: number;
  onSaved: (lead: LeadItem) => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [link, setLink] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState(defaultStage);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(lead?.name ?? "");
    setCompany(lead?.company ?? "");
    setEmail(lead?.email ?? "");
    setPhone(lead?.phone ?? "");
    setLink(lead?.link ?? "");
    setSource(lead?.source ?? "");
    setNotes(lead?.notes ?? "");
    setStage(lead?.stage ?? defaultStage);
    setError("");
  }, [open, lead, defaultStage]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const body = { name, company, email, phone, link, source, notes, stage: Number(stage) };
      if (lead) {
        const res = await api<{ lead: LeadItem }>(`/api/leads/${lead.id}`, { method: "PATCH", body });
        onSaved(res.lead);
      } else {
        const res = await api<{ lead: LeadItem }>("/api/leads", { method: "POST", body });
        onSaved(res.lead);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={lead ? `Edit ${lead.name}` : "New lead"} wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name *">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" autoFocus />
        </Field>
        <Field label="Company">
          <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc" />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 1234" />
        </Field>
        <Field label="Link">
          <input className={inputCls} value={link} onChange={(e) => setLink(e.target.value)} placeholder="linkedin.com/in/jane" />
        </Field>
        <Field label="Source">
          <input className={inputCls} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Referral, website, event…" />
        </Field>
        <Field label="Pipeline stage">
          <select className={inputCls} value={String(stage)} onChange={(e) => setStage(Number(e.target.value))}>
            {STAGES.map((s, i) => (
              <option key={s} value={i + 1}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Notes">
          <textarea
            rows={3}
            className={inputCls}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contact preferences, budget, next steps…"
          />
        </Field>
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">⚠ {error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={saving || !name.trim()}>
          {saving ? "Saving…" : lead ? "Save changes" : "Add lead"}
        </Button>
      </div>
    </Modal>
  );
}