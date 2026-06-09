import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/') {
    console.log('🕵️‍♂️ Root hit! User-Agent:', request.headers.get('user-agent'));
  }

  // ✅ Allow dine app to POST alerts without admin auth.
  // The dine user has no admin cookie — their session_id is used for DB-level auth instead.
  if (pathname === "/api/admin/alerts" && request.method === "POST") {
    console.log('[middleware] Allowing unauthenticated POST /api/admin/alerts (dine app)');
    return NextResponse.next();
  }

  // Protect all other /api/admin/* routes
  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("rw_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    const payload = await verifyTokenEdge(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    if (payload.role !== "admin" && payload.role !== "user") {
      return NextResponse.json(
        { error: "Unauthorized - Invalid role" },
        { status: 403 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.id);
    requestHeaders.set("x-user-name", payload.name);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin/:path*"],
};
