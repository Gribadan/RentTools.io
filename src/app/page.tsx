"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { ReservationView } from "@/components/reservation-view";
import { SettingsPanel } from "@/components/settings-panel";
import { Button } from "@/components/ui/button";
import type { Property, Guest } from "@/lib/types";

function AppContent({
  user,
}: {
  user: { userId: number; username: string; role: string };
}) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null
  );
  const [selectedReservationId, setSelectedReservationId] = useState<
    number | null
  >(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedReservationId) {
      fetchGuests(selectedReservationId);
    } else {
      setGuests([]);
    }
  }, [selectedReservationId]);

  const fetchProperties = async () => {
    const res = await fetch("/api/properties");
    const data = await res.json();
    setProperties(data);
  };

  const fetchGuests = async (reservationId: number) => {
    const res = await fetch(`/api/guests?reservationId=${reservationId}`);
    const data = await res.json();
    setGuests(data);
  };

  const handleAddProperty = async (name: string) => {
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) await fetchProperties();
  };

  const handleDeleteProperty = async (id: number) => {
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (selectedPropertyId === id) {
      setSelectedPropertyId(null);
      setSelectedReservationId(null);
    }
    await fetchProperties();
  };

  const handleAddReservation = async (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    propertyId: number;
  }) => {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await fetchProperties();
  };

  const handleDeleteReservation = async (id: number) => {
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    if (selectedReservationId === id) setSelectedReservationId(null);
    await fetchProperties();
  };

  const handleDeleteGuest = async (id: number) => {
    await fetch(`/api/guests/${id}`, { method: "DELETE" });
    if (selectedReservationId) {
      await fetchGuests(selectedReservationId);
      await fetchProperties();
    }
  };

  const handleGuestsUpdated = useCallback(() => {
    if (selectedReservationId) {
      fetchGuests(selectedReservationId);
      fetchProperties();
    }
  }, [selectedReservationId]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const selectedProperty = properties.find(
    (p) => p.id === selectedPropertyId
  );
  const selectedReservation = selectedProperty?.reservations.find(
    (r) => r.id === selectedReservationId
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-card/80 px-5 backdrop-blur-sm">
        <div
          className="flex cursor-pointer items-center gap-2.5"
          onClick={() => setShowSettings(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight">Rent Tool</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 rounded-lg bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
            {user.username}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              showSettings
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      {showSettings ? (
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-2xl">
            <SettingsPanel
              userRole={user.role}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </main>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            selectedReservationId={selectedReservationId}
            onSelectProperty={setSelectedPropertyId}
            onSelectReservation={setSelectedReservationId}
            onAddProperty={handleAddProperty}
            onDeleteProperty={handleDeleteProperty}
            onAddReservation={handleAddReservation}
            onDeleteReservation={handleDeleteReservation}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {selectedReservation ? (
              <ReservationView
                key={selectedReservation.id}
                reservation={selectedReservation}
                guests={guests}
                onGuestsUpdated={handleGuestsUpdated}
                onDeleteGuest={handleDeleteGuest}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-border/30">
                    <svg className="h-7 w-7 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground/80">No reservation selected</p>
                    <p className="mt-1 text-sm text-muted-foreground/60">
                      {properties.length === 0
                        ? "Create a property in the sidebar to get started"
                        : "Select a reservation from the sidebar"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return <AuthGuard>{(user) => <AppContent user={user} />}</AuthGuard>;
}
