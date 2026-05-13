"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value?: string; // YYYY-MM-DD (single-select mode)
  onChange?: (date: string) => void;
  min?: string;
  max?: string;
  tone?: "light" | "dark";
  disabledDates?: string[]; // greyed and not clickable
  blockedDates?: string[]; // red, still clickable
  selectedDates?: string[]; // cyan multi-selection (in addition to value)
  onDateClick?: (date: string) => void; // overrides default click behavior
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

export default function Calendar({
  value,
  onChange,
  min,
  max,
  tone = "light",
  disabledDates,
  blockedDates,
  selectedDates,
  onDateClick,
}: Props) {
  const initial = useMemo(() => (value ? parseISO(value) : new Date()), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1)
  );

  useEffect(() => {
    if (value) {
      const d = parseISO(value);
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  const disabledSet = useMemo(() => new Set(disabledDates || []), [disabledDates]);
  const blockedSet = useMemo(() => new Set(blockedDates || []), [blockedDates]);
  const selectedSet = useMemo(() => new Set(selectedDates || []), [selectedDates]);
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

  function handleClick(iso: string) {
    if (onDateClick) onDateClick(iso);
    else if (onChange) onChange(iso);
  }

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
          const isToday = d.getTime() === today.getTime();
          const isBlocked = blockedSet.has(iso);
          const isSelected = selectedSet.has(iso) || iso === value;
          const isDisabled =
            !!(minDate && d < minDate) || !!(maxDate && d > maxDate) || disabledSet.has(iso);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

          let stateClasses: string;
          if (isDisabled) {
            stateClasses = isDark ? "cursor-not-allowed text-neutral-700" : "cursor-not-allowed text-neutral-300";
          } else if (isBlocked) {
            stateClasses = "bg-red-500 text-white shadow-sm hover:bg-red-600";
          } else if (isSelected) {
            stateClasses = "bg-brand text-white shadow-glow hover:bg-brand-dark";
          } else if (isToday) {
            stateClasses = isDark
              ? "bg-white/5 text-white ring-1 ring-brand/50 hover:bg-white/10"
              : "bg-brand/5 text-brand ring-1 ring-brand/40 hover:bg-brand/10";
          } else {
            stateClasses = isDark
              ? `${isWeekend ? "text-neutral-400" : "text-white"} hover:bg-white/10`
              : `${isWeekend ? "text-neutral-500" : "text-ink-950"} hover:bg-neutral-100`;
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={isDisabled}
              onClick={() => handleClick(iso)}
              className={[
                "relative aspect-square rounded-xl text-sm font-medium transition",
                stateClasses,
              ].join(" ")}
            >
              {d.getDate()}
              {isToday && !isSelected && !isBlocked && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
              )}
              {isDisabled && disabledSet.has(iso) && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="h-px w-5 rotate-45 bg-current opacity-50" />
                </span>
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
