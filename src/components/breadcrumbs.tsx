import Link from "next/link";

export interface BreadcrumbItem {
  /** Visible label. Already localised by the caller. */
  label: string;
  /** Internal href. Omit on the current page (last item) — that one renders
   *  as plain text instead of a link. */
  href?: string;
}

/**
 * Visible breadcrumb trail for blog surfaces. Mirrors the same path Google
 * gets via the `BreadcrumbList` JSON-LD that the blog post page already
 * emits — surfacing it visually too gives the visitor an obvious way back
 * up the hierarchy without using the browser back button (especially on
 * mobile where the back button is platform-dependent).
 *
 * Pure server component — no client interactivity, no hooks, no state.
 * Caller passes already-localised labels so this component stays
 * locale-agnostic and SSR-friendly inside any route.
 *
 * Visual: monospaced separator chevrons matching the existing editorial
 * type system, full-color hover on intermediate links, muted current page
 * label. Outer `<nav aria-label>` is required for assistive tech.
 */
export function Breadcrumbs({
  items,
  className = "",
  navLabel = "Breadcrumb",
}: {
  items: BreadcrumbItem[];
  className?: string;
  /** aria-label for the nav landmark. Caller localises. */
  navLabel?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label={navLabel}
      className={`text-[12.5px] text-[var(--ink-4)] ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${idx}-${item.label}`} className="flex min-w-0 items-center gap-1.5">
              {idx > 0 && (
                <span aria-hidden className="shrink-0 text-[var(--ink-4)]/60">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="min-w-0 break-words text-[var(--ink-2)]"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[var(--ink-3)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
