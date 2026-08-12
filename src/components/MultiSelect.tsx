import { useEffect, useRef, useState } from "react";

// A compact multi-select styled to match the filter <select>s: a field showing
// the current picks (or "All"), tapping opens a checkbox popover. Selecting
// keeps the popover open so you can toggle several; tapping the field again or
// anywhere outside closes it.
interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  allLabel?: string;
}

export function MultiSelect({ label, options, selected, onChange, allLabel = "All" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLabelElement>(null);

  // Close on any tap outside the control. Uses pointerdown (not a click
  // backdrop) because iOS Safari won't fire click on non-interactive elements,
  // which left the popover stuck open when tapping empty space.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
  }

  const summary = selected.length === 0 ? allLabel : options.filter((o) => selected.includes(o)).join(", ");

  return (
    <label className="multiselect" ref={rootRef}>
      {label}
      <button
        type="button"
        className="multiselect-field"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={selected.length === 0 ? "muted" : ""}>{summary}</span>
      </button>
      {open && (
        <ul className="multiselect-list">
          {options.map((opt) => (
            <li key={opt}>
              <label className="checkbox-label">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
                {opt}
              </label>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
