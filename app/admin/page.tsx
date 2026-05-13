"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  booking_date: string;
  start_hour: number;
  end_hour: number;
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
  return d.toISOString().slice(0, 10);
}

export default function AdminPage() {
  const router = useRouter();
  const today = useMemo(todayInPanama, []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 30));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/bookings?from=${from}&to=${to}`, { cache: "no-store" });
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
    if (!confirm("¿Eliminar esta reserva? Esta acción no se puede deshacer.")) return;
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

  const grouped = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const arr = map.get(b.booking_date) || [];
      arr.push(b);
      map.set(b.booking_date, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [bookings]);

  const totalHours = bookings.reduce((acc, b) => acc + (b.end_hour - b.start_hour), 0);

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-800 bg-black text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
              alt="Steren Panamá"
              className="h-7 w-auto invert brightness-0"
            />
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-neutral-400 sm:inline">
              Admin · Podcast Studio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:bg-neutral-900"
            >
              Ver web pública
            </a>
            <button
              onClick={logout}
              className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-brand-dark"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Reservas</p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Panel de reservas</h1>
            <p className="mt-1 text-sm text-neutral-600">
              {bookings.length} reserva{bookings.length === 1 ? "" : "s"} · {totalHours} h totales
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-600">Desde</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-600">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={load}
                disabled={loading}
                className="w-full rounded-lg bg-black py-2 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {loading ? "Cargando…" : "Filtrar"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            No hay reservas en este rango.
          </div>
        )}

        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <section key={date} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
              <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-5 py-3">
                <h2 className="text-sm font-bold capitalize tracking-tight">
                  {new Date(date + "T00:00").toLocaleDateString("es-PA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                  {items.length} reserva{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="divide-y divide-neutral-100">
                {items.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {b.first_name} {b.last_name}
                      </p>
                      <p className="text-xs text-neutral-600">
                        <a href={`mailto:${b.email}`} className="hover:text-brand">{b.email}</a>
                        {" · "}
                        <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="hover:text-brand">{b.phone}</a>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-mono text-white">
                        {fmtHour(b.start_hour)} – {fmtHour(b.end_hour)}
                      </span>
                      <button
                        onClick={() => removeBooking(b.id)}
                        disabled={busyId === b.id}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {busyId === b.id ? "…" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
