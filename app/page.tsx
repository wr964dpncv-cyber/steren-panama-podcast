"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;
const ALL_HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

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

type Terms = { content: string; version: number };

export default function Page() {
  const today = useMemo(todayInPanama, []);
  const [date, setDate] = useState<string>(today);
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");
  const [terms, setTerms] = useState<Terms | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ date: string; hours: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/terms", { cache: "no-store" });
        const data = await r.json();
        if (!cancelled && r.ok) setTerms({ content: data.content, version: data.version });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingAvailability(true);
      setError(null);
      try {
        const r = await fetch(`/api/availability?date=${date}`, { cache: "no-store" });
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok) throw new Error(data.error || "Error cargando disponibilidad");
        setTaken(new Set<number>(data.takenHours ?? []));
        setSelected(new Set());
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error de red");
      } finally {
        if (!cancelled) setLoadingAvailability(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  function toggleHour(h: number) {
    if (taken.has(h)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h);
      else next.add(h);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (selected.size === 0) {
      setError("Selecciona al menos una hora.");
      return;
    }
    if (!termsAccepted) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }
    if (!terms) {
      setError("No se pudieron cargar los términos. Recarga la página.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          date,
          topic,
          hours: Array.from(selected).sort((a, b) => a - b),
          termsVersion: terms.version,
          termsAccepted: true,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "No se pudo crear la reserva");
      setSuccess({ date: data.date, hours: data.hours });
      setSelected(new Set());
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setTopic("");
      setTermsAccepted(false);
      const refresh = await fetch(`/api/availability?date=${date}`, { cache: "no-store" });
      const ref = await refresh.json();
      if (refresh.ok) setTaken(new Set<number>(ref.takenHours ?? []));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  const sortedSelected = Array.from(selected).sort((a, b) => a - b);

  return (
    <>
      <Header />
      <div className="bg-grid border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Reservas en línea
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Reserva el <span className="text-brand">Podcast Studio</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm text-neutral-600">
            Sesiones disponibles de 9:00 am a 6:00 pm. Elige la fecha, las horas que necesitas y completa tus datos. Confirmación al instante.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <strong>¡Reserva confirmada!</strong>{" "}
            {new Date(success.date + "T00:00").toLocaleDateString("es-PA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · {success.hours.map(fmtHour).join(", ")}.
          </div>
        )}

        <form onSubmit={submit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Horario {loadingAvailability && <span className="text-xs text-neutral-500">(cargando…)</span>}
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {ALL_HOURS.map((h) => {
                const isTaken = taken.has(h);
                const isSelected = selected.has(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={isTaken || loadingAvailability}
                    onClick={() => toggleHour(h)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-medium transition",
                      isTaken
                        ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                        : isSelected
                          ? "border-brand bg-brand text-white shadow"
                          : "border-neutral-300 bg-white hover:border-brand hover:text-brand",
                    ].join(" ")}
                  >
                    {fmtHour(h)} – {fmtHour(h + 1)}
                  </button>
                );
              })}
            </div>
            {sortedSelected.length > 0 && (
              <p className="mt-2 text-xs text-neutral-600">
                Seleccionado: {sortedSelected.map(fmtHour).join(", ")} ({sortedSelected.length} h)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={60}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={60}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Celular</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+507 6000-0000"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              ¿De qué van a hablar?
              <span className="ml-1 text-xs font-normal text-neutral-500">
                (tema, invitados, formato)
              </span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              minLength={10}
              maxLength={800}
              rows={3}
              placeholder="Ej: Conversación sobre emprendimiento en Panamá con invitada Juana Pérez, fundadora de Acme. Formato entrevista, 45 minutos."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <p className="mt-1 text-xs text-neutral-500">{topic.length}/800</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium">Términos y condiciones</label>
              {terms && (
                <span className="text-xs text-neutral-500">Versión {terms.version}</span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-700 whitespace-pre-wrap">
              {terms ? terms.content : "Cargando términos…"}
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-neutral-300 bg-white p-3 transition hover:border-brand/50">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 cursor-pointer accent-brand"
              />
              <span className="text-sm">
                He leído y acepto los términos y condiciones del podcast studio de Steren Panamá.
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loadingAvailability || !terms}
            className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Reservando…" : "Confirmar reserva"}
          </button>
        </form>
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Steren Panamá · Podcast Studio
      </footer>
    </>
  );
}
