import type { InputHTMLAttributes } from "react";

// A text input for people's / proper names: turns off spellcheck, autocorrect,
// and autocomplete (which flag and mangle names), and capitalizes each word.
// Same treatment across every name field so entry is painless.
export function NameInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      spellCheck={false}
      autoCorrect="off"
      autoComplete="off"
      autoCapitalize="words"
      {...props}
    />
  );
}
