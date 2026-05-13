"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setDone(true);
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
            Recuperar contraseña
          </span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur">
          {done ? (
            <>
              <h1 className="mb-2 text-xl font-black tracking-tight">Revisa tu correo</h1>
              <p className="text-sm text-neutral-400">
                Si <strong className="text-white">{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos. El enlace expira en 1 hora.
              </p>
              <a
                href="/admin/login"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-neutral-300 transition hover:bg-white/5"
              >
                ← Volver al inicio
              </a>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-black tracking-tight">¿Olvidaste tu contraseña?</h1>
              <p className="mb-5 text-xs text-neutral-400">
                Te enviaremos un enlace para crear una nueva contraseña.
              </p>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Enviando…" : "Enviar enlace"}
                </button>
                <a
                  href="/admin/login"
                  className="block text-center text-xs font-medium uppercase tracking-wider text-neutral-400 hover:text-white"
                >
                  ← Volver al inicio de sesión
                </a>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
