"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useT } from "./Providers";

/** Accessible modal built on the native <dialog> element (focus trap + Esc handled by the browser). */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useT();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto max-h-[94dvh] w-[calc(100%-1rem)] max-w-xl flex-col overflow-hidden rounded-2xl bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-black/60 open:flex"
    >
      <div className="flex items-center justify-between gap-3 border-b border-stone-300 px-4 py-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-base font-semibold text-stone-800 hover:bg-stone-100"
        >
          <Icon name="x" className="h-5 w-5" />
          {t("common.close")}
        </button>
      </div>
      <div className="overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
    </dialog>
  );
}
