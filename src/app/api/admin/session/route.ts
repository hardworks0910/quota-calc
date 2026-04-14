import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_session")?.value === "1";
  return NextResponse.json({ authed: isAuthed });
}
