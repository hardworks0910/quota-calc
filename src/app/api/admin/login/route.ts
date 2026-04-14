import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json()) as { password?: string };
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { success: false, message: "ADMIN_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  if (!body.password || body.password !== expectedPassword) {
    return NextResponse.json(
      { success: false, message: "Invalid password" },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ success: true });
}
