import { NextResponse } from "next/server";
import { getTokenUser, id, mutate, readDb, todayKey } from "@/lib/store";

export async function GET(req: Request) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = readDb();
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "all";
  const leadId = searchParams.get("leadId");
  const today = todayKey();

  const leadMap = new Map(db.leads.map((l) => [l.id, { name: l.name, company: l.company }]));
  let tasks = db.tasks.map((t) => {
    const lead = t.leadId ? leadMap.get(t.leadId) : null;
    return {
      ...t,
      leadName: lead?.name ?? null,
      leadCompany: lead?.company ?? null,
      overdue: !t.done && t.dueDate < today,
      isToday: t.dueDate === today,
    };
  });
  if (leadId) tasks = tasks.filter((t) => t.leadId === leadId);
  if (scope === "open") tasks = tasks.filter((t) => !t.done);
  if (scope === "today") tasks = tasks.filter((t) => !t.done && t.dueDate <= today);
  tasks.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
  return NextResponse.json({ tasks, today });
}

export async function POST(req: Request) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const title = (body.title || "").toString().trim();
    const dueDate = (body.dueDate || "").toString().trim();
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: "A title and a valid due date are required." }, { status: 400 });
    }
    const task = {
      id: id(),
      leadId: body.leadId || null,
      title,
      dueDate,
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    mutate((d) => d.tasks.push(task));
    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}