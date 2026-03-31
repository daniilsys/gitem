import { useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import {
  Palette,
  Monitor,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Info,
  Globe,
} from "lucide-react";
import { useT } from "@gitem/ui";
import { useAppStore } from "./store";
import {
  themes,
  accentColors,
  getTheme,
  getAccent,
  applyTheme,
  type Theme,
  type AccentColor,
} from "./themes";

async function persistSettings(themeId: string, accentId: string) {
  const store = await load("settings.json");
  await store.set("themeId", themeId);
  await store.set("accentId", accentId);
  await store.save();
}

export function Settings() {
  const t = useT();
  const {
    themeId,
    accentId,
    locale,
    editorZoom,
    setTheme,
    setAccent,
    setLocale,
    zoomIn,
    zoomOut,
    zoomReset,
    setViewMode,
  } = useAppStore();

  useEffect(() => {
    applyTheme(getTheme(themeId), getAccent(accentId));
  }, [themeId, accentId]);

  const handleTheme = (id: string) => {
    setTheme(id);
    persistSettings(id, accentId);
  };

  const handleAccent = (id: string) => {
    setAccent(id);
    persistSettings(themeId, id);
  };

  const handleLocale = async (value: string | null) => {
    setLocale(value);
    const store = await load("settings.json");
    await store.set("locale", value);
    await store.save();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-8 py-5">
        <h1 className="text-[18px] font-semibold text-text-primary">{t("settings.title")}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{t("settings.subtitle")}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-10 px-8 py-8">

          <section>
            <SectionHeader icon={<Monitor size={16} />} title={t("settings.darkThemes")} />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {themes.filter((th) => !th.light).map((th) => (
                <ThemeCard
                  key={th.id}
                  theme={th}
                  active={themeId === th.id}
                  accent={getAccent(accentId)}
                  onClick={() => handleTheme(th.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<Monitor size={16} />} title={t("settings.lightThemes")} />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {themes.filter((th) => th.light).map((th) => (
                <ThemeCard
                  key={th.id}
                  theme={th}
                  active={themeId === th.id}
                  accent={getAccent(accentId)}
                  onClick={() => handleTheme(th.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<Palette size={16} />} title={t("settings.accentColor")} />
            <div className="mt-4 flex flex-wrap gap-3">
              {accentColors.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleAccent(a.id)}
                  className="group relative flex cursor-pointer flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                      accentId === a.id
                        ? "ring-2 ring-offset-2 ring-offset-bg scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: a.color + "25",
                      boxShadow: accentId === a.id ? `0 0 20px ${a.glow}, 0 0 0 2px var(--color-bg), 0 0 0 4px ${a.color}` : undefined,
                    }}
                  >
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    {accentId === a.id && (
                      <Check size={10} className="absolute text-white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted">{a.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<Globe size={16} />} title={t("settings.language")} />
            <div className="mt-4 flex gap-2.5">
              {([
                { value: null, label: t("settings.languageAuto") },
                { value: "en", label: "English" },
                { value: "fr", label: "Français" },
              ] as const).map((opt) => (
                <button
                  key={opt.value ?? "auto"}
                  onClick={() => handleLocale(opt.value)}
                  className={`cursor-pointer rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    locale === opt.value
                      ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                      : "text-text-secondary ring-1 ring-white/[0.06] hover:bg-white/[0.04] hover:text-text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader icon={<Type size={16} />} title={t("settings.editor")} />
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.02] px-5 py-4 ring-1 ring-white/[0.04]">
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{t("settings.fontSize")}</p>
                  <p className="mt-0.5 text-[12px] text-text-muted">{t("settings.fontSizeDesc")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={zoomOut}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text-secondary"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    onClick={zoomReset}
                    className="flex h-8 min-w-[48px] cursor-pointer items-center justify-center rounded-lg text-[13px] font-semibold text-text-secondary transition-colors hover:bg-white/[0.06]"
                  >
                    {editorZoom}%
                  </button>
                  <button
                    onClick={zoomIn}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text-secondary"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader icon={<Info size={16} />} title={t("settings.about")} />
            <div className="mt-4 rounded-xl bg-white/[0.02] px-5 py-4 ring-1 ring-white/[0.04]">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: getAccent(accentId).color + "20" }}
                >
                  <span className="text-[14px] font-bold" style={{ color: getAccent(accentId).color }}>G</span>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">Gitem</p>
                  <p className="text-[12px] text-text-muted">{t("settings.aboutDesc")}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-[12px] text-text-muted">
                <span>Tauri 2 + React</span>
                <span>·</span>
                <span>FSRS scheduling</span>
                <span>·</span>
                <span>100% offline</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-text-muted">{icon}</span>
      <h2 className="text-[14px] font-semibold text-text-primary">{title}</h2>
    </div>
  );
}

function ThemeCard({
  theme,
  active,
  accent,
  onClick,
}: {
  theme: Theme;
  active: boolean;
  accent: AccentColor;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-xl border p-0.5 transition-all duration-200 ${
        active
          ? "border-white/[0.15] shadow-lg"
          : "border-white/[0.04] hover:border-white/[0.1]"
      }`}
      style={active ? { boxShadow: `0 0 24px ${accent.glow}` } : undefined}
    >
      <div
        className="relative flex h-20 flex-col justify-between rounded-[10px] p-3"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="flex gap-1.5">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.textPrimary, opacity: 0.7 }} />
          <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: theme.textMuted, opacity: 0.5 }} />
        </div>
        <div className="flex gap-1">
          <div className="h-1 w-12 rounded-full" style={{ backgroundColor: theme.textSecondary, opacity: 0.3 }} />
          <div className="h-1 w-6 rounded-full" style={{ backgroundColor: accent.color, opacity: 0.5 }} />
        </div>
        <div className="flex gap-1">
          <div className="h-1 w-8 rounded-full" style={{ backgroundColor: theme.textSecondary, opacity: 0.2 }} />
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: theme.textSecondary, opacity: 0.2 }} />
        </div>
        {active && (
          <div
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: accent.color }}
          >
            <Check size={10} className="text-white" />
          </div>
        )}
      </div>
      <div className="px-2 py-2">
        <span className={`text-[12px] font-medium ${active ? "text-text-primary" : "text-text-secondary"}`}>
          {theme.name}
        </span>
      </div>
    </button>
  );
}
