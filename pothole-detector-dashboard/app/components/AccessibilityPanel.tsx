'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULTS, STORAGE_KEY, useAccessibility, type Contrast, type TextSize, type Theme } from '../context/AccessibilityContext';

const TEXT_SIZE_LABELS: Record<TextSize, string> = { sm: 'S', md: 'M', lg: 'L', xl: 'XL' };
const TEXT_SIZE_ARIA: Record<TextSize, string> = { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' };

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="4" x2="15" y2="4" />
      <circle cx="5" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <line x1="1" y1="8" x2="15" y2="8" />
      <circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <line x1="1" y1="12" x2="15" y2="12" />
      <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function OptionButton({
  active,
  onClick,
  label,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`flex-1 py-1.5 text-xs rounded transition-colors ${
        active
          ? 'bg-zinc-700 text-white font-medium'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  );
}

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const { theme, contrast, textSize, setTheme, setContrast, setTextSize } = useAccessibility();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setTheme(DEFAULTS.theme);
    setContrast(DEFAULTS.contrast);
    setTextSize(DEFAULTS.textSize);
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        aria-label="Accessibility options"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Accessibility options"
        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
          open ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
      >
        <SlidersIcon />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility options"
          aria-modal="false"
          className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Accessibility</h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close accessibility panel"
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors text-xs"
            >
              ✕
            </button>
          </div>

          {/* Theme */}
          <fieldset className="mb-4">
            <legend className="text-xs font-medium text-zinc-400 mb-2 block">Theme</legend>
            <div className="flex gap-1.5">
              {(['dark', 'light', 'system'] as Theme[]).map(t => (
                <OptionButton
                  key={t}
                  active={theme === t}
                  onClick={() => setTheme(t)}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                />
              ))}
            </div>
          </fieldset>

          {/* Contrast */}
          <fieldset className="mb-4">
            <legend className="text-xs font-medium text-zinc-400 mb-2 block">Contrast</legend>
            <div className="flex gap-1.5">
              {([['normal', 'Normal'], ['high', 'High contrast']] as [Contrast, string][]).map(([c, label]) => (
                <OptionButton
                  key={c}
                  active={contrast === c}
                  onClick={() => setContrast(c)}
                  label={label}
                />
              ))}
            </div>
          </fieldset>

          {/* Text size */}
          <fieldset className="mb-4">
            <legend className="text-xs font-medium text-zinc-400 mb-2 block">Text size</legend>
            <div className="flex gap-1.5">
              {(['sm', 'md', 'lg', 'xl'] as TextSize[]).map(s => (
                <OptionButton
                  key={s}
                  active={textSize === s}
                  onClick={() => setTextSize(s)}
                  label={TEXT_SIZE_LABELS[s]}
                  ariaLabel={`Text size: ${TEXT_SIZE_ARIA[s]}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5 px-0.5">
              {(['sm', 'md', 'lg', 'xl'] as TextSize[]).map(s => (
                <span key={s} className="flex-1 text-center text-zinc-600" style={{ fontSize: s === 'sm' ? '10px' : s === 'md' ? '11px' : s === 'lg' ? '12px' : '13px' }}>
                  Aa
                </span>
              ))}
            </div>
          </fieldset>

          {/* Reset */}
          <button
            onClick={reset}
            className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded hover:border-zinc-700 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}
