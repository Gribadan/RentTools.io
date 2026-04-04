"use client";

import { useState, useCallback } from "react";
import type { Guest } from "@/lib/types";

interface GuestCardsProps {
  guests: Guest[];
  checkIn: string;
  checkOut: string;
  onDeleteGuest: (id: number) => void;
  onUpdateParent: (childId: number, parentId: number | null) => void;
}

function CopyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      onClick={handleCopy}
      className="group/field flex cursor-pointer items-center justify-between rounded-md px-2 py-1 transition-all hover:bg-white/5"
    >
      <span className="text-[10px] text-muted-foreground/50">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium">{value || "—"}</span>
        <span className={`text-[9px] transition-all ${copied ? "text-emerald-400" : "text-muted-foreground/0 group-hover/field:text-muted-foreground/30"}`}>
          {copied ? "copied" : "copy"}
        </span>
      </div>
    </div>
  );
}

function GuestCard({
  guest,
  children,
  stayDays,
  onDelete,
  onDrop,
  onDragStart,
}: {
  guest: Guest;
  children: Guest[];
  stayDays: number;
  onDelete: (id: number) => void;
  onDrop: (childId: number, parentId: number) => void;
  onDragStart: (e: React.DragEvent, childId: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const childId = parseInt(e.dataTransfer.getData("text/plain"));
      if (childId && childId !== guest.id) {
        onDrop(childId, guest.id);
      }
    },
    [guest.id, onDrop]
  );

  return (
    <div
      className={`rounded-xl border transition-all ${
        dragOver
          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border/30 bg-card/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-border/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
            guest.gender === "F"
              ? "bg-pink-500/15 text-pink-400"
              : "bg-blue-500/15 text-blue-400"
          }`}>
            {guest.gender || "?"}
          </div>
          <span className="text-sm font-semibold">{guest.fullName}</span>
        </div>
        <button
          onClick={() => onDelete(guest.id)}
          className="rounded-md p-1 text-muted-foreground/25 transition-all hover:bg-destructive/15 hover:text-destructive"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="divide-y divide-border/15">
        {/* Block 1: Citizenship, DOB, Passport */}
        <div className="p-1.5">
          <div className="mb-0.5 px-2 pt-1 text-[9px] font-semibold uppercase tracking-widest text-primary/40">
            Identity
          </div>
          <CopyField label="Citizenship" value={guest.citizenshipCode} />
          <CopyField label="Date of birth" value={guest.dateOfBirth} />
          <CopyField label="Passport" value={guest.passportNumber} />
        </div>

        {/* Block 2: Issue, Authority, Name, Gender, Stay */}
        <div className="p-1.5">
          <div className="mb-0.5 px-2 pt-1 text-[9px] font-semibold uppercase tracking-widest text-primary/40">
            Document
          </div>
          <CopyField label="Date of issue" value={guest.dateOfIssue} />
          <CopyField label="Issued by" value={guest.issuedBy} />
          <CopyField label="Full name" value={`${guest.lastName} ${guest.firstName}`} />
          <CopyField label="Gender" value={guest.gender === "M" ? "Male" : guest.gender === "F" ? "Female" : guest.gender} />
          <CopyField label="Arrived on (days)" value={String(stayDays)} />
        </div>

        {/* Block 3: Visa (only if uploaded) */}
        {guest.hasVisa && (
          <div className="p-1.5">
            <div className="mb-0.5 px-2 pt-1 text-[9px] font-semibold uppercase tracking-widest text-emerald-400/50">
              Visa
            </div>
            <CopyField label="Visa number" value={guest.visaNumber} />
            <CopyField label="Visa from" value={guest.visaFrom} />
            <CopyField label="Visa to" value={guest.visaTo} />
            <CopyField label="Visit type" value="Tourist" />
            <CopyField label="Guest type" value="Other" />
          </div>
        )}

        {/* Block 4: Children (only if any attached) */}
        {children.length > 0 && (
          <div className="p-1.5">
            <div className="mb-0.5 px-2 pt-1 text-[9px] font-semibold uppercase tracking-widest text-amber-400/50">
              Children ({children.length})
            </div>
            {children.map((child) => (
              <div
                key={child.id}
                draggable
                onDragStart={(e) => onDragStart(e, child.id)}
                className="group/child ml-1 cursor-grab rounded-lg border border-border/15 bg-white/[0.02] p-1.5 mb-1 active:cursor-grabbing"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-medium">{child.fullName}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground/30">drag to move</span>
                    <svg className="h-3 w-3 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                    </svg>
                  </div>
                </div>
                <CopyField label="Name" value={child.fullName} />
                <CopyField label="Date of birth" value={child.dateOfBirth} />
                <CopyField label="Gender" value={child.gender === "M" ? "Male" : child.gender === "F" ? "Female" : child.gender} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function GuestCards({
  guests,
  checkIn,
  checkOut,
  onDeleteGuest,
  onUpdateParent,
}: GuestCardsProps) {
  const stayDays = (() => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  })();

  // Separate adults (16+) and children (<16)
  const adults = guests.filter((g) => g.yearsOld >= 16 && g.parentId === null);
  const allChildren = guests.filter((g) => g.yearsOld < 16);

  // Auto-assign unlinked children to first adult
  const unlinkedChildren = allChildren.filter((c) => c.parentId === null);
  if (unlinkedChildren.length > 0 && adults.length > 0) {
    // Auto-link on first render
    for (const child of unlinkedChildren) {
      onUpdateParent(child.id, adults[0].id);
    }
  }

  const getChildrenFor = (parentId: number) =>
    allChildren.filter((c) => c.parentId === parentId);

  const handleDrop = (childId: number, parentId: number) => {
    onUpdateParent(childId, parentId);
  };

  const handleDragStart = (e: React.DragEvent, childId: number) => {
    e.dataTransfer.setData("text/plain", String(childId));
    e.dataTransfer.effectAllowed = "move";
  };

  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/25 py-12">
        <svg className="h-5 w-5 text-muted-foreground/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <p className="text-xs text-muted-foreground/40">No guests — drop passports above to extract</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
          Guests ({adults.length} adult{adults.length !== 1 ? "s" : ""}
          {allChildren.length > 0 && `, ${allChildren.length} child${allChildren.length !== 1 ? "ren" : ""}`})
        </h2>
        <span className="text-[10px] text-muted-foreground/30">Click any value to copy</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adults.map((guest) => (
          <GuestCard
            key={guest.id}
            guest={guest}
            children={getChildrenFor(guest.id)}
            stayDays={stayDays}
            onDelete={onDeleteGuest}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
}
