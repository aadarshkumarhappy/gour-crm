import { NextResponse } from "next/server";
import { getTokenUser, id, leadWithStats, mutate, readDb, todayKey } from "@/lib/store";

export async function GET(req: Request) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = readDb();
  const leads = db.leads
    .map((l) => leadWithStats(l, db.tasks))
    .sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1));
  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const name = (body.name || "").toString().trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    const now = new Date().toISOString();
    let lead = {
      id: id(),
      name,
      company: (body.company || "").toString().trim(),
      email: (body.email || "").toString().trim(),
      phone: (body.phone || "").toString().trim(),
      link: (body.link || "").toString().trim(),
      source: (body.source || "").toString().trim(),
      notes: (body.notes || "").toString().trim(),
      stage: Math.max(1, Math.min(5, Number(body.stage) || 1)),
      createdAt: now,
      updatedAt: now,
    };
    const db = mutate((d) => {
      d.leads.unshift(lead);
    });
    return NextResponse.json({ lead: leadWithStats(lead, db.tasks) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}