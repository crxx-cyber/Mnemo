"use client";

import { useMemo, useState } from "react";
import type { Category, Note } from "@/types";

interface FlashcardStudyProps {
  notes: Note[];
  categories: Category[];
  activeCategoryId: string | null;
}

export function FlashcardStudy({ notes, categories, activeCategoryId }: FlashcardStudyProps) {
  const cards = useMemo(
    () =>
      notes.filter(
        (n) =>
          n.isFlashcard &&
          n.flashcardFront.trim() &&
          n.flashcardBack.trim() &&
          (activeCategoryId === null || n.categoryId === activeCategoryId)
      ),
    [notes, activeCategoryId]
  );

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  const current = cards[index];
  const category = current ? categories.find((c) => c.id === current.categoryId) : undefined;
  const progress = cards.length ? Math.round((known.size / cards.length) * 100) : 0;

  function nextCard() {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  function markKnown() {
    if (!current) return;
    setKnown((prev) => new Set(prev).add(current.id));
    nextCard();
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-5xl">🃏</div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">No flashcards yet</h2>
        <p className="max-w-md text-sm text-muted">
          Open a note, enable flashcard mode, and fill in the front and back to start studying.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 w-full max-w-lg">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>
            Card {index + 1} of {cards.length}
          </span>
          <span>{progress}% mastered</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="perspective group relative mb-8 h-72 w-full max-w-lg cursor-pointer"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative h-full w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 shadow-glow"
            style={{ backfaceVisibility: "hidden" }}
          >
            {category && (
              <span
                className="mb-4 rounded-full px-3 py-1 text-xs"
                style={{ backgroundColor: `${category.color}22`, color: category.color }}
              >
                {category.name}
              </span>
            )}
            <p className="text-center text-xl font-medium leading-relaxed text-foreground">
              {current.flashcardFront}
            </p>
            <p className="mt-6 text-xs text-muted">Tap to reveal answer</p>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-accent/40 bg-accent/10 p-8 shadow-glow"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-center text-xl font-medium leading-relaxed text-foreground">
              {current.flashcardBack}
            </p>
            {current.content && (
              <p className="mt-4 max-h-24 overflow-y-auto text-center text-sm text-muted">
                {current.content}
              </p>
            )}
          </div>
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => setFlipped((f) => !f)} className="btn-ghost">
          {flipped ? "Show question" : "Flip card"}
        </button>
        <button type="button" onClick={nextCard} className="btn-ghost">
          Skip
        </button>
        <button type="button" onClick={markKnown} className="btn-primary">
          Got it ✓
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setFlipped(false);
          setKnown(new Set());
        }}
        className="mt-6 text-xs text-muted hover:text-foreground"
      >
        Reset session
      </button>
    </div>
  );
}
