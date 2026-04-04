"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GuestCards } from "@/components/guest-cards";
import { DateSlider } from "@/components/date-slider";
import type { Guest, Reservation } from "@/lib/types";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "processing";
}

interface ReservationViewProps {
  reservation: Reservation;
  guests: Guest[];
  onGuestsUpdated: () => void;
  onDeleteGuest: (id: number) => void;
  onUpdateReservation: (
    id: number,
    data: { name?: string; checkIn?: string; checkOut?: string; platform?: string }
  ) => void;
  onUpdateParent: (childId: number, parentId: number | null) => void;
}

export function ReservationView({
  reservation,
  guests,
  onGuestsUpdated,
  onDeleteGuest,
  onUpdateReservation,
  onUpdateParent,
}: ReservationViewProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(reservation.name);
  const [editCheckIn, setEditCheckIn] = useState(
    new Date(reservation.checkIn).toISOString().split("T")[0]
  );
  const [editCheckOut, setEditCheckOut] = useState(
    new Date(reservation.checkOut).toISOString().split("T")[0]
  );
  const [editPlatform, setEditPlatform] = useState(
    reservation.platform || "airbnb"
  );
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { time, message, type }]);
    setTimeout(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const extractData = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setLogs([]);

    addLog(`Starting extraction for ${files.length} file(s)...`, "info");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addLog(`[${i + 1}/${files.length}] Processing: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, "processing");

      try {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("reservationId", reservation.id.toString());

        addLog(`[${i + 1}/${files.length}] Sending to Gemini Vision API...`, "processing");

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          addLog(`[${i + 1}/${files.length}] Failed: ${errData.error || "Unknown error"}`, "error");
          continue;
        }

        const json = await response.json();
        const count = json.data?.length || 0;

        if (count > 0) {
          for (const person of json.data) {
            addLog(
              `[${i + 1}/${files.length}] Extracted: ${person.fullName} | ${person.country} | Passport: ${person.passportNumber}`,
              "success"
            );
          }
        } else {
          addLog(`[${i + 1}/${files.length}] No passport data found in ${file.name}`, "error");
        }
      } catch {
        addLog(`[${i + 1}/${files.length}] Network error processing ${file.name}`, "error");
      }
    }

    addLog("Extraction complete.", "info");
    setFiles([]);
    setLoading(false);
    onGuestsUpdated();
  };

  const handleSaveEdit = () => {
    onUpdateReservation(reservation.id, {
      name: editName,
      checkIn: editCheckIn,
      checkOut: editCheckOut,
      platform: editPlatform,
    });
    setEditing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const stayDays = () => {
    const d1 = new Date(reservation.checkIn);
    const d2 = new Date(reservation.checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Reservation Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3 rounded-xl border border-border/60 bg-card/50 p-4">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-lg font-bold outline-none focus:border-primary/50"
              />
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg bg-background/50 p-0.5">
                  {(["airbnb", "booking"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPlatform(p)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        editPlatform === p
                          ? p === "airbnb"
                            ? "bg-[#FF5A5F]/15 text-[#FF5A5F] shadow-sm"
                            : "bg-[#003580]/20 text-[#4B9CD3] shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p === "airbnb" ? "Airbnb" : "Booking"}
                    </button>
                  ))}
                </div>
              </div>
              <DateSlider
                checkIn={editCheckIn}
                checkOut={editCheckOut}
                onChangeCheckIn={setEditCheckIn}
                onChangeCheckOut={setEditCheckOut}
              />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-lg text-xs" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  {reservation.name}
                </h1>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md p-1 text-muted-foreground/60 transition-all hover:bg-muted/50 hover:text-foreground"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  reservation.platform === "booking"
                    ? "bg-[#003580]/20 text-[#4B9CD3]"
                    : "bg-[#FF5A5F]/10 text-[#FF5A5F]"
                }`}>
                  {reservation.platform === "booking" ? "Booking.com" : "Airbnb"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(reservation.checkIn)} — {formatDate(reservation.checkOut)}
                </span>
                <Badge variant="outline" className="rounded-md text-xs">
                  {stayDays()} days
                </Badge>
                {guests.length > 0 && (
                  <Badge variant="secondary" className="rounded-md text-xs">
                    {guests.length} guest{guests.length !== 1 && "s"}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <details className="group rounded-xl border border-border/40 bg-card/30">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <svg className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          Registration Instructions
        </summary>
        <div className="border-t border-border/30 px-4 py-3">
          <ol className="space-y-2.5 text-[13px] leading-relaxed">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">1</span>
              <span>
                Go to{" "}
                <a href="https://emehmon.uz/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
                  emehmon.uz
                </a>
                {" "}<span className="text-muted-foreground">— select &quot;для физических лиц&quot;</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">2</span>
              <span>
                Login:{" "}
                <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">asminkin</code>{" "}
                / <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">wEq4782bst123$</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">3</span>
              <span className="text-muted-foreground">
                Мои листки → Создать → Выбираем гражданство → Дату рождения → Вводим паспортные данные. Заполняем 3 вкладки по визам и дням.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">4</span>
              <span className="text-muted-foreground">Оплачиваем</span>
            </li>
          </ol>
        </div>
      </details>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border/40 hover:border-primary/30 hover:bg-muted/10"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex min-h-[100px] flex-col items-center justify-center p-6">
          <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            isDragActive ? "bg-primary/15 text-primary scale-110" : "bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          }`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium">
            {isDragActive ? "Drop here..." : "Drop passport documents"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">JPG, PNG, PDF</p>
        </div>
      </div>

      {/* Staged Files */}
      {files.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/30 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-[11px]"
              >
                {file.name}
                <button
                  onClick={() => removeFile(index)}
                  className="ml-0.5 rounded p-0.5 hover:bg-foreground/10"
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex shrink-0 gap-2 ml-3">
            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[11px]" onClick={() => setFiles([])}>
              Clear
            </Button>
            <Button onClick={extractData} disabled={loading} size="sm" className="h-7 rounded-lg text-[11px]">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting...
                </span>
              ) : (
                `Extract (${files.length})`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Guests */}
      <GuestCards
        guests={guests}
        checkIn={reservation.checkIn}
        checkOut={reservation.checkOut}
        onDeleteGuest={onDeleteGuest}
        onUpdateParent={onUpdateParent}
      />

      {/* Extraction Log — below guests */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-[#21262d] bg-[#0d1117]">
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-2.5">
            <span className="text-xs font-medium text-[#9198a1]">
              Extraction Log
            </span>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-[#7d8590] hover:text-[#f0f6fc]"
            >
              Clear
            </button>
          </div>
          <div ref={logRef} className="overflow-y-auto p-4 font-[family-name:var(--font-mono)] text-xs leading-relaxed" style={{ maxHeight: 200 }}>
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="shrink-0 text-[#7d8590]">{log.time}</span>
                <span
                  className={
                    log.type === "success"
                      ? "text-[#3fb950]"
                      : log.type === "error"
                      ? "text-[#f85149]"
                      : log.type === "processing"
                      ? "text-[#d29922]"
                      : "text-[#9198a1]"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
