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

function fmtShort(iso: string): string {
  return new Date(iso + "T00:00").toLocaleDateString("es-PA", {
    day: "2-digit",
    month: "short",
  });
}

export default function BlockedDatesPage() {
  const today = useMemo(todayInPanama, []);
  const [pending, setPending] = useState<Set<string>>(new Set());
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

  const blockedSet = useMemo(() => new Set(list.map((b) => b.date)), [list]);

  async function onDateClick(iso: string) {
    if (blockedSet.has(iso)) {
      const item = list.find((b) => b.date === iso);
      const msg = item?.reason
        ? `${fmtLong(iso)}\nMotivo: ${item.reason}\n\n¿Quitar el bloqueo? Volverá a estar disponible para reservar.`
        : `¿Quitar el bloqueo de ${fmtLong(iso)}? Volverá a estar disponible para reservar.`;
      if (!confirm(msg)) return;
      try {
        const r = await fetch(`/api/admin/blocked-dates/${iso}`, { method: "DELETE" });
        if (!r.ok) {
          const data = await r.json();
          throw new Error(data.error || "Error");
        }
        setList((prev) => prev.filter((b) => b.date !== iso));
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Error de red");
      }
      return;
    }
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  async function submit() {
    if (pending.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const dates = Array.from(pending).sort();
      const r = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, reason }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setPending(new Set());
      setReason("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setBusy(false);
    }
  }

  const sortedPending = useMemo(() => Array.from(pending).sort(), [pending]);

  return (
    <AdminShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Días bloqueados</p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Bloquear fechas</h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600">
            Selecciona varios días en el calendario y bloquéalos juntos. Los días bloqueados aparecen en{" "}
            <span className="font-semibold text-red-600">rojo</span>; los seleccionados (pendientes) aparecen en{" "}
            <span className="font-semibold text-brand">cian</span>. Click en un día rojo para desbloquearlo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)]">
          <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <Calendar
              value={today}
              min={today}
              selectedDates={sortedPending}
              blockedDates={list.map((b) => b.date)}
              onDateClick={onDateClick}
            />

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <Legend color="bg-brand" label="Seleccionado (pendiente)" />
              <Legend color="bg-red-500" label="Ya bloqueado" />
              <Legend color="bg-brand/5 ring-1 ring-brand/40" label="Hoy" outline />
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-neutral-200/80">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                Selección actual
                {pending.size > 0 && (
                  <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                    {pending.size}
                  </span>
                )}
              </h2>
              {sortedPending.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-500">
                  Toca uno o varios días en el calendario para seleccionarlos.
                </p>
              ) : (
                <>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {sortedPending.map((d) => (
                      <li key={d}>
                        <button
                          onClick={() => onDateClick(d)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand transition hover:bg-brand/20"
                        >
                          {fmtShort(d)}
                          <span className="text-brand-700">×</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 space-y-3">
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
                      onClick={submit}
                      disabled={busy}
                      className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:opacity-60"
                    >
                      {busy ? "Bloqueando…" : `Bloquear ${pending.size} día${pending.size === 1 ? "" : "s"}`}
                    </button>
                    <button
                      onClick={() => setPending(new Set())}
                      disabled={busy}
                      className="w-full rounded-xl border border-neutral-200 bg-white py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100"
                    >
                      Limpiar selección
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-neutral-200/80">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                Próximos bloqueos
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">
                  {list.length}
                </span>
              </h2>
              {loading ? (
                <p className="text-sm text-neutral-500">Cargando…</p>
              ) : list.length === 0 ? (
                <p className="rounded-xl border-2 border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-500">
                  Sin bloqueos próximos.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {list.map((b) => (
                    <li key={b.date} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-bold capitalize">{fmtLong(b.date)}</p>
                        {b.reason && <p className="truncate text-xs text-neutral-500">{b.reason}</p>}
                      </div>
                      <button
                        onClick={() => onDateClick(b.date)}
                        className="flex-none rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </main>
    </AdminShell>
  );
}

function Legend({ color, label, outline }: { color: string; label: string; outline?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-neutral-600">
      <span
        className={[
          "inline-block h-3 w-3 rounded-md",
          color,
          outline ? "" : "",
        ].join(" ")}
      />
      {label}
    </span>
  );
}
