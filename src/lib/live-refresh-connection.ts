type Listener = () => void;
const listeners = new Set<Listener>();
let source: EventSource | null = null;

function refresh() {
  for (const listener of listeners) listener();
}

function disconnect() {
  source?.close();
  source = null;
}

function connect() {
  if (document.visibilityState !== "visible" || typeof EventSource === "undefined") return;
  if (source && source.readyState !== EventSource.CLOSED) return;
  disconnect();
  try {
    source = new EventSource("/api/live");
    source.addEventListener("open", refresh);
    source.addEventListener("refresh", refresh);
  } catch {
    // The ordinary refresh interval remains available when streaming is blocked.
    source = null;
  }
}

function onVisibility() {
  if (document.visibilityState === "visible") connect();
  else disconnect();
}

function onOnline() {
  disconnect();
  connect();
}

export function subscribeLiveRefresh(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", connect);
    window.addEventListener("focus", connect);
    connect();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("pageshow", connect);
    window.removeEventListener("focus", connect);
  };
}
