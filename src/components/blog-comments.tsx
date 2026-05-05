"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface BlogCommentItem {
  id: number;
  body: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
  username: string;
}

interface Props {
  postId: number;
  comments: BlogCommentItem[];
  isSignedIn: boolean;
  isSuperadmin: boolean;
  loginHref: string;
}

const MAX_BODY_LEN = 3000;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export function BlogComments({ postId, comments, isSignedIn, isSuperadmin, loginHref }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const trimmed = body.trim();
    if (!trimmed) {
      setError("Comment can't be empty");
      return;
    }
    if (trimmed.length > MAX_BODY_LEN) {
      setError(`Comment must be ${MAX_BODY_LEN} characters or fewer`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/blog-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body: trimmed }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error || "Couldn't post comment");
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function moderate(id: number, action: "hide" | "show" | "delete") {
    if (busyId) return;
    setBusyId(id);
    try {
      const init: RequestInit =
        action === "delete"
          ? { method: "DELETE" }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: action === "hide" ? "hidden" : "visible" }),
            };
      const res = await fetch(`/api/blog-comments/${id}`, init);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        alert(payload?.error || "Couldn't update comment");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error");
    } finally {
      setBusyId(null);
    }
  }

  const visible = comments.filter((c) => isSuperadmin || c.status === "visible");
  const remaining = MAX_BODY_LEN - body.length;

  return (
    <section className="mt-12 border-t border-[var(--line)] pt-8">
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        Comments {visible.length > 0 && <span className="text-sm font-normal text-[var(--ink-4)]">({visible.length})</span>}
      </h2>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts…"
            rows={4}
            maxLength={MAX_BODY_LEN}
            className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:border-[var(--m-accent)] focus:outline-none"
            disabled={submitting}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`text-xs ${remaining < 100 ? "text-[var(--m-accent)]" : "text-[var(--ink-4)]"}`}>
              {remaining} characters left
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-md bg-[var(--m-accent)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--m-accent-2)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-[var(--m-accent)]">{error}</p>}
        </form>
      ) : (
        <p className="mt-4 text-sm text-[var(--ink-3)]">
          <Link href={loginHref} className="font-semibold text-[var(--m-accent)] hover:underline">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}

      <ul className="mt-8 space-y-5">
        {visible.length === 0 && (
          <li className="text-sm text-[var(--ink-4)]">No comments yet.</li>
        )}
        {visible.map((c) => {
          const dimmed = c.status !== "visible";
          return (
            <li
              key={c.id}
              className={`rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-4 ${dimmed ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--ink-4)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--ink-3)]">{c.username}</span>
                  <time dateTime={c.createdAt}>{formatTimestamp(c.createdAt)}</time>
                  {c.status === "hidden" && (
                    <span className="rounded bg-amber-950/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
                      hidden
                    </span>
                  )}
                  {c.status === "deleted" && (
                    <span className="rounded bg-rose-950/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--m-accent)]">
                      deleted
                    </span>
                  )}
                </div>
                {isSuperadmin && (
                  <div className="flex shrink-0 gap-1.5">
                    {c.status === "visible" && (
                      <button
                        type="button"
                        onClick={() => moderate(c.id, "hide")}
                        disabled={busyId === c.id}
                        className="rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)] disabled:opacity-50"
                      >
                        Hide
                      </button>
                    )}
                    {c.status === "hidden" && (
                      <button
                        type="button"
                        onClick={() => moderate(c.id, "show")}
                        disabled={busyId === c.id}
                        className="rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)] disabled:opacity-50"
                      >
                        Restore
                      </button>
                    )}
                    {c.status !== "deleted" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this comment?")) moderate(c.id, "delete");
                        }}
                        disabled={busyId === c.id}
                        aria-label="Delete comment"
                        className="rounded border border-rose-950/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--m-accent)] hover:bg-rose-950/60 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-2)]">
                {c.body}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
