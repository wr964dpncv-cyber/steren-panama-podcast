"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";

type Me = { id: number; email: string; name: string; is_super_admin: boolean };

export default function CuentaPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/me", { cache: "no-store" });
      if (r.ok) setMe((await r.json()).user);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setSuccess("Contraseña actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Mi cuenta</p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Datos de la cuenta</h1>
        </div>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">Tu perfil</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-neutral-500">Nombre:</span>{" "}
              <span className="font-mono">{me?.name ?? "—"}</span>
            </p>
            <p>
              <span className="font-semibold text-neutral-500">Correo:</span>{" "}
              <span className="font-mono">{me?.email ?? "—"}</span>
            </p>
            <p>
              <span className="font-semibold text-neutral-500">Rol:</span>{" "}
              {me?.is_super_admin ? (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">Super admin</span>
              ) : (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-700">Administrador</span>
              )}
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">Cambiar contraseña</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Contraseña actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Nueva contraseña (mín 8)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </form>
        </section>
      </main>
    </AdminShell>
  );
}
