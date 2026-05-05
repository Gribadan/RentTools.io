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
    <section className="mt-12 border-t border-[#1e2329] pt-8">
      <h2 className="text-lg font-semibold text-[#e8e8ec]">
        Comments {visible.length > 0 && <span className="text-sm font-normal text-[#71717a]">({visible.length})</span>}
      </h2>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts…"
            rows={4}
            maxLength={MAX_BODY_LEN}
            className="w-full rounded-md border border-[#1e2329] bg-[#0d1117] px-3 py-2 text-sm text-[#e8e8ec] placeholder:text-[#52525b] focus:border-[#ff385c] focus:outline-none"
            disabled={submitting}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`text-xs ${remaining < 100 ? "text-[#ff385c]" : "text-[#71717a]"}`}>
              {remaining} characters left
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-md bg-[#ff385c] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#e0314f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-[#ff385c]">{error}</p>}
        </form>
      ) : (
        <p className="mt-4 text-sm text-[#a0a0a8]">
          <Link href={loginHref} className="font-semibold text-[#ff385c] hover:underline">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}

      <ul className="mt-8 space-y-5">
        {visible.length === 0 && (
          <li className="text-sm text-[#71717a]">No comments yet.</li>
        )}
        {visible.map((c) => {
          const dimmed = c.status !== "visible";
          return (
            <li
              key={c.id}
              className={`rounded-md border border-[#1e2329] bg-[#11161d] p-4 ${dimmed ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between gap-3 text-xs text-[#71717a]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#a0a0a8]">{c.username}</span>
                  <time dateTime={c.createdAt}>{formatTimestamp(c.createdAt)}</time>
                  {c.status === "hidden" && (
                    <span className="rounded bg-[#332b1a] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#f0a35a]">
                      hidden
                    </span>
                  )}
                  {c.status === "deleted" && (
                    <span className="rounded bg-[#3a1a1a] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#ff385c]">
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
                        className="rounded border border-[#1e2329] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#a0a0a8] hover:border-[#2a313b] hover:text-[#e8e8ec] disabled:opacity-50"
                      >
                        Hide
                      </button>
                    )}
                    {c.status === "hidden" && (
                      <button
                        type="button"
                        onClick={() => moderate(c.id, "show")}
                        disabled={busyId === c.id}
                        className="rounded border border-[#1e2329] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#a0a0a8] hover:border-[#2a313b] hover:text-[#e8e8ec] disabled:opacity-50"
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
                        className="rounded border border-[#3a1a1a] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#ff385c] hover:bg-[#1f0d12] disabled:opacity-50"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#d4d4d8]">
                {c.body}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
