import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your_long_random_secret_here_change_in_production";
const JWT_EXPIRY = "24h";

export interface AuthPayload {
  id: string;
  name: string;
  role: "admin" | "user";
}

/**
 * Sign a JWT token
 */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify JWT for Edge Runtime (Middleware)
 * Uses jose library for edge-compatible JWT verification
 */
export async function verifyTokenEdge(token: string): Promise<AuthPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as AuthPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT from Authorization header or cookie value
 */
export function extractToken(authHeader: string | null, cookieValue: string | null): string | null {
  // Check Authorization header (Bearer token)
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check cookie value
  if (cookieValue) {
    return cookieValue;
  }

  return null;
}
