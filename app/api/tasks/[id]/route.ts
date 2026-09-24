import { NextResponse } from "next/server";
import { getTokenUser, id, mutate, readDb, weekKey, todayKey } from "@/lib/store";

function validDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const db0 = readDb();
    const task = db0.tasks.find((t) => t.id === params.id);
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    const prevDone = task.done;
    if (typeof body.done === "boolean") task.done = body.done;
    if (typeof body.title === "string" && body.title.trim()) task.title = body.title.trim();
    if (typeof body.dueDate === "string" && validDate(body.dueDate)) task.dueDate = body.dueDate;
    if (typeof body.leadId === "string" || body.leadId === null) task.leadId = body.leadId;
    task.completedAt = task.done ? task.completedAt || new Date().toISOString() : null;

    const db = mutate((d) => {
      const i = d.tasks.findIndex((t) => t.id === task.id);
      d.tasks[i] = task;
      // Log completion into the weekly archive (once)
      if (task.done && !prevDone) {
        const lead = task.leadId ? d.leads.find((l) => l.id === task.leadId) : null;
        d.archive.unshift({
          id: id(),
          weekKey: weekKey(task.dueDate),
          kind: "followup",
          leadId: task.leadId,
          title: task.title,
          result: "done",
          notes: lead ? `Follow-up with ${lead.name}${lead.company ? ` · ${lead.company}` : ""}` : "Follow-up completed",
          createdAt: new Date().toISOString(),
        });
      }
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db0 = readDb();
  if (!db0.tasks.some((t) => t.id === params.id)) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  mutate((d) => {
    d.tasks = d.tasks.filter((t) => t.id !== params.id);
  });
  return NextResponse.json({ ok: true });
}