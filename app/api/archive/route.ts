import { NextResponse } from "next/server";
import { getTokenUser, id, mutate, readDb, todayKey, weekKey } from "@/lib/store";

export async function GET(req: Request) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = readDb();
  const leadMap = new Map(db.leads.map((l) => [l.id, { name: l.name, company: l.company }]));
  const byWeek: Record<string, typeof db.archive> = {};
  for (const item of db.archive) {
    (byWeek[item.weekKey] ||= []).push(item);
  }
  const weeks = Object.entries(byWeek)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => {
      const sorted = items.sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));
      return {
        weekKey: key,
        deals: sorted.filter((i) => i.kind === "deal").length,
        followups: sorted.filter((i) => i.kind === "followup").length,
        notes: sorted.filter((i) => i.kind === "note").length,
        items: sorted.map((i) => ({
          ...i,
          leadName: i.leadId ? leadMap.get(i.leadId)?.name : null,
          leadCompany: i.leadId ? leadMap.get(i.leadId)?.company : null,
        })),
      };
    });
  return NextResponse.json({ weeks, currentWeek: weekKey(todayKey()) });
}

export async function POST(req: Request) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const title = (body.title || "").toString().trim();
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    const date = validDate((body.date || "").toString()) ? (body.date as string).toString() : todayKey();
    const kind = ["deal", "followup", "note"].includes(body.kind || "") ? body.kind : "note";
    const item = {
      id: id(),
      weekKey: weekKey(date),
      kind,
      leadId: body.leadId || null,
      title,
      result: (body.result || "").toString().trim() || "done",
      notes: (body.notes || "").toString().trim(),
      createdAt: new Date().toISOString(),
    };
    mutate((d) => d.archive.unshift(item));
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

function validDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}