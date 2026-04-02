import { useEffect, useRef } from "react";
import { useT } from "./i18n";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const t = useT();

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onCancel]);

  return (
    <div
      ref={overlayRef}
      className="animate-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      <div className="animate-dialog w-[340px] rounded-2xl border border-white/[0.08] bg-panel p-6 shadow-2xl shadow-black/70">
        <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
        <p className="mt-2.5 text-[13px] leading-relaxed text-text-secondary">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-white/5 hover:text-text-primary"
          >
            {t("confirm.cancel")}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`cursor-pointer rounded-lg px-4 py-2 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] ${
              danger
                ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                : "bg-accent/15 text-accent hover:bg-accent/25"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
