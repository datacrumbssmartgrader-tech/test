import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  console.log("LOGIN ROUTE HIT");
  try {
    const { pin } = await req.json();

    // Validate input
    if (!pin || typeof pin !== "string" || pin.length !== 4) {
      return NextResponse.json(
        { error: "Invalid PIN format. Must be 4 digits." },
        { status: 400 }
      );
    }

    // Query staff by role (admin has unique PIN requirement)
    const result = await sql`
      SELECT id, name, role, pin_hash
      FROM staff
      WHERE active = true
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "No active staff found" },
        { status: 401 }
      );
    }

    // Find matching PIN
    let staffMember = null;
    for (const staff of result) {
      const isPinValid = await bcrypt.compare(pin, staff.pin_hash);
      if (isPinValid) {
        staffMember = staff;
        break;
      }
    }

    if (!staffMember) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = signToken({
      id: staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
    });

    // Create response with HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: staffMember.id,
          name: staffMember.name,
          role: staffMember.role,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only secure cookie
    response.cookies.set("rw_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
