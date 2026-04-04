"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { ReservationView } from "@/components/reservation-view";
import { SettingsPanel } from "@/components/settings-panel";
import { Dashboard } from "@/components/dashboard";
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
    platform: string;
    propertyId: number;
  }) => {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await fetchProperties();
  };

  const handleUpdateReservation = async (
    id: number,
    data: { name?: string; checkIn?: string; checkOut?: string; platform?: string }
  ) => {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
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

  const handleUpdateParent = async (childId: number, parentId: number | null) => {
    await fetch(`/api/guests/${childId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId }),
    });
    if (selectedReservationId) {
      await fetchGuests(selectedReservationId);
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
    <div className="flex h-screen overflow-hidden bg-[#0d1117]">

      {/* Sidebar — always visible */}
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
        username={user.username}
        onSettings={() => setShowSettings(!showSettings)}
        onLogout={handleLogout}
        showSettings={showSettings}
      />

      {/* Content */}
      {showSettings ? (
        <main className="flex-1 overflow-y-auto p-8 lg:p-10">
          <div className="mx-auto max-w-2xl">
            <SettingsPanel
              userRole={user.role}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto p-8 lg:p-10">
          {selectedReservation ? (
            <ReservationView
              key={selectedReservation.id}
              reservation={selectedReservation}
              guests={guests}
              onGuestsUpdated={handleGuestsUpdated}
              onDeleteGuest={handleDeleteGuest}
              onUpdateReservation={handleUpdateReservation}
              onUpdateParent={handleUpdateParent}
            />
          ) : (
            <Dashboard
              properties={properties}
              onSelectProperty={setSelectedPropertyId}
              onSelectReservation={setSelectedReservationId}
              onAddReservation={handleAddReservation}
            />
          )}
        </main>
      )}
    </div>
  );
}

export default function Home() {
  return <AuthGuard>{(user) => <AppContent user={user} />}</AuthGuard>;
}
