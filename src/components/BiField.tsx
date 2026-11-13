"use client";
import { bi, type Bi } from "@/lib/types";
import { Input, Textarea } from "./ui";
import { useLang } from "./Providers";

/**
 * One text box. Whatever you type is saved exactly as typed (Sinhala stays Sinhala, English stays English).
 * Nothing is translated. The value is a { en, si } pair only so older data keeps working; the server stores
 * your text in the slot that matches the language you typed in.
 */
export function BiField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  maxLength = 100,
  autoFocus = false,
}: {
  label: string;
  value: Bi;
  onChange: (v: Bi) => void;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  const lang = useLang();
  const Control = multiline ? Textarea : Input;
  return (
    <label className="block">
      <span className="mb-1 block text-base font-semibold text-stone-900">{label}</span>
      <Control
        value={bi(value, lang)}
        maxLength={maxLength}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange({ en: e.target.value, si: "" })}
      />
    </label>
  );
}
