"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPopover } from "@/components/Calendar";

type Booking = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  booking_date: string;
  start_hour: number;
  end_hour: number;
  topic: string;
  terms_version: number;
  terms_accepted_at: string | null;
  created_at: string;
};

function fmtHour(h: number) {
  const period = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${period}`;
}

function todayInPanama(): string {
  const now = new Date();
  const panama = new Date(now.toLocaleString("en-US", { timeZone: "America/Panama" }));
  return panama.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtLong(iso: string): string {
  return new Date(iso + "T00:00").toLocaleDateString("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShort(iso: string): string {
  return new Date(iso + "T00:00").toLocaleDateString("es-PA", {
    day: "2-digit",
    month: "short",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const today = useMemo(todayInPanama, []);
  const [date, setDate] = useState(today);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/bookings?from=${date}&to=${date}`, { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setBookings(data.bookings);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeBooking(id: number) {
    if (!confirm("¿Cancelar esta reserva? Se notificará al cliente.")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Error eliminando");
      }
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error de red");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const totalHours = bookings.reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0);
  const sorted = [...bookings].sort((a, b) => a.start_hour - b.start_hour);
  const isToday = date === today;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
              alt="Steren Panamá"
              className="h-7 w-auto invert brightness-0"
            />
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:inline">
              Admin · Podcast Studio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/terminos"
              className="hidden rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:bg-white/5 sm:inline-flex"
            >
              T&amp;C
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:bg-white/5"
            >
              Web pública
            </a>
            <button
              onClick={logout}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-brand"
            >
              Salir
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
      </header>

      <section className="border-b border-neutral-200 bg-ink-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">Reservas</p>
              <h1 className="mt-1 text-3xl font-black capitalize tracking-tight md:text-4xl">
                {fmtLong(date)}
              </h1>
              {isToday && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                  Hoy
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Reservas" value={bookings.length} />
              <Stat label="Horas" value={totalHours} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDate(addDays(date, -1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18 9 12l6-6" />
              </svg>
              {fmtShort(addDays(date, -1))}
            </button>
            {!isToday && (
              <button
                onClick={() => setDate(today)}
                className="rounded-xl bg-brand px-3 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition hover:bg-brand-dark"
              >
                Hoy
              </button>
            )}
            <button
              onClick={() => setDate(addDays(date, 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {fmtShort(addDays(date, 1))}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <div className="ml-auto">
              <CalendarPopover value={date} onChange={setDate} buttonLabel="Otro día" />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-neutral-500 shadow-soft ring-1 ring-neutral-200/80">
            Cargando…
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-700">Sin reservas para este día.</p>
            <p className="mt-1 text-xs text-neutral-500">Selecciona otro día arriba para revisar otras fechas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((b) => (
              <article
                key={b.id}
                className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-neutral-200/80"
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 px-5 py-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-ink-950 font-mono text-xs font-bold text-white">
                    {String(b.start_hour).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold tracking-tight">
                      {b.first_name} {b.last_name}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      <a href={`mailto:${b.email}`} className="hover:text-brand">{b.email}</a>
                      <span className="mx-1.5 text-neutral-300">·</span>
                      <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="hover:text-brand">{b.phone}</a>
                    </p>
                  </div>
                  <span className="rounded-lg bg-neutral-100 px-2.5 py-1 font-mono text-xs font-bold text-ink-950">
                    {fmtHour(b.start_hour)} – {fmtHour(b.end_hour)}
                  </span>
                  <button
                    onClick={() => removeBooking(b.id)}
                    disabled={busyId === b.id}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {busyId === b.id ? "…" : "Cancelar"}
                  </button>
                </div>
                {b.topic && (
                  <div className="bg-neutral-50 px-5 py-3">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                      Tema del podcast
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-neutral-800">{b.topic}</p>
                  </div>
                )}
                {b.terms_accepted_at && (
                  <div className="border-t border-neutral-100 px-5 py-2 text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Aceptó T&amp;C v{b.terms_version} ·{" "}
                      {new Date(b.terms_accepted_at).toLocaleString("es-PA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
      <p className="mt-0.5 font-mono text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
