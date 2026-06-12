import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const res = NextResponse.redirect(new URL("/dine", req.url));
  if (UUID_RE.test(token)) {
    res.cookies.set("rw_qr_token", token, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 120,
      path: "/",
    });
  }
  return res;
}
