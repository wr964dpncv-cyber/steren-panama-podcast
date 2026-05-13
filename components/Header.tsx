export default function Header({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <header
      className={[
        "border-b",
        isDark ? "border-neutral-800 bg-black text-white" : "border-neutral-200 bg-white",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-3">
          <img
            src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
            alt="Steren Panamá"
            className={["h-8 w-auto", isDark ? "invert brightness-0" : ""].join(" ")}
          />
          <span className={["hidden text-xs font-semibold uppercase tracking-widest sm:inline", isDark ? "text-neutral-400" : "text-neutral-500"].join(" ")}>
            Podcast Studio
          </span>
        </a>
        <a
          href="https://www.steren.com.pa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-brand-dark sm:text-sm"
        >
          Compra Online
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>
    </header>
  );
}
