"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { makeT, type Dict, type DictKey, type Lang, type TFunc } from "@/lib/i18n";
import { Icon } from "./Icon";

/* ---------- i18n ---------- */
interface I18nValue {
  lang: Lang;
  t: TFunc;
}
const I18nCtx = createContext<I18nValue>({ lang: "si", t: (k) => k });
export const useT = () => useContext(I18nCtx).t;
export const useLang = () => useContext(I18nCtx).lang;

/* ---------- toasts ---------- */
interface ToastItem {
  id: number;
  kind: "success" | "error";
  text: string;
}
interface ToastApi {
  success: (key: DictKey) => void;
  error: (key: DictKey) => void;
}
const ToastCtx = createContext<ToastApi>({ success: () => {}, error: () => {} });
export const useToast = () => useContext(ToastCtx);

/* ---------- confirm dialog ---------- */
type ConfirmFn = (message: string, confirmLabel?: string) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

interface ConfirmState {
  message: string;
  confirmLabel: string;
  resolve: (v: boolean) => void;
}

function ConfirmDialog({ state, t, onAnswer }: { state: ConfirmState; t: TFunc; onAnswer: (v: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onAnswer(false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-5 text-stone-900 shadow-2xl backdrop:bg-black/60"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
        <Icon name="trash" className="h-7 w-7" />
      </div>
      <p className="mb-5 text-xl font-bold">{state.message}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          autoFocus
          onClick={() => onAnswer(false)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-stone-500 bg-white px-5 text-base font-semibold hover:bg-stone-100"
        >
          <Icon name="x" className="h-5 w-5" />
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-base font-semibold text-white hover:bg-red-800"
        >
          <Icon name="trash" className="h-5 w-5" />
          {state.confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function Providers({ lang, dict, children }: { lang: Lang; dict: Dict; children: ReactNode }) {
  const t = useMemo(() => makeT(dict), [dict]);
  const i18n = useMemo(() => ({ lang, t }), [lang, t]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const push = useCallback(
    (kind: ToastItem["kind"], key: DictKey) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, kind, text: t(key) }]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 4500);
    },
    [t],
  );
  const toastApi = useMemo<ToastApi>(
    () => ({ success: (k) => push("success", k), error: (k) => push("error", k) }),
    [push],
  );

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirm = useCallback<ConfirmFn>(
    (message, confirmLabel) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ message, confirmLabel: confirmLabel ?? t("common.yesDelete"), resolve });
      }),
    [t],
  );
  const answer = useCallback(
    (v: boolean) => {
      confirmState?.resolve(v);
      setConfirmState(null);
    },
    [confirmState],
  );

  return (
    <I18nCtx.Provider value={i18n}>
      <ToastCtx.Provider value={toastApi}>
        <ConfirmCtx.Provider value={confirm}>
          {children}
          {confirmState && <ConfirmDialog state={confirmState} t={t} onAnswer={answer} />}
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col items-center gap-2"
          >
            {toasts.map((x) => (
              <div
                key={x.id}
                className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3 text-lg font-semibold text-white shadow-lg ${
                  x.kind === "success" ? "bg-green-800" : "bg-red-700"
                }`}
              >
                <Icon name={x.kind === "success" ? "check" : "x"} />
                <span>{x.text}</span>
              </div>
            ))}
          </div>
        </ConfirmCtx.Provider>
      </ToastCtx.Provider>
    </I18nCtx.Provider>
  );
}
