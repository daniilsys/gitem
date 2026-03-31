import { FolderOpen, Sparkles, BookOpen } from "lucide-react";
import { useT } from "./i18n";

interface EmptyStateProps {
  onOpenFolder: () => void;
}

export function EmptyState({ onOpenFolder }: EmptyStateProps) {
  const t = useT();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10">
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-accent/15 via-accent/10 to-accent/5 blur-3xl" />
        <div className="animate-float relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent/20 to-accent/15 ring-1 ring-white/[0.1] shadow-2xl shadow-accent/10">
          <FolderOpen size={36} strokeWidth={1.3} className="text-accent-hover" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <h2 className="text-[20px] font-semibold tracking-tight text-text-primary">
          {t("empty.welcome")}
        </h2>
        <p className="max-w-[320px] text-center text-[13px] leading-relaxed text-text-secondary">
          {t("empty.desc")}
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onOpenFolder}
          className="cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent px-7 py-3 text-[14px] font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:from-accent-hover hover:to-accent-hover hover:shadow-accent/35 active:scale-[0.98]"
        >
          {t("empty.openFolder")}
        </button>
      </div>
      <div className="flex items-center gap-6 text-[12px] text-text-muted">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-amber-400/60" />
          <span>{t("empty.srs")}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-emerald-400/60" />
          <span>{t("empty.markdown")}</span>
        </div>
        <div className="flex items-center gap-2">
          <FolderOpen size={13} className="text-cyan-400/60" />
          <span>{t("empty.local")}</span>
        </div>
      </div>
    </div>
  );
}
