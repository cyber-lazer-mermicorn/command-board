import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST { password } → sets httpOnly cb_access cookie when it matches
 * COMMAND_BOARD_ACCESS_TOKEN. Simple gate until Stytch is fully wired.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.COMMAND_BOARD_ACCESS_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "Access token not configured (COMMAND_BOARD_ACCESS_TOKEN)" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.password || body.password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("cb_access", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
