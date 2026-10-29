import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * SSE (Server-Sent Events) endpoint.
 *
 * Architecture note:
 * - In development (single Node process): the in-memory `clients` Map works perfectly.
 * - In production on serverless (Vercel): each request may land on a different worker,
 *   so the Map is not shared. Broadcasts from status/route.ts may not reach the client.
 *   For full prod support, replace with Upstash Redis pub/sub or Pusher.
 *   The app gracefully degrades: the client polling (useNotifStore) still works as fallback.
 */

type SendFn = (data: string) => void;

// In-memory registry: userId -> set of active SSE connections
const clients = new Map<string, Set<SendFn>>();

// Max connections per user (prevent abuse)
const MAX_CONNECTIONS_PER_USER = 5;

function register(userId: string, send: SendFn): boolean {
  if (!clients.has(userId)) clients.set(userId, new Set());
  const subs = clients.get(userId)!;
  if (subs.size >= MAX_CONNECTIONS_PER_USER) return false;
  subs.add(send);
  return true;
}

function unregister(userId: string, send: SendFn) {
  const subs = clients.get(userId);
  if (!subs) return;
  subs.delete(send);
  if (subs.size === 0) clients.delete(userId);
}

export function broadcastToUser(userId: string, event: string, data: unknown) {
  const subs = clients.get(userId);
  if (!subs || subs.size === 0) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  subs.forEach((send) => {
    try { send(msg); } catch { unregister(userId, send); }
  });
}

export function broadcastToAll(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((subs, userId) => {
    subs.forEach((send) => {
      try { send(msg); } catch { unregister(userId, send); }
    });
  });
}

export async function GET(req: NextRequest) {
  // Auth check
  const user = await getSession();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = user.id;
  let send: SendFn;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      send = (data: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch {
          // Stream already closed — will be cleaned up via abort signal
        }
      };

      const accepted = register(userId, send);
      if (!accepted) {
        // Too many open tabs — send a message and close gracefully
        send(`event: error\ndata: ${JSON.stringify({ reason: "too_many_connections" })}\n\n`);
        controller.close();
        return;
      }

      // Initial handshake
      send(`event: connected\ndata: ${JSON.stringify({ userId, ts: Date.now() })}\n\n`);

      // Keep-alive heartbeat every 25s (Vercel times out at 60s)
      heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, 25000);

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unregister(userId, send);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      clearInterval(heartbeat);
      if (send) unregister(userId, send);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}