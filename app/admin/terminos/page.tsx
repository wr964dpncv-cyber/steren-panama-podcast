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
    if (!confirm("Al guardar se incrementará la versión. Los nuevos clientes deberán aceptar esta nueva versión antes de reservar. ¿Continuar?")) {
      return;
    }
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
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-800 bg-black text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
              alt="Steren Panamá"
              className="h-7 w-auto invert brightness-0"
            />
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-neutral-400 sm:inline">
              Admin · Términos y condiciones
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:bg-neutral-900"
            >
              ← Reservas
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Editor</p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Términos y condiciones</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Estos términos se muestran al cliente antes de reservar. Al guardar cambios se incrementa la versión y los nuevos clientes deberán aceptar la versión más reciente. Las reservas antiguas conservan registro de la versión que firmaron.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-black px-3 py-1 font-mono text-xs text-white">
            Versión actual: {version ?? "—"}
          </span>
          {updatedAt && (
            <span className="text-xs text-neutral-500">
              Última actualización: {new Date(updatedAt).toLocaleString("es-PA", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">{success}</div>
        )}

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            rows={28}
            className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-4 font-mono text-xs leading-relaxed focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder={loading ? "Cargando…" : ""}
          />
          <p className="mt-2 text-xs text-neutral-500">{content.length} / 20 000 caracteres</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving || loading || content.length < 50}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar nueva versión"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Descartar cambios
          </button>
        </div>
      </main>
    </div>
  );
}
