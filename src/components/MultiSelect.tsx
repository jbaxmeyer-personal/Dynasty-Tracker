import { useState } from "react";

// A compact multi-select styled to match the filter <select>s: a field showing
// the current picks (or "All"), tapping opens a checkbox popover. Selecting
// keeps the popover open so you can toggle several; tapping outside closes it.
interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  allLabel?: string;
}

export function MultiSelect({ label, options, selected, onChange, allLabel = "All" }: Props) {
  const [open, setOpen] = useState(false);

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
  }

  const summary = selected.length === 0 ? allLabel : options.filter((o) => selected.includes(o)).join(", ");

  return (
    <label className="multiselect">
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
        <>
          <div className="multiselect-backdrop" onClick={() => setOpen(false)} />
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
        </>
      )}
    </label>
  );
}
