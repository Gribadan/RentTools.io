"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
        propertyId,
      });
      setResName("");
      setResCheckIn("");
      setResCheckOut("");
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
    <div className="flex h-full w-[300px] flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setShowPropertyInput(!showPropertyInput)}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </Button>
      </div>

      {/* Add Property Input */}
      {showPropertyInput && (
        <div className="px-4 pb-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddProperty();
            }}
            className="flex gap-1.5"
          >
            <Input
              placeholder="Property name..."
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <Button type="submit" size="sm" className="h-8 px-3">
              Add
            </Button>
          </form>
        </div>
      )}

      <Separator />

      {/* Property List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {properties.length === 0 && (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">
              No properties yet. Click + to add one.
            </p>
          )}

          {properties.map((property) => {
            const isSelected = property.id === selectedPropertyId;

            return (
              <div key={property.id} className="mb-1">
                {/* Property Item */}
                <div
                  className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => onSelectProperty(property.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21"
                      />
                    </svg>
                    <span className="truncate font-medium">
                      {property.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProperty(property.id);
                    }}
                    className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
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
                </div>

                {/* Reservations under selected property */}
                {isSelected && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                    {property.reservations.map((res: Reservation) => (
                      <div
                        key={res.id}
                        className={`group/res flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                          res.id === selectedReservationId
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                        onClick={() => onSelectReservation(res.id)}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{res.name}</div>
                          <div className="text-[10px] opacity-70">
                            {formatDate(res.checkIn)} —{" "}
                            {formatDate(res.checkOut)}
                            {res._count && res._count.guests > 0 && (
                              <span className="ml-1">
                                · {res._count.guests} guest
                                {res._count.guests !== 1 && "s"}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteReservation(res.id);
                          }}
                          className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover/res:opacity-100"
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
                      </div>
                    ))}

                    {/* Add Reservation */}
                    {showReservationForm === property.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddReservation(property.id);
                        }}
                        className="space-y-1.5 py-1"
                      >
                        <Input
                          placeholder="Reservation name..."
                          value={resName}
                          onChange={(e) => setResName(e.target.value)}
                          className="h-7 text-xs"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Input
                            type="date"
                            value={resCheckIn}
                            onChange={(e) => setResCheckIn(e.target.value)}
                            className="h-7 text-xs"
                          />
                          <Input
                            type="date"
                            value={resCheckOut}
                            onChange={(e) => setResCheckOut(e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="submit"
                            size="sm"
                            className="h-7 flex-1 text-xs"
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowReservationForm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowReservationForm(property.id)}
                        className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
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
