"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function fmtHour(h: number) {
  const period = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${period}`;
}

function fmtSlots(hours: number[]) {
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges: { start: number; end: number }[] = [];
  for (const h of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === h) last.end = h + 1;
    else ranges.push({ start: h, end: h + 1 });
  }
  return ranges.map((r) => `${fmtHour(r.start)} – ${fmtHour(r.end)}`).join(" · ");
}

function fmtLong(iso: string) {
  return new Date(iso + "T00:00").toLocaleDateString("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Booking = { firstName: string; date: string; hours: number[] };

function CancelInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) {
        setError("Enlace incompleto.");
        setLoading(false);
        return;
      }
      try {
        const r = await fetch(`/api/cancel-booking?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "No se pudo cargar la reserva");
        setBooking({ firstName: data.firstName, date: data.date, hours: data.hours });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error de red");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function cancel() {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setCancelled(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Cargando…</p>;

  if (cancelled) {
    return (
      <>
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-black tracking-tight">Reserva cancelada</h1>
        <p className="text-sm text-neutral-600">
          Liberamos los horarios para que otra persona pueda reservar. Te enviamos un correo de confirmación. Cuando quieras volver a reservar, te esperamos.
        </p>
        <a
          href="/"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-brand"
        >
          Reservar otra fecha
        </a>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <h1 className="mb-2 text-xl font-black tracking-tight">No se pudo cargar la reserva</h1>
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error || "Enlace inválido."}
        </p>
        <a
          href="/"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          Volver al inicio
        </a>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-black tracking-tight">¿Cancelar esta reserva?</h1>
      <p className="mb-4 text-sm text-neutral-600">
        Hola <strong>{booking.firstName}</strong>, vas a cancelar:
      </p>
      <div className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Fecha</p>
        <p className="mb-3 text-sm font-bold capitalize">{fmtLong(booking.date)}</p>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Horario</p>
        <p className="font-mono text-sm font-bold">{fmtSlots(booking.hours)}</p>
      </div>
      <button
        onClick={cancel}
        disabled={submitting}
        className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? "Cancelando…" : "Sí, cancelar mi reserva"}
      </button>
      <a
        href="/"
        className="mt-2 block w-full rounded-xl border border-neutral-200 bg-white py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:bg-neutral-100"
      >
        No, mantener la reserva
      </a>
      <p className="mt-4 text-center text-xs text-neutral-500">
        ¿Dudas? Escríbenos a{" "}
        <a
          href="https://wa.me/50766663080"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-600 hover:underline"
        >
          WhatsApp Steren Villa Lucre
        </a>
      </p>
    </>
  );
}

export default function CancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-soft ring-1 ring-neutral-200/80">
        <div className="mb-6 flex items-center gap-3">
          <img
            src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
            alt="Steren Panamá"
            className="h-8 w-auto"
          />
          <span className="h-5 w-px bg-neutral-300" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            Podcast Studio
          </span>
        </div>
        <Suspense fallback={<p className="text-sm text-neutral-500">Cargando…</p>}>
          <CancelInner />
        </Suspense>
      </div>
    </main>
  );
}
