"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 20;
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
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialOther, setSocialOther] = useState("");
  const [terms, setTerms] = useState<Terms | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedAnnual, setBlockedAnnual] = useState<string[]>([]);
  const [dateBlocked, setDateBlocked] = useState<{ blocked: boolean; reason: string }>({ blocked: false, reason: "" });
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ date: string; hours: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [termsR, blockedR] = await Promise.all([
          fetch("/api/terms", { cache: "no-store" }),
          fetch("/api/blocked-dates", { cache: "no-store" }),
        ]);
        if (!cancelled && termsR.ok) {
          const data = await termsR.json();
          setTerms({ content: data.content, version: data.version });
        }
        if (!cancelled && blockedR.ok) {
          const data = await blockedR.json();
          setBlockedDates(Array.isArray(data.dates) ? data.dates : []);
          setBlockedAnnual(Array.isArray(data.annual) ? data.annual : []);
        }
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
        setDateBlocked({ blocked: !!data.blocked, reason: data.blockedReason || "" });
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
          socialYoutube,
          socialInstagram,
          socialTiktok,
          socialOther,
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
      setSocialYoutube("");
      setSocialInstagram("");
      setSocialTiktok("");
      setSocialOther("");
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

      <section className="relative isolate overflow-hidden border-b border-brand-700/50 bg-gradient-to-br from-brand-700 via-brand to-brand-500 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-1/2"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.25), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Reservas en línea · 9am a 8pm
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
            Podcast Studio
            <span className="block text-white/85">by Steren Panamá</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/90 sm:text-base">
            Reserva el espacio para grabar tu próximo episodio. Selecciona la fecha,
            las horas que necesites (de 9 am a 8 pm) y listo — confirmación al instante.
          </p>
          <a
            href="https://maps.app.goo.gl/ipWEW9FY3e3TRyKW6"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
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
        <form onSubmit={submit} className="space-y-8">
          <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Paso 1</p>
                <h2 className="text-lg font-bold tracking-tight">Elige el día</h2>
              </div>
              <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold capitalize text-white shadow-glow">
                {formatLongDate(date)}
              </span>
            </div>
            <div className="mx-auto max-w-[20rem]">
              <Calendar
                value={date}
                onChange={setDate}
                min={today}
                disabledDates={blockedDates}
                disabledAnnualPatterns={blockedAnnual}
              />
            </div>
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
            {dateBlocked.blocked && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <strong>Día no disponible.</strong>
                {dateBlocked.reason ? ` ${dateBlocked.reason}` : " Por favor elige otra fecha."}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                          : "border border-neutral-200 bg-white text-ink-950 hover:border-brand hover:bg-brand hover:text-white",
                    ].join(" ")}
                  >
                    {fmtHour(h)} – {fmtHour(h + 1)}
                  </button>
                );
              })}
            </div>
            {sortedSelected.length > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-brand px-4 py-2.5 text-xs text-white shadow-glow">
                <span className="font-medium opacity-90">Seleccionado</span>
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

            <div className="mt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Tus redes sociales
                </label>
                <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  Opcional
                </span>
              </div>
              <p className="mb-3 text-xs text-neutral-500">
                Para que podamos seguirte y compartir tu episodio. Pega tu @usuario o el link completo.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SocialField
                  label="YouTube"
                  value={socialYoutube}
                  onChange={setSocialYoutube}
                  placeholder="@tucanal"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  }
                  iconColor="#FF0000"
                />
                <SocialField
                  label="Instagram"
                  value={socialInstagram}
                  onChange={setSocialInstagram}
                  placeholder="@tuusuario"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                    </svg>
                  }
                  iconColor="#E4405F"
                />
                <SocialField
                  label="TikTok"
                  value={socialTiktok}
                  onChange={setSocialTiktok}
                  placeholder="@tuusuario"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
                    </svg>
                  }
                  iconColor="#000000"
                />
                <SocialField
                  label="Otra red"
                  value={socialOther}
                  onChange={setSocialOther}
                  placeholder="link o @usuario"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  }
                  iconColor="#737373"
                />
              </div>
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

          {success && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
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

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loadingAvailability || !terms}
            className="group relative w-full overflow-hidden rounded-2xl bg-brand px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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

        <section className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand to-brand-500 text-white shadow-soft">
          <div className="grid gap-0 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center justify-center bg-white/10 p-6 sm:p-8 backdrop-blur">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Ubicación</p>
              <h3 className="mt-1 text-xl font-black tracking-tight">Steren Villa Lucre</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Urbanización Villa Lucre, Plaza Villa Lucre, entre el Supermercado Rey y Farmacia El Javillo,
                frente a La Onda. San Miguelito, Vía Domingo Díaz.
              </p>
              <a
                href="https://maps.app.goo.gl/ipWEW9FY3e3TRyKW6"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 transition hover:bg-brand-50"
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

function SocialField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
          placeholder={placeholder}
          className="input pl-11"
        />
      </div>
    </div>
  );
}
