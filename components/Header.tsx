export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-3">
          <img
            src="https://www.steren.com.pa/media/logo/stores/1/logo_2.png"
            alt="Steren Panamá"
            className="h-8 w-auto"
          />
          <span className="hidden h-5 w-px bg-neutral-300 sm:block" />
          <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 sm:inline">
            Podcast Studio
          </span>
        </a>
        <a
          href="https://www.steren.com.pa"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition hover:bg-brand-dark sm:text-sm"
        >
          Compra Online
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition group-hover:translate-x-0.5"
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>
    </header>
  );
}
