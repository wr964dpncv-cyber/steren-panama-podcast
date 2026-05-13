"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import Calendar from "@/components/Calendar";

type Blocked = { date: string; reason: string };

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

export default function BlockedDatesPage() {
  const today = useMemo(todayInPanama, []);
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState("");
  const [list, setList] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/blocked-dates", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setList(data.dates);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setReason("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setBusy(false);
    }
  }

  async function remove(d: string) {
    if (!confirm(`¿Quitar el bloqueo de ${fmtLong(d)}? Volverá a estar disponible para reservar.`)) return;
    try {
      const r = await fetch(`/api/admin/blocked-dates/${d}`, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Error");
      }
      setList((prev) => prev.filter((x) => x.date !== d));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error de red");
    }
  }

  return (
    <AdminShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Días bloqueados</p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Bloquear fechas</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Marca aquí los días en que el studio NO está disponible (feriados, mantenimiento, eventos privados). Los clientes verán el día tachado en el calendario y no podrán reservar.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">Bloquear un día</h2>
            <Calendar value={date} onChange={setDate} min={today} />
            <form onSubmit={add} className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Motivo (opcional, visible solo en admin)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={200}
                  placeholder="Ej: Feriado, mantenimiento, evento privado…"
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:opacity-60"
              >
                {busy ? "Bloqueando…" : `Bloquear ${fmtLong(date)}`}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">
              Próximos días bloqueados
            </h2>
            {loading ? (
              <p className="text-sm text-neutral-500">Cargando…</p>
            ) : list.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                No hay días bloqueados.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {list.map((b) => (
                  <li key={b.date} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-bold capitalize">{fmtLong(b.date)}</p>
                      {b.reason && <p className="text-xs text-neutral-500">{b.reason}</p>}
                    </div>
                    <button
                      onClick={() => remove(b.date)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
