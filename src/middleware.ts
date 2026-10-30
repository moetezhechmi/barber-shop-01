import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "fallback-secret";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

interface VerifiedJwtPayload {
  userId?: string;
  email?: string;
  role?: string;
  exp?: number;
}

/**
 * Cryptographically verifies custom JWT token against HMAC SHA-256 secret.
 * Rejects expired, tampered, forged or unsigned tokens.
 */
async function verifyCustomJwt(tokenStr: string): Promise<VerifiedJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(tokenStr, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    return payload as VerifiedJwtPayload;
  } catch {
    // Signature verification failed, token expired, or invalid format
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect owner, barber and client dashboard routes
  const isOwnerRoute = pathname.startsWith("/owner");
  const isBarberRoute = pathname.startsWith("/barber");
  const isClientRoute = pathname.startsWith("/client");

  if (!isOwnerRoute && !isBarberRoute && !isClientRoute) {
    return NextResponse.next();
  }

  // 1. Check custom JWT token from cookie with CRYPTOGRAPHIC verification
  const tokenCookie = req.cookies.get("token")?.value;
  let userRole: string | null = null;
  let isTokenTamperedOrInvalid = false;

  if (tokenCookie) {
    const verifiedPayload = await verifyCustomJwt(tokenCookie);
    if (verifiedPayload?.role) {
      userRole = verifiedPayload.role;
    } else {
      isTokenTamperedOrInvalid = true;
    }
  }

  // 2. Check NextAuth (Google Auth) session token if no valid custom token
  if (!userRole) {
    try {
      const nextAuthToken = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
      });
      if (nextAuthToken?.role) {
        userRole = nextAuthToken.role as string;
      }
    } catch {
      // Ignore NextAuth decryption failure
    }
  }

  // If not logged in or token is invalid/tampered
  if (!userRole) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);

    // If an invalid or forged token cookie was detected, purge it immediately
    if (isTokenTamperedOrInvalid) {
      redirectResponse.cookies.delete("token");
    }

    return redirectResponse;
  }

  // Role-based authorization rules
  if (isOwnerRoute && userRole !== "OWNER") {
    // Non-owner trying to access owner panel
    const redirectPath = userRole === "BARBER" ? "/barber/dashboard" : "/client/search";
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  if (isBarberRoute && userRole !== "BARBER" && userRole !== "OWNER") {
    // Non-staff trying to access barber workspace
    return NextResponse.redirect(new URL("/client/search", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/owner/:path*",
    "/barber/:path*",
    "/client/:path*",
  ],
};
