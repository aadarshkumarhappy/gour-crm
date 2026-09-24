import { NextResponse } from "next/server";
import { getTokenUser, leadWithStats, readDb, todayKey, weekKey } from "@/lib/store";

export async function GET(req: Request) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = readDb();
  const today = todayKey();
  const wk = weekKey(today);

  const openTasks = db.tasks.filter((t) => !t.done);
  const overdue = openTasks.filter((t) => t.dueDate < today);
  const todayTasks = openTasks.filter((t) => t.dueDate === today);
  const upcoming = openTasks.filter((t) => t.dueDate > today).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

  const leadMap = new Map(db.leads.map((l) => [l.id, l]));

  const weekDeals = db.archive.filter((a) => a.weekKey === wk && a.kind === "deal").length;
  const weekFollowups = db.archive.filter((a) => a.weekKey === wk && a.kind === "followup").length;

  const leadsByStage = [1, 2, 3, 4, 5].map((s) => ({
    stage: s,
    count: db.leads.filter((l) => l.stage === s).length,
  }));

  const recentLeads = db.leads
    .map((l) => leadWithStats(l, db.tasks))
    .sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1))
    .slice(0, 5);

  const recentActivity = db.archive
    .sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1))
    .slice(0, 6)
    .map((a) => ({
      ...a,
      leadName: a.leadId ? leadMap.get(a.leadId)?.name : null,
    }));

  return NextResponse.json({
    today,
    weekKey: wk,
    counts: {
      leads: db.leads.length,
      openTasks: openTasks.length,
      overdue: overdue.length,
      todayTasks: todayTasks.length,
      upcoming: upcoming.length,
      weekDeals,
      weekFollowups,
    },
    todayTasks: todayTasks
      .map((t) => ({ ...t, leadName: t.leadId ? leadMap.get(t.leadId)?.name : null, leadCompany: t.leadId ? leadMap.get(t.leadId)?.company : null }))
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)),
    overdueTasks: overdue
      .map((t) => ({ ...t, leadName: t.leadId ? leadMap.get(t.leadId)?.name : null }))
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)),
    upcomingTasks: upcoming
      .map((t) => ({ ...t, leadName: t.leadId ? leadMap.get(t.leadId)?.name : null }))
      .slice(0, 5),
    leadsByStage,
    recentLeads,
    recentActivity,
  });
}