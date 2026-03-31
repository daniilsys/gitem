import { useEffect, useRef, useState } from "react";
import { FileText, Folder } from "lucide-react";
import { useT } from "./i18n";

interface CreateDialogProps {
  type: "file" | "dir";
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function CreateDialog({ type, onSubmit, onCancel }: CreateDialogProps) {
  const [value, setValue] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onCancel]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const Icon = type === "file" ? FileText : Folder;
  const title = t(type === "file" ? "create.newNote" : "create.newFolder");
  const placeholder = t(type === "file" ? "create.noteName" : "create.folderName");

  return (
    <div
      ref={overlayRef}
      className="animate-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      <div className="animate-dialog w-[360px] rounded-2xl border border-white/[0.08] bg-[#141820] p-6 shadow-2xl shadow-black/70">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <Icon size={18} strokeWidth={1.8} className="text-accent" />
          </div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            {title}
          </h3>
        </div>
        <div className="mt-4">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder={placeholder}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent/40 focus:ring-1 focus:ring-accent/40"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-white/5 hover:text-text-primary"
          >
            {t("create.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("create.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
