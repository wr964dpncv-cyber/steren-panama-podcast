"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import Calendar from "@/components/Calendar";

type BlockedRow = {
  date: string;
  reason: string;
  recurring_annual: boolean;
  month_day: string;
};

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const PANAMA_HOLIDAYS: { mmdd: string; name: string }[] = [
  { mmdd: "01-01", name: "Año Nuevo" },
  { mmdd: "01-09", name: "Día de los Mártires" },
  { mmdd: "05-01", name: "Día del Trabajador" },
  { mmdd: "11-03", name: "Separación de Panamá de Colombia" },
  { mmdd: "11-04", name: "Día de los Símbolos Patrios" },
  { mmdd: "11-05", name: "Día de Colón" },
  { mmdd: "11-10", name: "Primer Grito de Independencia" },
  { mmdd: "11-28", name: "Independencia de España" },
  { mmdd: "12-08", name: "Día de las Madres" },
  { mmdd: "12-25", name: "Navidad" },
];

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

function fmtAnnual(mmdd: string): string {
  const [m, d] = mmdd.split("-").map(Number);
  return `${d} de ${MONTHS_ES[(m || 1) - 1]} (cada año)`;
}

export default function BlockedDatesPage() {
  const today = useMemo(todayInPanama, []);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [list, setList] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [holidaysBusy, setHolidaysBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/blocked-dates", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setList(data.rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const concreteBlocked = useMemo(
    () => list.filter((b) => !b.recurring_annual).map((b) => b.date),
    [list]
  );
  const annualBlocked = useMemo(
    () => list.filter((b) => b.recurring_annual).map((b) => b.month_day),
    [list]
  );
  const blockedSet = useMemo(() => new Set(concreteBlocked), [concreteBlocked]);
  const annualSet = useMemo(() => new Set(annualBlocked), [annualBlocked]);

  async function unblock(iso: string) {
    const isAnnual = annualSet.has(iso.slice(5));
    const item = list.find(
      (b) => b.date === iso || (b.recurring_annual && b.month_day === iso.slice(5))
    );
    const msg = isAnnual
      ? `Este día está bloqueado cada año (${item?.reason || "sin motivo"}).\n¿Quitar el bloqueo recurrente?`
      : item?.reason
        ? `${fmtLong(iso)}\nMotivo: ${item.reason}\n\n¿Quitar el bloqueo?`
        : `¿Quitar el bloqueo de ${fmtLong(iso)}?`;
    if (!confirm(msg)) return;
    try {
      const r = await fetch(`/api/admin/blocked-dates/${iso}`, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || "Error");
      }
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error de red");
    }
  }

  function onDateClick(iso: string) {
    if (blockedSet.has(iso) || annualSet.has(iso.slice(5))) {
      unblock(iso);
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
        body: JSON.stringify({ dates, reason, recurring }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setPending(new Set());
      setReason("");
      setRecurring(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setBusy(false);
    }
  }

  async function addPanamaHolidays() {
    const missing = PANAMA_HOLIDAYS.filter((h) => !annualSet.has(h.mmdd));
    if (missing.length === 0) {
      alert("Los feriados nacionales de Panamá ya están todos bloqueados.");
      return;
    }
    if (
      !confirm(
        `Se agregarán ${missing.length} feriados nacionales de Panamá como bloqueos recurrentes (cada año):\n\n${missing.map((h) => "• " + h.name).join("\n")}\n\n¿Continuar?`
      )
    )
      return;
    setHolidaysBusy(true);
    setError(null);
    try {
      const year = new Date().getFullYear();
      // Insert each one with its proper reason
      for (const h of missing) {
        const date = `${year}-${h.mmdd}`;
        await fetch("/api/admin/blocked-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dates: [date], reason: h.name, recurring: true }),
        });
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setHolidaysBusy(false);
    }
  }

  const sortedPending = useMemo(() => Array.from(pending).sort(), [pending]);
  const concreteList = list.filter((b) => !b.recurring_annual);
  const annualList = list.filter((b) => b.recurring_annual);

  return (
    <AdminShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Días bloqueados</p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Bloquear fechas</h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600">
            Toca varios días en el calendario para seleccionarlos en{" "}
            <span className="font-semibold text-brand">cian</span>, decide si es{" "}
            <strong>solo este año</strong> o <strong>cada año</strong>, y bloquéalos. Los días ya
            bloqueados aparecen en <span className="font-semibold text-red-600">rojo</span> (toca
            para desbloquear).
          </p>
        </div>

        <button
          onClick={addPanamaHolidays}
          disabled={holidaysBusy}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-brand bg-brand-50 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-brand-700 shadow-sm transition hover:bg-brand hover:text-white disabled:opacity-60"
        >
          <span className="text-lg leading-none">🇵🇦</span>
          {holidaysBusy ? "Agregando feriados…" : "Agregar feriados nacionales de Panamá"}
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)]">
          <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <Calendar
              value={today}
              min={today}
              selectedDates={sortedPending}
              blockedDates={concreteBlocked}
              blockedAnnualPatterns={annualBlocked}
              onDateClick={onDateClick}
            />

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <Legend color="bg-brand" label="Seleccionado (pendiente)" />
              <Legend color="bg-red-500" label="Bloqueado" />
              <Legend color="bg-brand/5 ring-1 ring-brand/40" label="Hoy" />
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
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 p-3 transition hover:border-brand">
                      <input
                        type="checkbox"
                        checked={recurring}
                        onChange={(e) => setRecurring(e.target.checked)}
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-brand"
                      />
                      <div className="flex-1">
                        <span className="block text-sm font-semibold text-ink-950">
                          Repetir cada año 🔁
                        </span>
                        <span className="mt-0.5 block text-xs text-neutral-600">
                          Útil para feriados (ej. 25 de diciembre todos los años).
                        </span>
                      </div>
                    </label>

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
                      {busy
                        ? "Bloqueando…"
                        : recurring
                          ? `Bloquear ${pending.size} día${pending.size === 1 ? "" : "s"} cada año`
                          : `Bloquear ${pending.size} día${pending.size === 1 ? "" : "s"}`}
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

            {annualList.length > 0 && (
              <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-neutral-200/80">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                  🔁 Recurrentes (cada año)
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">
                    {annualList.length}
                  </span>
                </h2>
                <ul className="divide-y divide-neutral-100">
                  {annualList
                    .slice()
                    .sort((a, b) => a.month_day.localeCompare(b.month_day))
                    .map((b) => (
                      <li key={b.date} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-bold capitalize">{fmtAnnual(b.month_day)}</p>
                          {b.reason && <p className="truncate text-xs text-neutral-500">{b.reason}</p>}
                        </div>
                        <button
                          onClick={() => unblock(b.date)}
                          className="flex-none rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-neutral-200/80">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
                Próximos bloqueos
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">
                  {concreteList.length}
                </span>
              </h2>
              {loading ? (
                <p className="text-sm text-neutral-500">Cargando…</p>
              ) : concreteList.length === 0 ? (
                <p className="rounded-xl border-2 border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-500">
                  Sin bloqueos puntuales próximos.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {concreteList
                    .filter((b) => b.date >= today)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((b) => (
                      <li key={b.date} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-bold capitalize">{fmtLong(b.date)}</p>
                          {b.reason && <p className="truncate text-xs text-neutral-500">{b.reason}</p>}
                        </div>
                        <button
                          onClick={() => unblock(b.date)}
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-neutral-600">
      <span className={["inline-block h-3 w-3 rounded-md", color].join(" ")} />
      {label}
    </span>
  );
}
