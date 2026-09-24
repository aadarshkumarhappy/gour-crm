import { NextResponse } from "next/server";
import { getTokenUser, mutate, readDb } from "@/lib/store";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!getTokenUser(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db0 = readDb();
  if (!db0.archive.some((i) => i.id === params.id)) return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  mutate((d) => {
    d.archive = d.archive.filter((i) => i.id !== params.id);
  });
  return NextResponse.json({ ok: true });
}