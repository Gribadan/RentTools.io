"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      {/* Reservation Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {reservation.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(reservation.checkIn)} — {formatDate(reservation.checkOut)}
        </p>
      </div>

      {/* Drop Zone */}
      <Card className="border-dashed border-2">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg p-8 transition-colors ${
              isDragActive
                ? "bg-primary/5 border-primary"
                : "hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragActive
                    ? "Drop files here..."
                    : "Drop passport documents"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  JPG, PNG, or PDF
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staged Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 && "s"} ready
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
              >
                Clear
              </Button>
              <Button onClick={extractData} disabled={loading} size="sm">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
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
                className="gap-1 pr-1 text-xs"
              >
                {file.name}
                <button
                  onClick={() => removeFile(index)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Guests Table */}
      {guests.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Guests ({guests.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Passport No.</TableHead>
                      <TableHead>Issued By</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">
                          {guest.fullName}
                        </TableCell>
                        <TableCell>{guest.country}</TableCell>
                        <TableCell>{guest.dateOfBirth}</TableCell>
                        <TableCell>{guest.yearsOld}</TableCell>
                        <TableCell>{guest.dateOfIssue}</TableCell>
                        <TableCell>{guest.expiryDate}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {guest.passportNumber}
                        </TableCell>
                        <TableCell>{guest.issuedBy}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => onDeleteGuest(guest.id)}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {guests.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No guests yet. Drop passport documents above and click Extract Data.
          </p>
        </div>
      )}
    </div>
  );
}
