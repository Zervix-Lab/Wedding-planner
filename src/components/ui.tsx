// Small shared UI primitives. No hooks, so usable from server and client components.
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

export type Variant = "primary" | "secondary" | "danger" | "ghost";

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-2 text-base font-semibold leading-tight transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rose-700";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-rose-800 text-white hover:bg-rose-900",
  secondary: "border-2 border-stone-500 bg-white text-stone-900 hover:bg-stone-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-rose-900 hover:bg-rose-100",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: IconName;
}

export function Button({ variant = "primary", icon, className = "", children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...rest}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  icon,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  icon?: IconName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </Link>
  );
}

const CONTROL =
  "w-full min-h-12 rounded-xl border-2 border-stone-400 bg-white px-4 py-2 text-lg text-stone-900 placeholder:text-stone-500 focus:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-base font-semibold text-stone-900">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-base text-stone-600">{hint}</span>}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-stone-300 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-lg text-stone-700">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: IconName; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-400 bg-white px-5 py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-800">
        <Icon name={icon} className="h-8 w-8" />
      </div>
      <p className="text-xl font-bold text-stone-900">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-lg text-stone-700">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "rose" | "blue" }) {
  const tones = {
    neutral: "bg-stone-200 text-stone-900",
    green: "bg-green-100 text-green-900",
    amber: "bg-amber-100 text-amber-900",
    rose: "bg-rose-100 text-rose-900",
    blue: "bg-sky-100 text-sky-900",
  };
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-base font-semibold ${tones[tone]}`}>{children}</span>;
}
