"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { TopBar, type AppView } from "@/components/top-bar";
import { ReservationView } from "@/components/reservation-view";
import { ProfilePanel } from "@/components/profile-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { Dashboard } from "@/components/dashboard";
import { PropertyCalendar } from "@/components/property-calendar";
import { PropertyCleaningView } from "@/components/property-cleaning-view";
import { SyncSettings } from "@/components/sync-settings";
import { TasksPanel } from "@/components/tasks-panel";
import { ReportsPanel } from "@/components/reports-panel";
import { SyncAlertsBanner } from "@/components/sync-alerts-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { SupportFooter } from "@/components/support-footer";
import { CleanerApp } from "@/components/cleaner-app";
import type { Property, Guest } from "@/lib/types";

function CleanerShell({
  user,
}: {
  user: { userId: number; username: string; role: string };
}) {
  const router = useRouter();
  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }, [router]);
  return <CleanerApp user={user} onLogout={handleLogout} />;
}

function AppContent({
  user,
}: {
  user: { userId: number; username: string; role: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Derive state from URL params
  const selectedPropertyId = searchParams.get("property") ? Number(searchParams.get("property")) : null;
  const selectedReservationId = searchParams.get("reservation") ? Number(searchParams.get("reservation")) : null;
  const activeView: AppView = (searchParams.get("view") as AppView) ||
    (selectedReservationId ? "guests" : selectedPropertyId ? "calendar" : "dashboard");

  // Navigate by updating URL params. The previous `month=YYYY-MM`
  // param is gone — the calendar is now a vertical multi-month stack
  // (no prev / next pagination), so there's no "active month" to
  // preserve.
  const navigate = useCallback((params: { property?: number | null; reservation?: number | null; view?: AppView }) => {
    const sp = new URLSearchParams();
    const propId = params.property !== undefined ? params.property : selectedPropertyId;
    const resId = params.reservation !== undefined ? params.reservation : (params.property !== undefined ? null : selectedReservationId);
    const view = params.view || (resId ? "guests" : propId ? "calendar" : "dashboard");

    if (propId) sp.set("property", String(propId));
    if (resId) sp.set("reservation", String(resId));
    // Only set view param if it's not the default for the context
    const defaultView = resId ? "guests" : propId ? "calendar" : "dashboard";
    if (view !== defaultView) sp.set("view", view);

    const qs = sp.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }, [router, selectedPropertyId, selectedReservationId]);

  // Convenience setters that update URL
  const setSelectedPropertyId = useCallback((id: number | null) => {
    navigate({ property: id, reservation: null });
  }, [navigate]);

  const setSelectedReservationId = useCallback((id: number | null) => {
    if (id) {
      // Find which property this reservation belongs to
      const prop = properties.find(p => p.reservations.some(r => r.id === id));
      navigate({ property: prop?.id || selectedPropertyId, reservation: id, view: "guests" });
    } else {
      navigate({ reservation: null });
    }
  }, [navigate, properties, selectedPropertyId]);

  const setActiveView = useCallback((view: AppView) => {
    navigate({ view });
  }, [navigate]);

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
    setLoadingProperties(true);
    try {
      const res = await fetch("/api/properties");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProperties(data);
      } else {
        console.error("Properties API returned non-array:", data);
        setProperties([]);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
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
      navigate({ property: null, reservation: null, view: "dashboard" });
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

  const handleUpdateProperty = async (id: number, data: { name?: string; minNights?: number; checkInTime?: string; checkOutTime?: string; bookingWindow?: number }) => {
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

  const handleUpdateGuest = async (id: number, fields: Partial<Guest>) => {
    await fetch(`/api/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
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
    if (id === null) {
      navigate({ property: null, reservation: null, view: "dashboard" });
    } else {
      navigate({ property: id, reservation: null, view: activeView === "dashboard" ? "calendar" : activeView });
    }
  };

  const handleSelectReservation = (id: number) => {
    const prop = properties.find(p => p.reservations.some(r => r.id === id));
    navigate({ property: prop?.id || selectedPropertyId, reservation: id, view: "guests" });
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedReservation = selectedProperty?.reservations.find(r => r.id === selectedReservationId);

  const renderContent = () => {
    // Global views (no property selected)
    const isSuperAdmin = user.role === "superadmin";

    // Admin / Tasks pages are operator-grade (cron URL with secret,
    // cross-property sync log, force-toggle of auto-sync). Hide their
    // entry in the avatar menu AND gate the render itself, so a
    // non-admin who pastes ?view=tasks into the URL bar still gets
    // bounced to the dashboard.
    if (activeView === "settings") {
      if (!isSuperAdmin) {
        return <div className="mx-auto max-w-2xl text-center text-sm text-[var(--ink-3)]">Admin only.</div>;
      }
      return (
        <div className="mx-auto max-w-2xl">
          <SettingsPanel
            userRole={user.role}
            onClose={() => navigate({ view: selectedPropertyId ? "calendar" : "dashboard" })}
          />
        </div>
      );
    }

    if (activeView === "profile") {
      return <ProfilePanel />;
    }

    if (activeView === "tasks") {
      if (!isSuperAdmin) {
        return <div className="mx-auto max-w-2xl text-center text-sm text-[var(--ink-3)]">Admin only.</div>;
      }
      return <TasksPanel />;
    }

    if (activeView === "reports") {
      return <ReportsPanel properties={properties} onImported={fetchProperties} />;
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
              ownerUserId={selectedProperty.userId}
              onUpdateProperty={handleUpdateProperty}
              onDeleteProperty={handleDeleteProperty}
            />
          );
        case "guests":
          if (selectedReservation) {
            return (
              <ReservationView
                key={selectedReservation.id}
                reservation={selectedReservation}
                guests={guests}
                propertyName={selectedProperty.name}
                onGuestsUpdated={handleGuestsUpdated}
                onDeleteGuest={handleDeleteGuest}
                onDeleteReservation={handleDeleteReservation}
                onUpdateReservation={handleUpdateReservation}
                onUpdateParent={handleUpdateParent}
                onUpdateGuest={handleUpdateGuest}
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
        onAddProperty={handleAddProperty}
      />
    );
  };

  return (
    <div className="editorial flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <AnnouncementBanner />
      <TopBar
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        activeView={activeView}
        onSelectProperty={handleSelectProperty}
        onChangeView={setActiveView}
        onNavigate={navigate}
        onOpenReservation={(propId, resId) =>
          navigate({ property: propId, reservation: resId, view: "guests" })
        }
        username={user.username}
        userRole={user.role}
        onLogout={handleLogout}
      />
      <SyncAlertsBanner />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8" style={{ scrollbarGutter: "stable" }}>
        {loadingProperties && properties.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--line-2)] border-t-sky-400" />
          </div>
        ) : (
          renderContent()
        )}
      </main>
      <SupportFooter />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="editorial flex h-screen items-center justify-center bg-[var(--bg)] text-[var(--ink-3)]">Loading...</div>}>
      <AuthGuard>
        {(user) =>
          user.role === "cleaner" ? (
            <CleanerShell user={user} />
          ) : (
            <AppContent user={user} />
          )
        }
      </AuthGuard>
    </Suspense>
  );
}
