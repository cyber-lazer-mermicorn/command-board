import { NextRequest, NextResponse } from "next/server";

/**
 * Dashboard gate.
 * When COMMAND_BOARD_ACCESS_TOKEN is set, /dashboard requires cookie cb_access
 * matching that token. When unset, dashboard stays open (dev / unconfigured).
 * Public routes (/, /api/health, /login) are never gated by this middleware.
 */
export function middleware(req: NextRequest) {
  const token = process.env.COMMAND_BOARD_ACCESS_TOKEN?.trim();
  if (!token) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("cb_access")?.value;
  if (cookie === token) {
    return NextResponse.next();
  }

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
