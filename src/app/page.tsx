"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { TopBar, type AppView } from "@/components/top-bar";
import { ReservationView } from "@/components/reservation-view";
import { SettingsPanel } from "@/components/settings-panel";
import { Dashboard } from "@/components/dashboard";
import { PropertyCalendar } from "@/components/property-calendar";
import { PropertyCleaningView } from "@/components/property-cleaning-view";
import { SyncSettings } from "@/components/sync-settings";
import { TasksPanel } from "@/components/tasks-panel";
import type { Property, Guest } from "@/lib/types";

function AppContent({
  user,
}: {
  user: { userId: number; username: string; role: string };
}) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activeView, setActiveView] = useState<AppView>("dashboard");

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
      setActiveView("dashboard");
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

  const handleUpdateProperty = async (id: number, data: { minNights?: number; checkInTime?: string; checkOutTime?: string; bookingWindow?: number }) => {
    await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchProperties();
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

  const handleSelectProperty = (id: number | null) => {
    setSelectedPropertyId(id);
    setSelectedReservationId(null);
    if (id === null) {
      setActiveView("dashboard");
    } else if (activeView === "dashboard") {
      setActiveView("calendar");
    }
  };

  const handleSelectReservation = (id: number) => {
    // Find the property for this reservation
    const prop = properties.find(p => p.reservations.some(r => r.id === id));
    if (prop && prop.id !== selectedPropertyId) {
      setSelectedPropertyId(prop.id);
    }
    setSelectedReservationId(id);
    setActiveView("guests");
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedReservation = selectedProperty?.reservations.find(r => r.id === selectedReservationId);

  const renderContent = () => {
    // Global views (no property selected)
    if (activeView === "settings") {
      return (
        <div className="mx-auto max-w-2xl">
          <SettingsPanel
            userRole={user.role}
            onClose={() => setActiveView(selectedPropertyId ? "calendar" : "dashboard")}
          />
        </div>
      );
    }

    if (activeView === "tasks") {
      return <TasksPanel />;
    }

    // Property views
    if (selectedProperty) {
      switch (activeView) {
        case "calendar":
          return (
            <PropertyCalendar
              key={`cal-${selectedProperty.id}`}
              property={selectedProperty}
              onSelectReservation={handleSelectReservation}
              onAddReservation={handleAddReservation}
            />
          );
        case "cleaning":
          return (
            <PropertyCleaningView
              key={`clean-${selectedProperty.id}`}
              property={selectedProperty}
            />
          );
        case "sync":
          return (
            <SyncSettings
              key={`sync-${selectedProperty.id}`}
              propertyId={selectedProperty.id}
              propertyName={selectedProperty.name}
              minNights={selectedProperty.minNights || 3}
              checkInTime={selectedProperty.checkInTime || "14:00"}
              checkOutTime={selectedProperty.checkOutTime || "12:00"}
              bookingWindow={selectedProperty.bookingWindow || 365}
              onUpdateProperty={handleUpdateProperty}
            />
          );
        case "guests":
          if (selectedReservation) {
            return (
              <ReservationView
                key={selectedReservation.id}
                reservation={selectedReservation}
                guests={guests}
                onGuestsUpdated={handleGuestsUpdated}
                onDeleteGuest={handleDeleteGuest}
                onUpdateReservation={handleUpdateReservation}
                onUpdateParent={handleUpdateParent}
              />
            );
          }
          // Show reservation list for this property
          return (
            <Dashboard
              properties={properties}
              selectedProperty={selectedProperty}
              onSelectProperty={handleSelectProperty}
              onSelectReservation={handleSelectReservation}
              onAddReservation={handleAddReservation}
            />
          );
        default:
          return (
            <PropertyCalendar
              key={`cal-${selectedProperty.id}`}
              property={selectedProperty}
              onSelectReservation={handleSelectReservation}
              onAddReservation={handleAddReservation}
            />
          );
      }
    }

    // Dashboard (no property selected)
    return (
      <Dashboard
        properties={properties}
        selectedProperty={null}
        onSelectProperty={handleSelectProperty}
        onSelectReservation={handleSelectReservation}
        onAddReservation={handleAddReservation}
      />
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117]">
      <TopBar
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        activeView={activeView}
        onSelectProperty={handleSelectProperty}
        onChangeView={setActiveView}
        onAddProperty={handleAddProperty}
        username={user.username}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default function Home() {
  return <AuthGuard>{(user) => <AppContent user={user} />}</AuthGuard>;
}
