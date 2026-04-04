"use client";

import { useState, useEffect } from "react";
import { DateSlider } from "@/components/date-slider";
import type { Property } from "@/lib/types";

interface DashboardProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (id: number) => void;
  onSelectReservation: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
}

export function Dashboard({
  properties,
  selectedProperty,
  onSelectProperty,
  onSelectReservation,
  onAddReservation,
}: DashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPropertyId, setFormPropertyId] = useState<number | "">(
    selectedProperty?.id || (properties.length > 0 ? properties[0].id : "")
  );
  const [formPlatform, setFormPlatform] = useState("airbnb");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");

  // Update formPropertyId when selectedProperty changes
  useEffect(() => {
    if (selectedProperty) {
      setFormPropertyId(selectedProperty.id);
    }
  }, [selectedProperty]);

  // Get reservations to display
  const displayReservations = selectedProperty
    ? selectedProperty.reservations
        .map((r) => ({ ...r, propertyName: selectedProperty.name, propertyId: selectedProperty.id }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : properties
        .flatMap((p) =>
          p.reservations.map((r) => ({
            ...r,
            propertyName: p.name,
            propertyId: p.id,
          }))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCheckIn || !formCheckOut || !formPropertyId) return;
    onAddReservation({
      name: formName.trim(),
      checkIn: formCheckIn,
      checkOut: formCheckOut,
      platform: formPlatform,
      propertyId: Number(formPropertyId),
    });
    setFormName("");
    setFormCheckIn("");
    setFormCheckOut("");
    setShowForm(false);
  };

  const handleRowClick = (propertyId: number, reservationId: number) => {
    onSelectProperty(propertyId);
    setTimeout(() => onSelectReservation(reservationId), 50);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const dayCount = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const title = selectedProperty ? selectedProperty.name : "Dashboard";
  const subtitle = selectedProperty
    ? `${displayReservations.length} reservation${displayReservations.length !== 1 ? "s" : ""}`
    : `${displayReservations.length} reservation${displayReservations.length !== 1 ? "s" : ""} across ${properties.length} propert${properties.length !== 1 ? "ies" : "y"}`;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f6fc]">{title}</h1>
          <p className="mt-1 text-sm text-[#9198a1]">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-[#238636] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ea043]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Reservation
        </button>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-[#30363d] bg-[#161b22] p-5">
          <h2 className="mb-4 text-sm font-medium text-[#f0f6fc]">New Reservation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Property select */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#9198a1]">Property</label>
                <div className="relative">
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(Number(e.target.value))}
                    className="h-9 w-full appearance-none rounded-md border border-[#30363d] bg-[#0d1117] pl-3 pr-8 text-sm text-[#f0f6fc] outline-none transition-colors focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/30"
                    required
                  >
                    <option value="" disabled>Select property...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8590]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* Guest name */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#9198a1]">Guest name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter name..."
                  className="h-9 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#f0f6fc] placeholder-[#7d8590] outline-none transition-colors focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/30"
                  required
                />
              </div>
            </div>

            {/* Platform */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#9198a1]">Platform</label>
              <div className="flex w-fit rounded-md border border-[#30363d] bg-[#0d1117] p-0.5">
                {(["airbnb", "booking"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormPlatform(p)}
                    className={`rounded-[5px] px-4 py-1.5 text-xs font-medium transition-all ${
                      formPlatform === p
                        ? p === "airbnb"
                          ? "bg-[#FF5A5F]/15 text-[#f78166]"
                          : "bg-[#003580]/25 text-[#79c0ff]"
                        : "text-[#7d8590] hover:text-[#9198a1]"
                    }`}
                  >
                    {p === "airbnb" ? "Airbnb" : "Booking"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#9198a1]">Dates</label>
              <DateSlider
                checkIn={formCheckIn}
                checkOut={formCheckOut}
                onChangeCheckIn={setFormCheckIn}
                onChangeCheckOut={setFormCheckOut}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="rounded-md bg-[#238636] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ea043]"
              >
                Create Reservation
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-[#9198a1] hover:text-[#f0f6fc]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reservations List */}
      {displayReservations.length > 0 ? (
        <div className="rounded-lg border border-[#21262d] bg-[#161b22]">
          <div className="border-b border-[#21262d] px-4 py-3">
            <h2 className="text-xs font-medium text-[#9198a1]">
              {selectedProperty ? "Reservations" : "Recent Reservations"}
            </h2>
          </div>
          <div>
            {displayReservations.map((res, i) => (
              <div
                key={res.id}
                onClick={() => handleRowClick(res.propertyId, res.id)}
                className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[#1c2128] ${
                  i < displayReservations.length - 1 ? "border-b border-[#21262d]/50" : ""
                }`}
              >
                {/* Platform dot */}
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    res.platform === "booking" ? "bg-[#79c0ff]" : "bg-[#f78166]"
                  }`}
                />

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[#f0f6fc]">{res.name}</span>
                </div>

                {/* Property (only in global view) */}
                {!selectedProperty && (
                  <span className="hidden text-sm text-[#9198a1] sm:block">
                    {res.propertyName}
                  </span>
                )}

                {/* Platform badge */}
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                    res.platform === "booking"
                      ? "bg-[#003580]/20 text-[#79c0ff]"
                      : "bg-[#FF5A5F]/10 text-[#f78166]"
                  }`}
                >
                  {res.platform === "booking" ? "Booking" : "Airbnb"}
                </span>

                {/* Dates */}
                <span className="shrink-0 text-sm text-[#9198a1]">
                  {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
                </span>

                {/* Days */}
                <span className="shrink-0 w-10 text-right text-xs text-[#7d8590]">
                  {dayCount(res.checkIn, res.checkOut)}d
                </span>

                {/* Guest count */}
                <span className="shrink-0 w-10 text-right text-xs text-[#7d8590]">
                  {res._count?.guests || 0}
                  <span className="ml-0.5 text-[#30363d]">g</span>
                </span>

                {/* Arrow */}
                <svg className="h-4 w-4 shrink-0 text-[#30363d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#21262d] py-16 text-center">
          <p className="text-sm text-[#7d8590]">
            {selectedProperty
              ? "No reservations yet. Click 'New Reservation' to create one."
              : "No reservations yet. Create a property and add reservations to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
