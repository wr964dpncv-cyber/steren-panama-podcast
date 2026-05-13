"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error de login");
      router.replace("/admin");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

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
            Panel administrativo
          </span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          <h1 className="mb-1 text-xl font-black tracking-tight">Iniciar sesión</h1>
          <p className="mb-5 text-xs text-neutral-400">Gestiona reservas del podcast studio.</p>

          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Contraseña
                </label>
                <a
                  href="/admin/forgot-password"
                  className="text-[10px] font-medium uppercase tracking-wider text-brand-300 hover:text-brand"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
