import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// A controlled numeric input that's actually pleasant to edit. A plain
// `<input type="number" value={someNumber}>` fights the user: a field that
// defaults to 0 can never be cleared (Number("") snaps back to 0), and typing
// in front of it leaves stuck leading zeros ("070"). This keeps its own text
// state while you're typing - so you can empty it and type freely - and only
// normalizes to a clean number when you leave the field.
interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  /** When true an empty field means null; otherwise empty means 0. */
  nullable?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
}

export function NumberInput({
  value,
  onChange,
  nullable = false,
  min,
  max,
  placeholder,
  className,
  style,
}: Props) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const editing = useRef(false);

  // Sync the visible text when the value changes from outside - but never
  // while the user is mid-edit, or we'd yank the leading zero / partial entry
  // out from under them.
  useEffect(() => {
    if (!editing.current) setText(value == null ? "" : String(value));
  }, [value]);

  const allowNegative = min != null && min < 0;

  function handleChange(raw: string) {
    let cleaned = raw.replace(allowNegative ? /[^\d-]/g : /[^\d]/g, "");
    if (allowNegative) cleaned = cleaned.replace(/(?!^)-/g, ""); // minus only at the front
    setText(cleaned);
    if (cleaned === "" || cleaned === "-") onChange(nullable ? null : 0);
    else onChange(Number(cleaned));
  }

  function handleBlur() {
    editing.current = false;
    let v: number | null = text === "" || text === "-" ? (nullable ? null : 0) : Number(text);
    if (v != null) {
      if (min != null && v < min) v = min;
      if (max != null && v > max) v = max;
    }
    onChange(v);
    setText(v == null ? "" : String(v)); // strips leading zeros, clamps
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      style={style}
      value={text}
      placeholder={placeholder}
      onFocus={() => {
        editing.current = true;
      }}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  );
}
