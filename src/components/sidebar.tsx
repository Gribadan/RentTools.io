"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Property, Reservation } from "@/lib/types";

interface SidebarProps {
  properties: Property[];
  selectedPropertyId: number | null;
  selectedReservationId: number | null;
  onSelectProperty: (id: number) => void;
  onSelectReservation: (id: number) => void;
  onAddProperty: (name: string) => void;
  onDeleteProperty: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
  onDeleteReservation: (id: number) => void;
}

export function Sidebar({
  properties,
  selectedPropertyId,
  selectedReservationId,
  onSelectProperty,
  onSelectReservation,
  onAddProperty,
  onDeleteProperty,
  onAddReservation,
  onDeleteReservation,
}: SidebarProps) {
  const [newPropertyName, setNewPropertyName] = useState("");
  const [showPropertyInput, setShowPropertyInput] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState<number | null>(
    null
  );
  const [resName, setResName] = useState("");
  const [resCheckIn, setResCheckIn] = useState("");
  const [resCheckOut, setResCheckOut] = useState("");
  const [resPlatform, setResPlatform] = useState("airbnb");

  const handleAddProperty = () => {
    if (newPropertyName.trim()) {
      onAddProperty(newPropertyName.trim());
      setNewPropertyName("");
      setShowPropertyInput(false);
    }
  };

  const handleAddReservation = (propertyId: number) => {
    if (resName.trim() && resCheckIn && resCheckOut) {
      onAddReservation({
        name: resName.trim(),
        checkIn: resCheckIn,
        checkOut: resCheckOut,
        platform: resPlatform,
        propertyId,
      });
      setResName("");
      setResCheckIn("");
      setResCheckOut("");
      setResPlatform("airbnb");
      setShowReservationForm(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="flex h-full w-[280px] flex-col border-r border-border/50 bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Properties
        </h2>
        <button
          onClick={() => setShowPropertyInput(!showPropertyInput)}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Add Property Input */}
      {showPropertyInput && (
        <div className="px-4 pb-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleAddProperty(); }}
            className="flex gap-1.5"
          >
            <Input
              placeholder="Property name..."
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              className="h-8 rounded-lg bg-background/50 text-sm"
              autoFocus
            />
            <Button type="submit" size="sm" className="h-8 rounded-lg px-3 text-xs">
              Add
            </Button>
          </form>
        </div>
      )}

      <div className="mx-4 h-px bg-border/50" />

      {/* Property List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {properties.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-2 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                <svg className="h-5 w-5 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
                </svg>
              </div>
              <p className="text-xs text-muted-foreground/60">
                No properties yet
              </p>
            </div>
          )}

          {properties.map((property) => {
            const isSelected = property.id === selectedPropertyId;
            const totalGuests = property.reservations.reduce(
              (sum, r) => sum + (r._count?.guests || 0), 0
            );

            return (
              <div key={property.id}>
                {/* Property Item */}
                <div
                  className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${
                    isSelected
                      ? "bg-accent/80 text-accent-foreground shadow-sm"
                      : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                  }`}
                  onClick={() => onSelectProperty(property.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isSelected ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                    }`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-[13px]">
                        {property.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {property.reservations.length} reservation{property.reservations.length !== 1 && "s"}
                        {totalGuests > 0 && ` · ${totalGuests} guest${totalGuests !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProperty(property.id); }}
                    className="shrink-0 rounded-md p-1 opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>

                {/* Reservations under selected property */}
                {isSelected && (
                  <div className="ml-5 mt-1 mb-2 space-y-0.5 border-l-2 border-primary/20 pl-3">
                    {property.reservations.map((res: Reservation) => {
                      const isResSelected = res.id === selectedReservationId;
                      return (
                        <div
                          key={res.id}
                          className={`group/res flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 transition-all ${
                            isResSelected
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                          onClick={() => onSelectReservation(res.id)}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-medium">{res.name}</span>
                              <span className={`shrink-0 rounded px-1 py-px text-[9px] font-semibold leading-tight ${
                                res.platform === "booking"
                                  ? "bg-[#003580]/15 text-[#003580] dark:bg-[#003580]/25 dark:text-[#4B9CD3]"
                                  : "bg-[#FF5A5F]/10 text-[#FF5A5F]"
                              }`}>
                                {res.platform === "booking" ? "B" : "A"}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] opacity-70">
                              {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
                              {res._count && res._count.guests > 0 && (
                                <span className="ml-0.5">
                                  · {res._count.guests}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteReservation(res.id); }}
                            className="shrink-0 rounded-md p-0.5 opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover/res:opacity-100"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}

                    {/* Add Reservation */}
                    {showReservationForm === property.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleAddReservation(property.id); }}
                        className="space-y-2 rounded-lg bg-muted/30 p-2.5"
                      >
                        <Input
                          placeholder="Guest / reservation name..."
                          value={resName}
                          onChange={(e) => setResName(e.target.value)}
                          className="h-7 rounded-md bg-background/50 text-xs"
                          autoFocus
                        />
                        {/* Platform toggle */}
                        <div className="flex rounded-md bg-background/50 p-0.5">
                          <button
                            type="button"
                            onClick={() => setResPlatform("airbnb")}
                            className={`flex-1 rounded-[5px] px-2 py-1 text-[10px] font-medium transition-all ${
                              resPlatform === "airbnb"
                                ? "bg-[#FF5A5F]/15 text-[#FF5A5F] shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Airbnb
                          </button>
                          <button
                            type="button"
                            onClick={() => setResPlatform("booking")}
                            className={`flex-1 rounded-[5px] px-2 py-1 text-[10px] font-medium transition-all ${
                              resPlatform === "booking"
                                ? "bg-[#003580]/15 text-[#003580] dark:bg-[#003580]/25 dark:text-[#4B9CD3] shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Booking
                          </button>
                        </div>
                        {/* Date inputs - compact */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-7 text-[10px] text-muted-foreground">In</span>
                            <input
                              type="date"
                              value={resCheckIn}
                              onChange={(e) => setResCheckIn(e.target.value)}
                              className="h-7 flex-1 rounded-md border border-border/50 bg-background/50 px-2 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-7 text-[10px] text-muted-foreground">Out</span>
                            <input
                              type="date"
                              value={resCheckOut}
                              onChange={(e) => setResCheckOut(e.target.value)}
                              className="h-7 flex-1 rounded-md border border-border/50 bg-background/50 px-2 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button type="submit" size="sm" className="h-7 flex-1 rounded-md text-xs">
                            Add
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="h-7 rounded-md text-xs"
                            onClick={() => setShowReservationForm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowReservationForm(property.id)}
                        className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground/60 transition-all hover:bg-muted/40 hover:text-muted-foreground"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add reservation
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
