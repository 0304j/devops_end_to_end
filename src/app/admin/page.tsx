import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingCard } from "@/components/admin/booking-card";
import { AdminFeedbackProvider } from "@/components/admin/feedback";
import { site } from "@/config/site";
import {
  countOpenRequests,
  listBookings,
  type RangeFilter,
  type StatusFilter,
  statusFilters,
} from "@/lib/admin/bookings";
import { requireAdmin } from "@/lib/auth/session";
import { getAvailability } from "@/lib/booking/repository";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Terminanfragen" };

const statusLabels: Record<StatusFilter, string> = {
  offen: "Offen",
  bestaetigt: "Bestätigt",
  abgeschlossen: "Abgelehnt / storniert",
  alle: "Alle",
};

const rangeLabels: Record<RangeFilter, string> = {
  kommend: "Kommende",
  vergangen: "Vergangene",
};

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <p className="flex items-baseline gap-3">
            <span className="text-lg font-extrabold font-wide">{site.name}</span>
            <span className="eyebrow">Verwaltung</span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium underline underline-offset-4 hover:text-accent"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>
      <main id="inhalt" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Suspense
          fallback={
            <p className="text-muted" role="status">
              Terminanfragen werden geladen …
            </p>
          }
        >
          <Dashboard searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  // Session expiry and "upcoming" depend on the current time: render per request only.
  await connection();
  const user = await requireAdmin();
  const params = await searchParams;
  const status = pick(params.status, Object.keys(statusFilters) as StatusFilter[], "offen");
  const range = pick(params.zeitraum, ["kommend", "vergangen"] as const, "kommend");

  const [bookings, openCount, availability] = await Promise.all([
    listBookings(status, range),
    countOpenRequests(),
    getAvailability(),
  ]);

  const href = (next: { status?: StatusFilter; zeitraum?: RangeFilter }) =>
    `/admin?${new URLSearchParams({ status, zeitraum: range, ...next })}`;

  return (
    <AdminFeedbackProvider>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Terminanfragen</h1>
          <p className="mt-1 text-ink-soft">
            {openCount === 1 ? "1 offene Anfrage" : `${openCount} offene Anfragen`} · angemeldet als{" "}
            {user.email}
          </p>
        </div>
      </div>

      <nav
        aria-label="Filter"
        className="mt-8 flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:justify-between"
      >
        <ul className="flex flex-wrap gap-2">
          {(Object.keys(statusLabels) as StatusFilter[]).map((key) => (
            <li key={key}>
              <Link
                href={href({ status: key })}
                aria-current={key === status ? "page" : undefined}
                className="block border border-line px-3 py-1.5 text-sm hover:border-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
              >
                {statusLabels[key]}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex gap-2">
          {(Object.keys(rangeLabels) as RangeFilter[]).map((key) => (
            <li key={key}>
              <Link
                href={href({ zeitraum: key })}
                aria-current={key === range ? "page" : undefined}
                className="block px-3 py-1.5 text-sm text-ink-soft underline-offset-4 hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink aria-[current=page]:underline"
              >
                {rangeLabels[key]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {bookings.length === 0 ? (
        <p className="mt-10 text-ink-soft">Keine Terminanfragen in dieser Ansicht.</p>
      ) : (
        <ol className="mt-6 space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <BookingCard booking={booking} availability={availability} />
            </li>
          ))}
        </ol>
      )}
    </AdminFeedbackProvider>
  );
}
