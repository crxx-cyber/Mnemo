"use client";

import type { Category, Note } from "@/types";

interface NoteCardProps {
  note: Note;
  category?: Category;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NoteCard({ note, category, onOpen, onDelete }: NoteCardProps) {
  const preview = note.content.trim() || note.flashcardFront || "Empty note";
  const thumb = note.images[0];

  return (
    <article
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-accent/30 hover:shadow-glow"
      onClick={() => onOpen(note.id)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(note.id)}
      role="button"
      tabIndex={0}
    >
      {thumb && (
        <div className="relative h-36 w-full overflow-hidden bg-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium text-foreground">
            {note.title || "Untitled"}
          </h3>
          {note.isFlashcard && (
            <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              Flashcard
            </span>
          )}
        </div>

        <p className="mb-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {preview}
        </p>

        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2">
            {category && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
            )}
            {note.links.length > 0 && <span>🔗 {note.links.length}</span>}
            {note.images.length > 0 && <span>🖼 {note.images.length}</span>}
          </div>
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Delete this note?")) onDelete(note.id);
        }}
        className="absolute right-3 top-3 rounded-lg bg-surface/80 px-2 py-1 text-xs text-muted opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-red-400"
      >
        Delete
      </button>
    </article>
  );
}
