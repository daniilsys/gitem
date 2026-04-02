import { useState } from "react";
import {
  FolderOpen,
  BookOpen,
  Zap,
  Brain,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useT } from "@gitem/ui";
import type { TKey } from "@gitem/ui";

interface OnboardingProps {
  onComplete: () => void;
  onOpenFolder: () => void;
}

const steps = [
  {
    icon: <Sparkles size={28} strokeWidth={1.3} className="text-accent" />,
    gradient: "from-accent/20 to-accent/10",
    glow: "from-accent/15 via-accent/10 to-transparent",
    titleKey: "onboarding.welcome.title" as TKey,
    descKey: "onboarding.welcome.desc" as TKey,
  },
  {
    icon: <FolderOpen size={28} strokeWidth={1.3} className="text-cyan-400" />,
    gradient: "from-cyan-500/20 to-cyan-600/10",
    glow: "from-cyan-500/15 via-cyan-500/10 to-transparent",
    titleKey: "onboarding.vault.title" as TKey,
    descKey: "onboarding.vault.desc" as TKey,
  },
  {
    icon: <Zap size={28} strokeWidth={1.3} className="text-amber-400" />,
    gradient: "from-amber-500/20 to-amber-600/10",
    glow: "from-amber-500/15 via-amber-500/10 to-transparent",
    titleKey: "onboarding.flashcards.title" as TKey,
    descKey: "onboarding.flashcards.desc" as TKey,
  },
  {
    icon: <Brain size={28} strokeWidth={1.3} className="text-emerald-400" />,
    gradient: "from-emerald-500/20 to-emerald-600/10",
    glow: "from-emerald-500/15 via-emerald-500/10 to-transparent",
    titleKey: "onboarding.review.title" as TKey,
    descKey: "onboarding.review.desc" as TKey,
  },
];

export function Onboarding({ onComplete, onOpenFolder }: OnboardingProps) {
  const t = useT();
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-8">
        <div className="relative">
          <div
            className={`absolute -inset-8 rounded-full bg-gradient-to-br ${current.glow} blur-3xl transition-all duration-700`}
          />
          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${current.gradient} ring-1 ring-white/[0.1] transition-all duration-500`}
            key={step}
            style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {current.icon}
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-3 text-center"
          key={`text-${step}`}
          style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1) 50ms both" }}
        >
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            {t(current.titleKey)}
          </h1>
          <p className="max-w-[340px] text-[14px] leading-relaxed text-text-secondary">
            {t(current.descKey)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 bg-accent"
                  : i < step
                    ? "w-1.5 bg-accent/40"
                    : "w-1.5 bg-white/[0.1]"
              }`}
            />
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          {isLast ? (
            <button
              onClick={() => {
                onComplete();
                onOpenFolder();
              }}
              className="flex w-full max-w-[280px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent px-6 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:shadow-accent/30 active:scale-[0.98]"
            >
              <FolderOpen size={16} strokeWidth={2} />
              {t("onboarding.chooseVault")}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex w-full max-w-[280px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent/10 px-6 py-3.5 text-[14px] font-semibold text-accent transition-all duration-200 hover:bg-accent/15 active:scale-[0.98]"
            >
              {t("onboarding.continue")}
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => {
                onComplete();
              }}
              className="cursor-pointer text-[13px] text-text-muted transition-colors hover:text-text-secondary"
            >
              {t("onboarding.skip")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
