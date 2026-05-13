"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  tone?: "light" | "dark";
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function Calendar({ value, onChange, min, max, tone = "light" }: Props) {
  const selected = useMemo(() => parseISO(value), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  useEffect(() => {
    setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selected]);

  const minDate = min ? stripTime(parseISO(min)) : null;
  const maxDate = max ? stripTime(parseISO(max)) : null;
  const today = stripTime(new Date());

  const cells = useMemo(() => {
    const first = new Date(viewMonth);
    const startDay = (first.getDay() + 6) % 7;
    const out: (Date | null)[] = Array(startDay).fill(null);
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewMonth]);

  const isDark = tone === "dark";

  return (
    <div
      className={[
        "rounded-2xl border p-3 sm:p-4 select-none",
        isDark
          ? "border-white/10 bg-ink-900 text-white"
          : "border-neutral-200 bg-white text-ink-950",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full transition",
            isDark ? "hover:bg-white/10" : "hover:bg-neutral-100",
          ].join(" ")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18 9 12l6-6" />
          </svg>
        </button>
        <span className="text-sm font-semibold capitalize tracking-tight">
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full transition",
            isDark ? "hover:bg-white/10" : "hover:bg-neutral-100",
          ].join(" ")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className={[
              "py-1 text-center text-[10px] font-bold uppercase tracking-wider",
              isDark ? "text-neutral-500" : "text-neutral-400",
            ].join(" ")}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="aspect-square" />;
          const iso = toISO(d);
          const isSelected = iso === value;
          const isToday = d.getTime() === today.getTime();
          const disabled =
            (minDate && d < minDate) || (maxDate && d > maxDate);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <button
              key={iso}
              type="button"
              disabled={!!disabled}
              onClick={() => onChange(iso)}
              className={[
                "relative aspect-square rounded-xl text-sm font-medium transition",
                disabled
                  ? isDark ? "cursor-not-allowed text-neutral-700" : "cursor-not-allowed text-neutral-300"
                  : isSelected
                    ? "bg-brand text-white shadow-glow"
                    : isToday
                      ? isDark
                        ? "bg-white/5 text-white ring-1 ring-brand/50"
                        : "bg-brand/5 text-brand ring-1 ring-brand/40"
                      : isDark
                        ? `${isWeekend ? "text-neutral-400" : "text-white"} hover:bg-white/10`
                        : `${isWeekend ? "text-neutral-500" : "text-ink-950"} hover:bg-neutral-100`,
              ].join(" ")}
            >
              {d.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

export function CalendarPopover({
  value,
  onChange,
  min,
  buttonLabel,
}: {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  buttonLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {buttonLabel}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[280px]">
          <Calendar
            value={value}
            onChange={(d) => {
              onChange(d);
              setOpen(false);
            }}
            min={min}
            tone="dark"
          />
        </div>
      )}
    </div>
  );
}
