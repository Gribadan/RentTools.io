"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Guest, Reservation } from "@/lib/types";

interface ReservationViewProps {
  reservation: Reservation;
  guests: Guest[];
  onGuestsUpdated: () => void;
  onDeleteGuest: (id: number) => void;
}

export function ReservationView({
  reservation,
  guests,
  onGuestsUpdated,
  onDeleteGuest,
}: ReservationViewProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("reservationId", reservation.id.toString());

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Extraction failed");

      setFiles([]);
      onGuestsUpdated();
    } catch {
      setError("Failed to extract data. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const daysBetween = () => {
    const d1 = new Date(reservation.checkIn);
    const d2 = new Date(reservation.checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Reservation Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {reservation.name}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDate(reservation.checkIn)} — {formatDate(reservation.checkOut)}
            </div>
            <Badge variant="outline" className="rounded-md text-[10px] font-medium">
              {daysBetween()} nights
            </Badge>
            {guests.length > 0 && (
              <Badge variant="secondary" className="rounded-md text-[10px] font-medium">
                {guests.length} guest{guests.length !== 1 && "s"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragActive
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
            : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex min-h-[160px] flex-col items-center justify-center p-8">
          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
            isDragActive ? "bg-primary/15 text-primary scale-110" : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          }`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium">
            {isDragActive ? "Drop files here..." : "Drop passport documents"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            JPG, PNG, or PDF — drag multiple files at once
          </p>
        </div>
      </div>

      {/* Staged Files */}
      {files.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {files.length} file{files.length !== 1 && "s"} ready
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setFiles([])}>
                Clear
              </Button>
              <Button onClick={extractData} disabled={loading} size="sm" className="h-8 rounded-lg text-xs">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Extracting...
                  </span>
                ) : (
                  "Extract Data"
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {files.map((file, index) => (
              <Badge
                key={`${file.name}-${index}`}
                variant="secondary"
                className="gap-1.5 rounded-lg pr-1.5 text-xs"
              >
                <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                {file.name}
                <button
                  onClick={() => removeFile(index)}
                  className="rounded-md p-0.5 transition-colors hover:bg-foreground/10"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Guests Table */}
      {guests.length > 0 ? (
        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Guests
          </h2>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/50">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Full Name</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Country</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">DOB</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Age</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Issued</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Expiry</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Passport No.</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Issued By</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id} className="border-border/30 transition-colors">
                      <TableCell className="font-medium">{guest.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{guest.country}</TableCell>
                      <TableCell className="text-muted-foreground">{guest.dateOfBirth}</TableCell>
                      <TableCell>
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-muted/50 px-1.5 text-xs font-medium">
                          {guest.yearsOld}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{guest.dateOfIssue}</TableCell>
                      <TableCell className="text-muted-foreground">{guest.expiryDate}</TableCell>
                      <TableCell>
                        <code className="rounded-md bg-muted/50 px-1.5 py-0.5 font-mono text-xs">
                          {guest.passportNumber}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{guest.issuedBy}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => onDeleteGuest(guest.id)}
                          className="rounded-md p-1.5 text-muted-foreground/50 transition-all hover:bg-destructive/15 hover:text-destructive"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/40 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30">
            <svg className="h-5 w-5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground/50">
            No guests yet — drop passport documents above
          </p>
        </div>
      )}
    </div>
  );
}
