import { useEffect, useState } from "react";
import { SCHOOL_NAMES } from "../data/schools";
import { TeamLogo } from "./TeamLogo";

// A type-to-search school picker. A 130-team native <select> is miserable to
// scroll on a phone, so this shows a text box that filters the list as you
// type and offers tappable matches. Falls back to browsing the full list when
// the box is empty/unchanged, so it still works like a dropdown if you'd
// rather scroll. Free text that doesn't match a real school reverts on blur.
interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: string[];
  placeholder?: string;
}

export function SchoolCombobox({
  label,
  value,
  onChange,
  options = SCHOOL_NAMES,
  placeholder = "Type to search…",
}: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  // Keep the text in sync if the selected value changes from outside.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const q = query.trim().toLowerCase();
  const matches = !q || query === value ? options : options.filter((n) => n.toLowerCase().includes(q));
  // 20 so every conference's full roster is browsable (the biggest, the Big
  // Ten, has 18) while still capping the 130-team all-schools lists.
  const shown = matches.slice(0, 20);

  function select(name: string) {
    onChange(name);
    setQuery(name);
    setOpen(false);
  }

  return (
    <label className="combobox">
      {label}
      <div className="combobox-field">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={(e) => {
            setOpen(true);
            setHighlight(0);
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onBlur={() => {
            // Revert to the last valid selection if the text isn't a real school.
            if (query !== value && !options.includes(query)) setQuery(value);
            setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(h + 1, shown.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter" && open && shown[highlight]) {
              e.preventDefault();
              select(shown[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
              setQuery(value);
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="combobox-clear"
            aria-label="Clear"
            // mousedown (not click) so it fires before the input's blur.
            onMouseDown={(e) => {
              e.preventDefault();
              select("");
            }}
          >
            ×
          </button>
        )}
      </div>
      {open && shown.length > 0 && (
        <ul className="combobox-list">
          {shown.map((name, i) => (
            <li
              key={name}
              className={i === highlight ? "active" : ""}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                select(name);
              }}
            >
              <TeamLogo school={name} size={20} />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
