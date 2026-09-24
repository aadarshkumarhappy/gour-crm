import { NextResponse } from "next/server";
import { getTokenUser } from "@/lib/store";

export async function GET(req: Request) {
  const user = getTokenUser(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ username: user.username, exp: user.exp });
}