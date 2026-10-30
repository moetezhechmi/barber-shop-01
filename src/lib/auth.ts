import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { auth } from "@/auth";

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SECURITY CONFIGURATION ERROR: JWT_SECRET or AUTH_SECRET environment variable is missing.");
}

const EFFECTIVE_JWT_SECRET = JWT_SECRET || "fallback-secret-development-only";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  // 1. Try resolving session via Auth.js (Google/OAuth)
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, role: true, phone: true, image: true },
      });
      if (user) return user;
    }
  } catch (e) {
    console.error("Error fetching Auth.js session:", e);
  }

  // 2. Fallback to custom Credentials JWT token
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, phone: true, image: true },
  });
  return user;
}
