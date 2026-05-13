"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";

type User = {
  id: number;
  email: string;
  name: string;
  is_super_admin: boolean;
  created_at: string;
};

type Me = { id: number; is_super_admin: boolean };

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meR, usersR] = await Promise.all([
        fetch("/api/admin/me", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);
      if (meR.ok) setMe((await meR.json()).user);
      const data = await usersR.json();
      if (!usersR.ok) throw new Error(data.error || "Error");
      setUsers(data.users);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setCreating(false);
    }
  }

  async function removeUser(u: User) {
    if (!confirm(`¿Eliminar a ${u.name} (${u.email})? Esta acción no se puede deshacer.`)) return;
    setBusyId(u.id);
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Error");
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error de red");
    } finally {
      setBusyId(null);
    }
  }

  const isSuper = me?.is_super_admin;

  return (
    <AdminShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Usuarios</p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Equipo administrativo</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {isSuper
              ? "Como super admin, puedes agregar y eliminar usuarios. El super admin no se puede eliminar."
              : "Solo el super admin puede agregar o eliminar usuarios."}
          </p>
        </div>

        {isSuper && (
          <section className="mb-6 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-neutral-200/80">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">Agregar usuario</h2>
            <form onSubmit={createUser} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Contraseña inicial
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              {error && (
                <div className="sm:col-span-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-glow transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {creating ? "Agregando…" : "Agregar usuario"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-neutral-200/80">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              {users.length} usuario{users.length === 1 ? "" : "s"}
            </h2>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-neutral-500">Cargando…</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 text-sm font-bold text-white">
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">
                        {u.name}
                        {u.is_super_admin && (
                          <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                            Super admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                    </div>
                  </div>
                  {isSuper && !u.is_super_admin && me?.id !== u.id && (
                    <button
                      onClick={() => removeUser(u)}
                      disabled={busyId === u.id}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {busyId === u.id ? "…" : "Eliminar"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AdminShell>
  );
}
