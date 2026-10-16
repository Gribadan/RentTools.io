import { prisma } from "@/lib/prisma";

type Listener = () => void;
const state = globalThis as typeof globalThis & {
  renttoolsLiveListeners?: Map<number, Set<Listener>>;
};
// Route bundles must share subscriptions with the cron and mutation handlers.
const listeners = state.renttoolsLiveListeners ??= new Map<number, Set<Listener>>();

export function subscribeUserChanges(userId: number, listener: Listener): (() => void) | null {
  const userListeners = listeners.get(userId) ?? new Set<Listener>();
  const total = [...listeners.values()].reduce((count, group) => count + group.size, 0);
  if (userListeners.size >= 8 || total >= 256) return null;
  userListeners.add(listener);
  listeners.set(userId, userListeners);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    userListeners.delete(listener);
    if (userListeners.size === 0) listeners.delete(userId);
  };
}

export async function notifyPropertyChange(propertyId: number): Promise<void> {
  if (listeners.size === 0) return;
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        userId: true,
        managers: { select: { managerId: true } },
        cleanerAssignments: {
          where: { cleaner: { role: "cleaner" } },
          select: { cleanerId: true },
        },
      },
    });
    if (!property) return;
    const recipients = new Set([
      property.userId,
      ...property.managers.map((manager) => manager.managerId),
      ...property.cleanerAssignments.flatMap((assignment) =>
        assignment.cleanerId == null ? [] : [assignment.cleanerId],
      ),
    ]);
    for (const userId of recipients) {
      for (const listener of listeners.get(userId) ?? []) {
        try { listener(); } catch (err) { console.error("Calendar refresh listener failed:", err); }
      }
    }
  } catch (err) {
    // A notification failure must not turn a committed booking into an HTTP error.
    console.error("Calendar refresh notification failed:", err);
  }
}
