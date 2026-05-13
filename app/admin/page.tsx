"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";

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

function fmtLong(iso: string): string {
  return new Date(iso + "T00:00").toLocaleDateString("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Filter = "upcoming" | "past" | "all";

export default function AllBookingsPage() {
  const today = useMemo(todayInPanama, []);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = from && to ? `/api/admin/bookings?from=${from}&to=${to}` : "/api/admin/bookings";
      const r = await fetch(url, { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setBookings(data.bookings);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeBooking(id: number) {
    if (!confirm("¿Cancelar esta reserva? Se notificará al cliente por correo.")) return;
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (filter === "upcoming" && b.booking_date < today) return false;
        if (filter === "past" && b.booking_date >= today) return false;
        return true;
      })
      .filter((b) => {
        if (!q) return true;
        const hay = `${b.first_name} ${b.last_name} ${b.email} ${b.phone} ${b.topic}`.toLowerCase();
        return hay.includes(q);
      });
  }, [bookings, filter, search, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filtered) {
      const arr = map.get(b.booking_date) || [];
      arr.push(b);
      map.set(b.booking_date, arr);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
    return sortedKeys.map((date) => ({
      date,
      items: map.get(date)!.sort((a, b) => a.start_hour - b.start_hour),
    }));
  }, [filtered]);

  const totalHours = filtered.reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0);
  const uniqueClients = new Set(filtered.map((b) => b.email)).size;

  return (
    <AdminShell>
      <section className="border-b border-neutral-200 bg-ink-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">Historial</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Todas las reservas</h1>
              <p className="mt-1 text-sm text-neutral-400">
                {filter === "upcoming" && "Hoy y próximas"}
                {filter === "past" && "Reservas pasadas"}
                {filter === "all" && "Todas las reservas"}
                {from && to && ` · entre ${from} y ${to}`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Reservas" value={filtered.length} />
              <Stat label="Horas" value={totalHours} />
              <Stat label="Clientes" value={uniqueClients} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 p-1">
              <FilterBtn current={filter} value="upcoming" onClick={setFilter}>
                Próximas
              </FilterBtn>
              <FilterBtn current={filter} value="past" onClick={setFilter}>
                Pasadas
              </FilterBtn>
              <FilterBtn current={filter} value="all" onClick={setFilter}>
                Todas
              </FilterBtn>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                aria-label="Desde"
              />
              <span className="text-xs text-neutral-500">→</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                aria-label="Hasta"
              />
              {(from || to) && (
                <button
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="ml-auto w-full sm:w-72">
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nombre, correo, tema…"
                  className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
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
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-700">Sin reservas con los filtros actuales.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ date, items }) => {
              const isToday = date === today;
              const isPast = date < today;
              return (
                <section key={date} className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-neutral-200/80">
                  <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold capitalize">
                      {fmtLong(date)}
                      {isToday && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                          Hoy
                        </span>
                      )}
                      {isPast && !isToday && (
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                          Pasada
                        </span>
                      )}
                    </h2>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700">
                      {items.length} {items.length === 1 ? "reserva" : "reservas"}
                    </span>
                  </div>
                  <ul className="divide-y divide-neutral-100">
                    {items.map((b) => (
                      <li key={b.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold tracking-tight">
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
                          {!isPast && (
                            <button
                              onClick={() => removeBooking(b.id)}
                              disabled={busyId === b.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {busyId === b.id ? "…" : "Cancelar"}
                            </button>
                          )}
                        </div>
                        {b.topic && (
                          <p className="mt-2 text-xs text-neutral-600">
                            <span className="font-semibold text-neutral-500">Tema:</span> {b.topic}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            {bookings.length >= 500 && (
              <p className="text-center text-xs text-neutral-500">
                Mostrando las 500 reservas más recientes. Usa los filtros de fecha para ver más.
              </p>
            )}
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
      <p className="mt-0.5 font-mono text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function FilterBtn({
  current,
  value,
  onClick,
  children,
}: {
  current: Filter;
  value: Filter;
  onClick: (v: Filter) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={[
        "rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition",
        active ? "bg-brand text-white shadow-glow" : "text-neutral-300 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
