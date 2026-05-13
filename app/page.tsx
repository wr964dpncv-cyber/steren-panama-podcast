"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";

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

function formatLongDate(iso: string): string {
  return new Date(iso + "T00:00").toLocaleDateString("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

      <section className="relative isolate overflow-hidden border-b border-neutral-200 bg-ink-950 text-white glow-red">
        <div className="bg-grid-dark absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-300 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            Reservas en línea · 9am a 6pm
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
            Podcast Studio
            <span className="block text-brand">by Steren Panamá</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-neutral-300 sm:text-base">
            Reserva el espacio para grabar tu próximo episodio. Selecciona la fecha,
            las horas que necesites y listo — confirmación al instante.
          </p>
          <a
            href="https://maps.app.goo.gl/ipWEW9FY3e3TRyKW6"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Sucursal Villa Lucre · ver en mapa
          </a>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-500 text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="font-bold">¡Reserva confirmada!</p>
              <p className="mt-0.5">
                {formatLongDate(success.date)} · {success.hours.map(fmtHour).join(", ")}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-8">
          <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Paso 1</p>
                <h2 className="text-lg font-bold tracking-tight">Elige el día</h2>
              </div>
              <span className="hidden rounded-full bg-ink-950 px-3 py-1 text-[11px] font-semibold capitalize text-white sm:inline-block">
                {formatLongDate(date)}
              </span>
            </div>
            <Calendar value={date} onChange={setDate} min={today} />
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Paso 2</p>
              <h2 className="text-lg font-bold tracking-tight">
                Selecciona las horas
                {loadingAvailability && <span className="ml-2 text-xs font-medium text-neutral-500">cargando…</span>}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">Bloques de 1 hora. Puedes elegir cuantos quieras.</p>
            </div>
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
                      "rounded-xl px-3 py-3 text-sm font-semibold transition",
                      isTaken
                        ? "cursor-not-allowed bg-neutral-100 text-neutral-400 line-through"
                        : isSelected
                          ? "bg-brand text-white shadow-glow"
                          : "border border-neutral-200 bg-white text-ink-950 hover:border-ink-950 hover:bg-ink-950 hover:text-white",
                    ].join(" ")}
                  >
                    {fmtHour(h)} – {fmtHour(h + 1)}
                  </button>
                );
              })}
            </div>
            {sortedSelected.length > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-950 px-4 py-2.5 text-xs text-white">
                <span className="font-medium opacity-70">Seleccionado</span>
                <span className="font-mono font-bold">
                  {sortedSelected.map(fmtHour).join(" · ")} · {sortedSelected.length} h
                </span>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Paso 3</p>
              <h2 className="text-lg font-bold tracking-tight">Tus datos</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nombre">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={60}
                  className="input"
                />
              </Field>
              <Field label="Apellido">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={60}
                  className="input"
                />
              </Field>
              <Field label="Correo">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                />
              </Field>
              <Field label="Celular">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+507 6000-0000"
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                ¿De qué van a hablar?
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                minLength={10}
                maxLength={800}
                rows={3}
                placeholder="Ej: Conversación sobre emprendimiento con Juana Pérez, fundadora de Acme."
                className="input resize-none"
              />
              <p className="mt-1 text-right text-[11px] text-neutral-400">{topic.length}/800</p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Paso 4</p>
                <h2 className="text-lg font-bold tracking-tight">Términos y condiciones</h2>
              </div>
              {terms && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-neutral-600">
                  v{terms.version}
                </span>
              )}
            </div>
            <div className="scroll-soft max-h-52 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-700 whitespace-pre-wrap">
              {terms ? terms.content : "Cargando términos…"}
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 bg-white p-3 transition hover:border-ink-950">
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
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loadingAvailability || !terms}
            className="group relative w-full overflow-hidden rounded-2xl bg-ink-950 px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-soft transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {submitting ? "Reservando…" : "Confirmar reserva"}
              {!submitting && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition group-hover:translate-x-1">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              )}
            </span>
          </button>
        </form>

        <section className="mt-10 overflow-hidden rounded-3xl bg-ink-950 text-white shadow-soft">
          <div className="grid gap-0 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center justify-center bg-brand p-6 sm:p-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Ubicación</p>
              <h3 className="mt-1 text-xl font-black tracking-tight">Steren Villa Lucre</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                Urbanización Villa Lucre, Plaza Villa Lucre, entre el Supermercado Rey y Farmacia El Javillo,
                frente a La Onda. San Miguelito, Vía Domingo Díaz.
              </p>
              <a
                href="https://maps.app.goo.gl/ipWEW9FY3e3TRyKW6"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-950 transition hover:bg-brand hover:text-white"
              >
                Cómo llegar
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} Steren Panamá · Sucursal Villa Lucre</span>
          <span className="font-medium uppercase tracking-widest">Podcast Studio</span>
        </div>
      </footer>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e5e5e5;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #06070a;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #06070a;
          box-shadow: 0 0 0 3px rgba(6, 7, 10, 0.08);
        }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  );
}
