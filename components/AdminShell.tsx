"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Me = { id: number; email: string; name: string; is_super_admin: boolean };

const NAV: { href: string; label: string; superAdminOnly?: boolean }[] = [
  { href: "/admin", label: "Reservas" },
  { href: "/admin/dias-bloqueados", label: "Días bloqueados" },
  { href: "/admin/terminos", label: "Términos" },
  { href: "/admin/usuarios", label: "Usuarios", superAdminOnly: true },
  { href: "/admin/cuenta", label: "Mi cuenta" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/me", { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          setMe(data.user);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/admin" className="flex items-center gap-3">
            <img
              src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
              alt="Steren Panamá"
              className="h-7 w-auto"
            />
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:inline">
              Admin · Podcast Studio
            </span>
          </a>
          <div className="flex items-center gap-2">
            {me && (
              <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:inline-flex">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {me.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-medium text-neutral-200">{me.name}</span>
                {me.is_super_admin && (
                  <span className="rounded-full bg-brand/20 px-1.5 text-[9px] font-bold uppercase tracking-wider text-brand-300">
                    Super
                  </span>
                )}
              </span>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition hover:bg-white/5 sm:inline-flex"
            >
              Web pública
            </a>
            <button
              onClick={logout}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-brand"
            >
              Salir
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex gap-1 py-1.5">
            {NAV.filter((n) => !n.superAdminOnly || me?.is_super_admin).map((n) => {
              const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
              return (
                <a
                  key={n.href}
                  href={n.href}
                  className={[
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition",
                    active
                      ? "bg-brand text-white shadow-glow"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  {n.label}
                </a>
              );
            })}
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
