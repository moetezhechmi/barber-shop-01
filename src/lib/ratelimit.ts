import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// In-memory sliding window (single instance). For multi-instance production, replace with Upstash.
export function rateLimit(req: NextRequest, key: string, limit: number, windowMs: number): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(id);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  bucket.count += 1;
  return null;
}
