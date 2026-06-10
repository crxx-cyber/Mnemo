"use client";

import { useMemo, useState } from "react";
import { FlashcardStudy } from "@/components/FlashcardStudy";
import { NoteCard } from "@/components/NoteCard";
import { NoteEditor } from "@/components/NoteEditor";
import { Sidebar } from "@/components/Sidebar";
import { useStore } from "@/hooks/useStore";

type View = "notes" | "flashcards";

export default function Home() {
  const store = useStore();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [view, setView] = useState<View>("notes");
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    store.notes.forEach((n) => {
      counts[n.categoryId] = (counts[n.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [store.notes]);

  const filteredNotes = useMemo(() => {
    return store.notes.filter((n) => {
      const inCategory = activeCategoryId === null || n.categoryId === activeCategoryId;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.flashcardFront.toLowerCase().includes(q) ||
        n.flashcardBack.toLowerCase().includes(q);
      return inCategory && matchesSearch;
    });
  }, [store.notes, activeCategoryId, search]);

  const openNote = openNoteId ? store.notes.find((n) => n.id === openNoteId) : null;

  function handleNewNote() {
    const categoryId = activeCategoryId ?? store.categories[0]?.id;
    if (!categoryId) return;
    const id = store.addNote(categoryId);
    setOpenNoteId(id);
    setView("notes");
  }

  if (!store.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading your notes...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        categories={store.categories}
        activeCategoryId={activeCategoryId}
        noteCounts={noteCounts}
        onSelectCategory={setActiveCategoryId}
        onAddCategory={store.addCategory}
        onUpdateCategory={store.updateCategory}
        onDeleteCategory={store.deleteCategory}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {openNote ? (
          <NoteEditor
            note={openNote}
            category={store.categories.find((c) => c.id === openNote.categoryId)}
            categories={store.categories}
            onUpdate={store.updateNote}
            onDelete={(id) => {
              store.deleteNote(id);
              setOpenNoteId(null);
            }}
            onClose={() => setOpenNoteId(null)}
            onAddLink={store.addLink}
            onRemoveLink={store.removeLink}
            onAddImage={store.addImage}
            onRemoveImage={store.removeImage}
          />
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
              <div className="flex items-center gap-1 rounded-xl bg-elevated p-1">
                <button
                  type="button"
                  onClick={() => setView("notes")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    view === "notes" ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setView("flashcards")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    view === "flashcards"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Flashcards
                </button>
              </div>

              {view === "notes" && (
                <div className="flex flex-1 items-center justify-end gap-3 sm:max-w-md">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search notes..."
                    className="input-base flex-1 text-sm"
                  />
                  <button type="button" onClick={handleNewNote} className="btn-primary shrink-0">
                    + New note
                  </button>
                </div>
              )}
            </header>

            {view === "notes" ? (
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {filteredNotes.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-2xl border border-border bg-card p-6 text-4xl">📝</div>
                    <h2 className="mb-2 text-xl font-semibold text-foreground">No notes here yet</h2>
                    <p className="mb-6 max-w-sm text-sm text-muted">
                      Capture physics formulas, math theorems, English vocabulary, and more.
                    </p>
                    <button type="button" onClick={handleNewNote} className="btn-primary">
                      Create your first note
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        category={store.categories.find((c) => c.id === note.categoryId)}
                        onOpen={setOpenNoteId}
                        onDelete={store.deleteNote}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <FlashcardStudy
                notes={store.notes}
                categories={store.categories}
                activeCategoryId={activeCategoryId}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
