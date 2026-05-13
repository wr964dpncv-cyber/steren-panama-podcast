"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setDone(true);
      setTimeout(() => router.replace("/admin/login"), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
        Token faltante. Solicita un nuevo enlace de recuperación.
      </p>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="mb-2 text-xl font-black tracking-tight">¡Listo!</h1>
        <p className="text-sm text-neutral-400">
          Tu contraseña fue actualizada. Te llevamos al inicio de sesión…
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-black tracking-tight">Nueva contraseña</h1>
      <p className="mb-5 text-xs text-neutral-400">Crea una contraseña nueva (mínimo 8 caracteres).</p>
      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Nueva contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-white transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-white transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 text-white glow-brand">
      <div className="bg-grid-dark absolute inset-0 opacity-60" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
            alt="Steren Panamá"
            className="h-9 w-auto"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400">
            Restablecer contraseña
          </span>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          <Suspense fallback={<p className="text-sm text-neutral-400">Cargando…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
