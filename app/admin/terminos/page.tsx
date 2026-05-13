"use client";

import { useEffect, useState } from "react";

export default function TermsAdminPage() {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/terms", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error cargando");
      setContent(data.content);
      setVersion(data.version);
      setUpdatedAt(data.updatedAt);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (
      !confirm(
        "Al guardar se incrementará la versión. Los nuevos clientes deberán aceptar esta nueva versión antes de reservar. ¿Continuar?"
      )
    )
      return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch("/api/admin/terms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error guardando");
      setVersion(data.version);
      setUpdatedAt(data.updatedAt);
      setSuccess(`Guardado. Nueva versión: ${data.version}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
              alt="Steren Panamá"
              className="h-7 w-auto invert brightness-0"
            />
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:inline">
              Admin · Términos
            </span>
          </div>
          <a
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:bg-white/5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18 9 12l6-6" />
            </svg>
            Reservas
          </a>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Editor</p>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Términos y condiciones</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Estos términos se muestran al cliente antes de reservar. Al guardar cambios se incrementa la
            versión y los nuevos clientes deberán aceptar la versión más reciente. Las reservas previas
            conservan registro de la versión que firmaron.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-3 py-1 font-mono text-xs text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Versión {version ?? "—"}
          </span>
          {updatedAt && (
            <span className="text-xs text-neutral-500">
              Última actualización:{" "}
              {new Date(updatedAt).toLocaleString("es-PA", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {success}
          </div>
        )}

        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-neutral-200/80">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            rows={28}
            className="scroll-soft w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed transition focus:border-ink-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-950/10"
            placeholder={loading ? "Cargando…" : ""}
          />
          <p className="mt-2 text-right text-xs text-neutral-400">{content.length} / 20 000 caracteres</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving || loading || content.length < 50}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar nueva versión"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            Descartar cambios
          </button>
        </div>
      </main>
    </div>
  );
}
