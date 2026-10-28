import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function parseJwtCookie(tokenStr: string): { userId?: string; email?: string; role?: string; exp?: number } | null {
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null; // Expired
    }
    return payload;
  } catch {
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

  // 1. Check custom JWT token from cookie
  const tokenCookie = req.cookies.get("token")?.value;
  let userRole: string | null = null;

  if (tokenCookie) {
    const decoded = parseJwtCookie(tokenCookie);
    if (decoded?.role) {
      userRole = decoded.role;
    }
  }

  // 2. Check NextAuth (Google Auth) session token if no custom token
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
      // Ignore
    }
  }

  // If not logged in at all
  if (!userRole) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
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
