import { NextResponse } from "next/server";
import { authenticate } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }
    const token = authenticate(username, password);
    if (!token) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }
    const user = username.trim();
    return NextResponse.json({ token, username: user });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}