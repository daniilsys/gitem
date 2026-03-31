import { useState, useMemo, useCallback } from "react";
import { Brain, BookOpen, Sparkles, Folder, Layers, GraduationCap, Trophy, XCircle, CheckCircle2 } from "lucide-react";
import { useT } from "@gitem/ui";
import { useAppStore, type Card, type Deck } from "./store";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatInterval(days: number): string {
  if (days < 1) return "< 1d";
  if (days === 1) return "1d";
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}yr`;
}

function estimateIntervals(card: Card) {
  const s = card.stability || 1;
  return {
    again: Math.max(1, s * 0.2),
    hard: Math.max(1, s * 0.6),
    good: Math.max(1, s * 1.5),
    easy: Math.max(1, s * 3.5),
  };
}

function breadcrumb(filePath: string): string {
  const parts = filePath.split("/");
  const relevant = parts.slice(-2);
  return relevant.map((p) => p.replace(/\.md$/, "")).join(" › ");
}

function getDeckFromPath(filePath: string, rootPath: string): string {
  const relative = filePath.replace(rootPath, "").replace(/^\//, "");
  const first = relative.split("/")[0];
  return first.endsWith(".md") ? "root" : first;
}

const deckColors = [
  { bg: "from-accent/15 to-accent/10", icon: "text-accent", badge: "bg-accent/20 text-accent", border: "border-accent/20 hover:border-accent/30" },
  { bg: "from-cyan-500/15 to-cyan-600/10", icon: "text-cyan-400", badge: "bg-cyan-500/20 text-cyan-400", border: "border-cyan-500/20 hover:border-cyan-500/30" },
  { bg: "from-emerald-500/15 to-emerald-600/10", icon: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400", border: "border-emerald-500/20 hover:border-emerald-500/30" },
  { bg: "from-amber-500/15 to-amber-600/10", icon: "text-amber-400", badge: "bg-amber-500/20 text-amber-400", border: "border-amber-500/20 hover:border-amber-500/30" },
  { bg: "from-rose-500/15 to-rose-600/10", icon: "text-rose-400", badge: "bg-rose-500/20 text-rose-400", border: "border-rose-500/20 hover:border-rose-500/30" },
  { bg: "from-indigo-500/15 to-indigo-600/10", icon: "text-indigo-400", badge: "bg-indigo-500/20 text-indigo-400", border: "border-indigo-500/20 hover:border-indigo-500/30" },
];

export function ReviewSession() {
  const { dueCards, cards, decks, selectedDeck, rootPath, reviewCard, setViewMode, setSelectedDeck, fetchDecks } = useAppStore();

  const totalDue = decks.reduce((sum, d) => sum + d.due, 0);

  if (selectedDeck === null && totalDue === 0) {
    return <ReviewEmpty />;
  }

  if (selectedDeck === null) {
    return <DeckSelection decks={decks} totalDue={totalDue} />;
  }

  return <Session key={selectedDeck ?? "__all"} />;
}

function ReviewEmpty() {
  const t = useT();
  const { cards, setViewMode } = useAppStore();
  const nextDue = cards
    .filter((c) => !c.deletedAt)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent blur-2xl" />
        <div className="animate-float relative flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 ring-1 ring-white/[0.08]">
          <GraduationCap size={30} strokeWidth={1.3} className="text-emerald-400" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-[18px] font-semibold text-text-primary">
          {t("review.allCaughtUp")}
        </h2>
        {nextDue ? (
          <p className="text-[13px] text-text-secondary">
            {t("review.nextReview", { date: nextDue.dueDate })}
          </p>
        ) : (
          <p className="max-w-[280px] text-center text-[13px] leading-relaxed text-text-secondary">
            {t("review.addCards")}
          </p>
        )}
      </div>
      <button
        onClick={() => setViewMode("notes")}
        className="mt-1 cursor-pointer rounded-lg px-5 py-2.5 text-[13px] font-medium text-text-secondary ring-1 ring-white/[0.08] transition-all duration-150 hover:bg-white/[0.04] hover:text-text-primary"
      >
        {t("review.backToNotes")}
      </button>
    </div>
  );
}

function DeckSelection({ decks, totalDue }: { decks: Deck[]; totalDue: number }) {
  const t = useT();
  const { setSelectedDeck } = useAppStore();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/15">
            <Brain size={16} strokeWidth={1.8} className="text-accent" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">{t("review.title")}</h2>
            <p className="text-[12px] text-text-muted">
              {t("review.cardsDue", { count: totalDue })} · {t("review.activeDecks", { count: decks.filter((d) => d.due > 0).length })}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-md space-y-2.5">
          <button
            onClick={() => setSelectedDeck("__all")}
            className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/[0.07] to-accent/[0.04] p-4 text-left transition-all duration-150 hover:border-accent/30 hover:from-accent/[0.1] active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/15">
              <Layers size={18} strokeWidth={1.8} className="text-accent" />
            </div>
            <div className="flex-1">
              <span className="text-[14px] font-semibold text-text-primary">{t("review.allDecks")}</span>
              <p className="text-[12px] text-text-muted">{t("review.cardsToReview", { count: totalDue })}</p>
            </div>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/20 px-2 text-[12px] font-bold text-accent">
              {totalDue}
            </span>
          </button>

          {decks.map((deck, i) => {
            const c = deckColors[i % deckColors.length];
            return (
              <button
                key={deck.name}
                onClick={() => { if (deck.due > 0) setSelectedDeck(deck.name); }}
                disabled={deck.due === 0}
                className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150 active:scale-[0.99] ${
                  deck.due > 0
                    ? `${c.border} hover:bg-white/[0.02]`
                    : "cursor-not-allowed border-white/[0.04] opacity-40"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg}`}>
                  <Folder size={18} strokeWidth={1.8} className={deck.due > 0 ? c.icon : "text-text-muted"} />
                </div>
                <div className="flex-1">
                  <span className="text-[14px] font-medium text-text-primary">{deck.name}</span>
                  <p className="text-[12px] text-text-muted">
                    {deck.due > 0 ? `${t("review.due", { count: deck.due })} · ` : ""}{t("review.total", { count: deck.total })}
                  </p>
                </div>
                {deck.due > 0 && (
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[12px] font-bold ${c.badge}`}>
                    {deck.due}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Session() {
  const t = useT();
  const { dueCards, selectedDeck, rootPath, reviewCard, setViewMode, setSelectedDeck } = useAppStore();

  const sessionCards = useMemo(() => {
    let filtered = dueCards;
    if (selectedDeck && selectedDeck !== "__all" && rootPath) {
      filtered = dueCards.filter((c) => getDeckFromPath(c.filePath, rootPath) === selectedDeck);
    }
    return shuffle(filtered);
  }, []);

  const total = sessionCards.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, forgot: 0, success: 0 });

  const handleRate = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      const card = sessionCards[currentIndex];
      if (!card) return;
      await reviewCard(card.id, rating);
      setStats((s) => ({
        reviewed: s.reviewed + 1,
        forgot: rating === 1 ? s.forgot + 1 : s.forgot,
        success: rating >= 3 ? s.success + 1 : s.success,
      }));
      setShowAnswer(false);
      setCurrentIndex((i) => i + 1);
    },
    [currentIndex, sessionCards, reviewCard],
  );

  if (total === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Brain size={28} strokeWidth={1.5} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">{t("review.noDueCards")}</p>
        <button
          onClick={() => setSelectedDeck(null)}
          className="cursor-pointer rounded-lg px-4 py-2 text-[13px] font-medium text-text-secondary ring-1 ring-white/[0.06] hover:bg-white/[0.04]"
        >
          {t("review.backToDecks")}
        </button>
      </div>
    );
  }

  if (currentIndex >= total) {
    const successRate = total > 0 ? Math.round((stats.success / total) * 100) : 0;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-transparent blur-2xl" />
          <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/15 ring-1 ring-white/[0.1]">
            <Trophy size={30} strokeWidth={1.3} className="text-amber-400" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-[18px] font-semibold text-text-primary">{t("review.sessionComplete")}</h2>
          <p className="text-[13px] text-text-muted">{t("review.accuracy", { percent: successRate })}</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-[13px]">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-emerald-400 font-medium">{stats.success}</span>
            <span className="text-text-muted">{t("review.correct")}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <XCircle size={14} className="text-rose-400" />
            <span className="text-rose-400 font-medium">{stats.forgot}</span>
            <span className="text-text-muted">{t("review.forgot")}</span>
          </div>
        </div>
        <div className="mt-2 flex gap-2.5">
          <button
            onClick={() => setSelectedDeck(null)}
            className="cursor-pointer rounded-xl px-5 py-2.5 text-[13px] font-medium text-text-secondary ring-1 ring-white/[0.08] transition-all duration-150 hover:bg-white/[0.04] hover:text-text-primary"
          >
            {t("review.reviewMore")}
          </button>
          <button
            onClick={() => setViewMode("notes")}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-accent to-accent px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-150 hover:from-accent-hover hover:to-accent-hover active:scale-[0.98]"
          >
            {t("review.backToNotes")}
          </button>
        </div>
      </div>
    );
  }

  const card = sessionCards[currentIndex];
  const intervals = estimateIntervals(card);
  const deckLabel = selectedDeck === "__all" ? t("review.allDecks") : selectedDeck;
  const progress = total > 0 ? (stats.reviewed / total) * 100 : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDeck(null)}
              className="cursor-pointer text-[12px] text-text-muted transition-colors hover:text-text-secondary"
            >
              {t("review.decks")}
            </button>
            <span className="text-[12px] text-text-muted/50">›</span>
            <span className="text-[13px] font-medium text-text-secondary">{deckLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-text-muted">
            <span>{t("review.remaining", { count: total - currentIndex })}</span>
            <span className="font-medium text-text-secondary">{stats.reviewed}/{total}</span>
          </div>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-8 shadow-xl shadow-black/20">
            <div className="mb-5 flex items-center gap-2 text-[12px] text-text-muted">
              <BookOpen size={12} strokeWidth={1.8} />
              {breadcrumb(card.filePath)}
            </div>

            <p className="text-[20px] font-medium leading-relaxed text-text-primary">
              {card.question}
            </p>

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-8 w-full cursor-pointer rounded-xl border border-accent/25 bg-accent/[0.06] py-3.5 text-center text-[14px] font-semibold text-accent transition-all duration-150 hover:border-accent/40 hover:bg-accent/10 active:scale-[0.99]"
              >
                {t("review.showAnswer")}
              </button>
            ) : (
              <>
                <div className="my-6 border-t border-white/[0.06]" />
                <p className="text-[17px] leading-relaxed text-indigo-300">
                  {card.answer}
                </p>

                <div className="mt-8 grid grid-cols-4 gap-2.5">
                  <RatingButton
                    label={t("rating.forgot")}
                    interval={formatInterval(intervals.again)}
                    color="text-rose-400"
                    bg="hover:bg-rose-500/10 active:bg-rose-500/15"
                    onClick={() => handleRate(1)}
                  />
                  <RatingButton
                    label={t("rating.hard")}
                    interval={formatInterval(intervals.hard)}
                    color="text-amber-400"
                    bg="hover:bg-amber-500/10 active:bg-amber-500/15"
                    onClick={() => handleRate(2)}
                  />
                  <RatingButton
                    label={t("rating.good")}
                    interval={formatInterval(intervals.good)}
                    color="text-emerald-400"
                    bg="hover:bg-emerald-500/10 active:bg-emerald-500/15"
                    onClick={() => handleRate(3)}
                  />
                  <RatingButton
                    label={t("rating.easy")}
                    interval={formatInterval(intervals.easy)}
                    color="text-cyan-400"
                    bg="hover:bg-cyan-500/10 active:bg-cyan-500/15"
                    onClick={() => handleRate(4)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RatingButton({
  label,
  interval,
  color,
  bg,
  onClick,
}: {
  label: string;
  interval: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] py-3.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.96] ${color} ${bg}`}
    >
      <span>{label}</span>
      <span className="text-[11px] font-normal text-text-muted">{interval}</span>
    </button>
  );
}
