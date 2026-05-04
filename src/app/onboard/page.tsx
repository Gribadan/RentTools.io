"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DraftLink {
  platform: string;
  icalExportUrl: string;
}

interface DraftState {
  propertyName: string;
  airbnb: string;
  booking: string;
}

const STEP_LABELS = ["Property", "Airbnb", "Booking", "Done"];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<DraftState>({ propertyName: "", airbnb: "", booking: "" });
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { draft: { propertyName: string; links: DraftLink[] } | null } | null) => {
        if (cancelled || !data?.draft) {
          setHydrated(true);
          return;
        }
        const ab = data.draft.links.find((l) => l.platform === "airbnb")?.icalExportUrl ?? "";
        const bk = data.draft.links.find((l) => l.platform === "booking")?.icalExportUrl ?? "";
        setState({ propertyName: data.draft.propertyName, airbnb: ab, booking: bk });
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const links = useMemo<DraftLink[]>(() => {
    const out: DraftLink[] = [];
    if (state.airbnb.trim()) out.push({ platform: "airbnb", icalExportUrl: state.airbnb.trim() });
    if (state.booking.trim()) out.push({ platform: "booking", icalExportUrl: state.booking.trim() });
    return out;
  }, [state.airbnb, state.booking]);

  const persist = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyName: state.propertyName.trim(), links }),
      });
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    await persist();
    setStep((s) => Math.min(s + 1, 4));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSaveAndSignup = async () => {
    await persist();
    router.push("/signup?from=onboard");
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8e8ec]">
      <header className="border-b border-[#1e2329]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e1e22]">
              <svg className="h-4 w-4 text-[#e8e8ec]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
              </svg>
            </div>
            <span className="text-base font-semibold">RentTools</span>
          </Link>
          <Link href="/login" className="text-sm text-[#a0a0a8] hover:text-[#e8e8ec]">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-center gap-2 text-xs text-[#71717a]">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done
                      ? "bg-[#3fb950] text-[#0d1117]"
                      : active
                        ? "bg-[#ff385c] text-white"
                        : "bg-[#1e1e22] text-[#71717a]"
                  }`}
                >
                  {n}
                </span>
                <span className={active ? "text-[#e8e8ec]" : ""}>{label}</span>
                {n < STEP_LABELS.length && <span className="mx-1 text-[#333338]">/</span>}
              </div>
            );
          })}
        </div>

        {!hydrated ? (
          <div className="rounded-lg border border-[#1e2329] bg-[#0f1419] p-8 text-center text-sm text-[#71717a]">
            Loading…
          </div>
        ) : (
          <div className="rounded-lg border border-[#1e2329] bg-[#0f1419] p-6 sm:p-8 space-y-5">
            {step === 1 && (
              <>
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">Name your property</h1>
                  <p className="mt-1 text-sm text-[#a0a0a8]">
                    Just a label for you — &ldquo;Tashkent studio&rdquo;, &ldquo;Sea view 2BR&rdquo;.
                    You can change it later.
                  </p>
                </div>
                <input
                  value={state.propertyName}
                  onChange={(e) => setState((s) => ({ ...s, propertyName: e.target.value }))}
                  placeholder="My first property"
                  className="h-11 w-full rounded-md border border-[#333338] bg-[#0d1117] px-3 text-sm text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec]"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={goNext}
                    disabled={!state.propertyName.trim() || saving}
                    className="h-10 rounded-md bg-[#ff385c] px-5 text-sm font-medium text-white hover:bg-[#e0294d] disabled:opacity-40"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">Paste your Airbnb iCal URL</h1>
                  <p className="mt-1 text-sm text-[#a0a0a8]">
                    Open Airbnb → Calendar → Availability settings → Sync calendars → Export. Skip
                    if you don&apos;t use Airbnb.
                  </p>
                </div>
                <input
                  value={state.airbnb}
                  onChange={(e) => setState((s) => ({ ...s, airbnb: e.target.value }))}
                  placeholder="https://www.airbnb.com/calendar/ical/…"
                  className="h-11 w-full rounded-md border border-[#333338] bg-[#0d1117] px-3 text-sm text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec]"
                />
                <div className="flex justify-between gap-2">
                  <button onClick={goBack} className="h-10 rounded-md px-3 text-sm text-[#a0a0a8] hover:text-[#e8e8ec]">
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button onClick={goNext} className="h-10 rounded-md bg-[#1e1e22] px-4 text-sm text-[#a0a0a8] hover:text-[#e8e8ec]">
                      Skip
                    </button>
                    <button
                      onClick={goNext}
                      disabled={saving}
                      className="h-10 rounded-md bg-[#ff385c] px-5 text-sm font-medium text-white hover:bg-[#e0294d] disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">Paste your Booking.com iCal URL</h1>
                  <p className="mt-1 text-sm text-[#a0a0a8]">
                    Open admin.booking.com → Rates &amp; Availability → Sync calendars → Export. Skip
                    if you don&apos;t use Booking.com.
                  </p>
                </div>
                <input
                  value={state.booking}
                  onChange={(e) => setState((s) => ({ ...s, booking: e.target.value }))}
                  placeholder="https://admin.booking.com/…/ical.html?…"
                  className="h-11 w-full rounded-md border border-[#333338] bg-[#0d1117] px-3 text-sm text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec]"
                />
                <div className="flex justify-between gap-2">
                  <button onClick={goBack} className="h-10 rounded-md px-3 text-sm text-[#a0a0a8] hover:text-[#e8e8ec]">
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button onClick={goNext} className="h-10 rounded-md bg-[#1e1e22] px-4 text-sm text-[#a0a0a8] hover:text-[#e8e8ec]">
                      Skip
                    </button>
                    <button
                      onClick={goNext}
                      disabled={saving}
                      className="h-10 rounded-md bg-[#ff385c] px-5 text-sm font-medium text-white hover:bg-[#e0294d] disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">Almost there</h1>
                  <p className="mt-1 text-sm text-[#a0a0a8]">
                    Save what you&apos;ve done — create a free account in 30 seconds. Your property
                    and {links.length === 1 ? "link" : `${links.length} links`} are ready to go.
                  </p>
                </div>
                <div className="rounded-md border border-[#1e2329] bg-[#0d1117] p-4 text-sm space-y-2">
                  <Row label="Property name" value={state.propertyName || "—"} />
                  <Row label="Airbnb iCal" value={state.airbnb ? "✓ saved" : "skipped"} />
                  <Row label="Booking.com iCal" value={state.booking ? "✓ saved" : "skipped"} />
                </div>
                <div className="rounded-md border border-[#1e2329] bg-[#0d1117] p-4">
                  <p className="text-xs text-[#71717a]">
                    After signup we&apos;ll generate two feed URLs — one to paste back into Airbnb,
                    one into Booking. They include buffer days for cleaning, which the platforms
                    can&apos;t do natively.
                  </p>
                </div>
                <div className="flex justify-between gap-2">
                  <button onClick={goBack} className="h-10 rounded-md px-3 text-sm text-[#a0a0a8] hover:text-[#e8e8ec]">
                    Back
                  </button>
                  <button
                    onClick={handleSaveAndSignup}
                    disabled={saving}
                    className="h-10 rounded-md bg-[#ff385c] px-5 text-sm font-medium text-white hover:bg-[#e0294d] disabled:opacity-40"
                  >
                    Save — create free account
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[#71717a]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#e8e8ec] hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#71717a]">{label}</span>
      <span className="truncate text-[#d4d4d8]">{value}</span>
    </div>
  );
}
