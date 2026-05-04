/**
 * Centralized property access control.
 *
 * Three access levels per property:
 *   - owner: created the property; full control + can manage managers + delete
 *   - manager: granted access by owner; full daily operations (calendar, sync,
 *     overrides, reservations, guests, cleaning) — but cannot delete the
 *     property or manage other managers
 *   - cleaner: granted via CleanerAssignment; read-only access to the property
 *     and write access only on cleaning records for that property
 */

import { prisma } from "@/lib/prisma";

export type AccessLevel = "owner" | "manager" | "cleaner" | "none";

/**
 * Determine a user's access level to a property.
 */
export async function getPropertyAccess(
  propertyId: number,
  userId: number,
  role: string
): Promise<AccessLevel> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { userId: true },
  });
  if (!property) return "none";

  if (property.userId === userId) return "owner";

  // Manager check (full daily ops)
  const manager = await prisma.propertyManager.findUnique({
    where: { managerId_propertyId: { managerId: userId, propertyId } },
    select: { id: true },
  }).catch(() => null);
  if (manager) return "manager";

  // Cleaner check (read-only + cleaning record writes)
  if (role === "cleaner") {
    const assignment = await prisma.cleanerAssignment.findUnique({
      where: { cleanerId_propertyId: { cleanerId: userId, propertyId } },
      select: { id: true },
    });
    if (assignment) return "cleaner";
  }

  return "none";
}

/**
 * True if user can perform daily management actions: edit reservations,
 * sync calendars, set overrides, edit settings (NOT delete the property
 * itself, NOT manage other managers).
 */
export async function canManageProperty(
  propertyId: number,
  userId: number,
  role: string
): Promise<boolean> {
  const access = await getPropertyAccess(propertyId, userId, role);
  return access === "owner" || access === "manager";
}

/**
 * True if user can read property data (calendar, reservations, etc).
 * Includes cleaners (who can see assigned properties read-only).
 */
export async function canReadProperty(
  propertyId: number,
  userId: number,
  role: string
): Promise<boolean> {
  const access = await getPropertyAccess(propertyId, userId, role);
  return access !== "none";
}

/**
 * True if user owns the property (only the owner can delete or manage managers).
 */
export async function isPropertyOwner(
  propertyId: number,
  userId: number
): Promise<boolean> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { userId: true },
  });
  return !!property && property.userId === userId;
}

/**
 * Get all property IDs accessible to a user (as owner OR manager OR cleaner).
 * Used for list endpoints.
 */
export async function listAccessiblePropertyIds(
  userId: number,
  role: string
): Promise<number[]> {
  const ids = new Set<number>();

  // Owned
  const owned = await prisma.property.findMany({
    where: { userId },
    select: { id: true },
  });
  for (const p of owned) ids.add(p.id);

  // Managed
  const managed = await prisma.propertyManager.findMany({
    where: { managerId: userId },
    select: { propertyId: true },
  }).catch(() => []);
  for (const m of managed) ids.add(m.propertyId);

  // Cleaning assignments (only for cleaner role; in normal role we don't surface cleaner-only props)
  if (role === "cleaner") {
    const assigned = await prisma.cleanerAssignment.findMany({
      where: { cleanerId: userId },
      select: { propertyId: true },
    });
    for (const a of assigned) ids.add(a.propertyId);
  }

  return Array.from(ids);
}
