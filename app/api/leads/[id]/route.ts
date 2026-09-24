import { NextResponse } from "next/server";
import { getTokenUser, id, leadWithStats, mutate, readDb, todayKey, weekKey } from "@/lib/store";

const LABELS = ["New", "Contacted", "Qualified", "Proposal", "Closed"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const db0 = readDb();
    const lead = db0.leads.find((l) => l.id === params.id);
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    const stringFields = ["name", "company", "email", "phone", "link", "source", "notes"];
    for (const f of stringFields) {
      if (typeof body[f] === "string" && f === "name" && body[f].trim()) lead[f] = body[f].trim();
      else if (typeof body[f] === "string" && f !== "name") lead[f] = body[f].trim();
    }
    const prevStage = lead.stage;
    if (typeof body.stage === "number" && body.stage >= 1 && body.stage <= 5 && body.stage !== prevStage) {
      lead.stage = body.stage;
    }
    lead.updatedAt = new Date().toISOString();

    let archived = false;
    const db = mutate((d) => {
      const i = d.leads.findIndex((l) => l.id === lead.id);
      d.leads[i] = lead;
      // Auto-archive a closed deal (moved into stage 5)
      if (lead.stage === 5 && prevStage !== 5) {
        d.archive.unshift({
          id: id(),
          weekKey: weekKey(todayKey()),
          kind: "deal",
          leadId: lead.id,
          title: `${lead.name}${lead.company ? ` · ${lead.company}` : ""}`,
          result: "won",
          notes: `Closed from ${LABELS[Math.max(0, Math.min(4, prevStage - 1))]}`,
          createdAt: new Date().toISOString(),
        });
        archived = true;
      }
    });
    return NextResponse.json({ lead: leadWithStats(lead, db.tasks), archived });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db0 = readDb();
  const exists = db0.leads.some((l) => l.id === params.id);
  if (!exists) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  mutate((d) => {
    d.leads = d.leads.filter((l) => l.id !== params.id);
    d.tasks = d.tasks.filter((t) => t.leadId !== params.id);
  });
  return NextResponse.json({ ok: true });
}