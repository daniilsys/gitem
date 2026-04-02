import { useState, useRef, useEffect } from "react";
import { Plus, FileText, FolderPlus, FolderSync } from "lucide-react";
import { useT } from "./i18n";

interface CreateMenuProps {
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onChangeFolder?: () => void;
}

export function CreateMenu({ onCreateNote, onCreateFolder, onChangeFolder }: CreateMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label={t("menu.createNew")}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:bg-white/5 hover:text-text-secondary"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
      {open && (
        <div className="animate-menu absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-white/[0.08] bg-panel py-1 shadow-xl shadow-black/50">
          <button
            onClick={() => { onCreateNote(); setOpen(false); }}
            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-[13px] text-text-primary transition-colors duration-100 hover:bg-white/5"
          >
            <FileText size={14} strokeWidth={1.8} className="text-text-muted" />
            {t("menu.newNote")}
          </button>
          <button
            onClick={() => { onCreateFolder(); setOpen(false); }}
            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-[13px] text-text-primary transition-colors duration-100 hover:bg-white/5"
          >
            <FolderPlus size={14} strokeWidth={1.8} className="text-text-muted" />
            {t("menu.newFolder")}
          </button>
          {onChangeFolder && (
            <>
              <div className="mx-3 my-1 border-t border-white/[0.06]" />
              <button
                onClick={() => { onChangeFolder(); setOpen(false); }}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-[13px] text-text-muted transition-colors duration-100 hover:bg-white/5 hover:text-text-secondary"
              >
                <FolderSync size={14} strokeWidth={1.8} />
                {t("menu.changeVault")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
