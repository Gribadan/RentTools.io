import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { subscribeUserChanges } from "@/lib/live-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const encoder = new TextEncoder();
    let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let lifetime: ReturnType<typeof setTimeout> | undefined;
    let pendingRefresh: ReturnType<typeof setTimeout> | undefined;
    let closed = false;
    let unsubscribe = () => {};

    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      clearTimeout(lifetime);
      clearTimeout(pendingRefresh);
      unsubscribe();
      request.signal.removeEventListener("abort", close);
      try { controller?.close(); } catch { /* The client may already have cancelled. */ }
    };
    const send = (message: string) => {
      if (closed || !controller) return;
      if ((controller.desiredSize ?? 0) <= 0) {
        close();
        return;
      }
      try { controller.enqueue(encoder.encode(message)); } catch { close(); }
    };

    const subscription = subscribeUserChanges(session.userId, () => {
      if (closed || pendingRefresh) return;
      pendingRefresh = setTimeout(() => {
        pendingRefresh = undefined;
        send("event: refresh\ndata: {}\n\n");
      }, 250);
    });
    if (!subscription) {
      return NextResponse.json({ error: "Too many live connections" }, {
        status: 429, headers: { "Retry-After": "60" },
      });
    }
    unsubscribe = subscription;

    const stream = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
        if (request.signal.aborted) { close(); return; }
        request.signal.addEventListener("abort", close, { once: true });
        send("retry: 5000\n\n: connected\n\n");
        heartbeat = setInterval(() => send(": heartbeat\n\n"), 15_000);
        // Reconnection rechecks authentication and reloads missed changes.
        lifetime = setTimeout(close, 5 * 60_000);
      },
      cancel: close,
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "private, no-store, no-transform",
        "X-Accel-Buffering": "no",
        Vary: "Cookie",
      },
    });
  } catch (err) {
    console.error("Live refresh route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
