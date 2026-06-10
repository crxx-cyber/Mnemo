"use client";

import { useRef, useState } from "react";
import type { Category, Note } from "@/types";

interface NoteEditorProps {
  note: Note;
  category?: Category;
  categories: Category[];
  onUpdate: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onAddLink: (noteId: string, url: string, label: string) => void;
  onRemoveLink: (noteId: string, linkId: string) => void;
  onAddImage: (noteId: string, dataUrl: string) => void;
  onRemoveImage: (noteId: string, index: number) => void;
}

export function NoteEditor({
  note,
  category,
  categories,
  onUpdate,
  onDelete,
  onClose,
  onAddLink,
  onRemoveLink,
  onAddImage,
  onRemoveImage,
}: NoteEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") onAddImage(note.id, reader.result);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    onAddLink(note.id, url, linkLabel.trim() || url);
    setLinkUrl("");
    setLinkLabel("");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <button type="button" onClick={onClose} className="btn-ghost text-sm">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="btn-ghost text-sm text-red-400 hover:text-red-300"
          >
            Delete
          </button>
          <button type="button" onClick={onClose} className="btn-primary text-sm">
            Saved
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <select
            value={note.categoryId}
            onChange={(e) => onUpdate(note.id, { categoryId: e.target.value })}
            className="input-base w-auto text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            value={note.title}
            onChange={(e) => onUpdate(note.id, { title: e.target.value })}
            placeholder="Note title..."
            className="w-full border-none bg-transparent text-3xl font-semibold text-foreground placeholder:text-muted/50 focus:outline-none"
          />

          {category && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{ backgroundColor: `${category.color}22`, color: category.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name}
            </span>
          )}

          <textarea
            value={note.content}
            onChange={(e) => onUpdate(note.id, { content: e.target.value })}
            placeholder="Write your formula, theorem, definition, or notes here..."
            rows={10}
            className="input-base min-h-[200px] resize-y leading-relaxed"
          />

          {/* Flashcard section */}
          <section className="rounded-2xl border border-border bg-elevated/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Flashcard mode</h3>
                <p className="text-xs text-muted">Turn this note into a flashcard for memorization</p>
              </div>
              <button
                type="button"
                onClick={() => onUpdate(note.id, { isFlashcard: !note.isFlashcard })}
                className={`relative h-7 w-12 rounded-full transition ${
                  note.isFlashcard ? "bg-accent" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    note.isFlashcard ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {note.isFlashcard && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Front (question)</label>
                  <textarea
                    value={note.flashcardFront}
                    onChange={(e) => onUpdate(note.id, { flashcardFront: e.target.value })}
                    placeholder="e.g. Newton's Second Law"
                    rows={4}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Back (answer)</label>
                  <textarea
                    value={note.flashcardBack}
                    onChange={(e) => onUpdate(note.id, { flashcardBack: e.target.value })}
                    placeholder="e.g. F = ma"
                    rows={4}
                    className="input-base"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Images */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-foreground">Images</h3>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-ghost text-xs"
              >
                + Add image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            {note.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {note.images.map((src, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-video w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(note.id, i)}
                      className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-sm text-muted transition hover:border-accent/40 hover:text-accent"
              >
                <span className="mb-1 text-2xl">🖼</span>
                Drop or click to add images
              </button>
            )}
          </section>

          {/* Links */}
          <section>
            <h3 className="mb-3 font-medium text-foreground">Links</h3>
            <form onSubmit={handleAddLink} className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="input-base flex-1"
              />
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Label (optional)"
                className="input-base sm:w-40"
              />
              <button type="submit" className="btn-primary shrink-0">
                Add link
              </button>
            </form>
            {note.links.length > 0 && (
              <ul className="space-y-2">
                {note.links.map((link) => (
                  <li
                    key={link.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-elevated px-4 py-3"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-accent hover:underline"
                    >
                      {link.label}
                    </a>
                    <button
                      type="button"
                      onClick={() => onRemoveLink(note.id, link.id)}
                      className="ml-3 shrink-0 text-xs text-muted hover:text-red-400"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
