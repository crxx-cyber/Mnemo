"use client";

import { useState } from "react";
import type { Category } from "@/types";

const PALETTE = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

interface SidebarProps {
  categories: Category[];
  activeCategoryId: string | null;
  noteCounts: Record<string, number>;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (name: string, color: string) => void;
  onUpdateCategory: (id: string, name: string, color?: string) => void;
  onDeleteCategory: (id: string) => void;
}

export function Sidebar({
  categories,
  activeCategoryId,
  noteCounts,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCategory(newName, newColor);
    setNewName("");
    setAdding(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  }

  function saveEdit(id: string) {
    if (!editName.trim()) return;
    onUpdateCategory(id, editName, editColor);
    setEditingId(null);
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌘</span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Memo</h1>
            <p className="text-xs text-muted">Your study vault</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-widest text-muted">
          Subjects
        </p>

        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
            activeCategoryId === null
              ? "bg-accent/15 text-accent ring-1 ring-accent/30"
              : "text-foreground/80 hover:bg-elevated"
          }`}
        >
          <span>All notes</span>
          <span className="rounded-full bg-elevated px-2 py-0.5 text-xs text-muted">
            {Object.values(noteCounts).reduce((a, b) => a + b, 0)}
          </span>
        </button>

        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.id}>
              {editingId === cat.id ? (
                <div className="rounded-xl border border-border bg-elevated p-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-base mb-2"
                    autoFocus
                  />
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`h-5 w-5 rounded-full ring-offset-2 ring-offset-surface ${
                          editColor === c ? "ring-2 ring-white/60" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveEdit(cat.id)} className="btn-primary flex-1 text-xs">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="btn-ghost text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`group flex items-center gap-1 rounded-xl transition ${
                    activeCategoryId === cat.id ? "bg-accent/15 ring-1 ring-accent/30" : "hover:bg-elevated"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className="flex flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 truncate text-foreground/90">{cat.name}</span>
                    <span className="text-xs text-muted">{noteCounts[cat.id] ?? 0}</span>
                  </button>
                  <div className="flex opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="px-1.5 py-2 text-xs text-muted hover:text-foreground"
                      title="Rename"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${cat.name}" and all its notes?`)) onDeleteCategory(cat.id);
                      }}
                      className="px-1.5 py-2 text-xs text-muted hover:text-red-400"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {adding ? (
          <form onSubmit={handleAdd} className="mt-3 rounded-xl border border-border bg-elevated p-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Subject name..."
              className="input-base mb-2"
              autoFocus
            />
            <div className="mb-2 flex flex-wrap gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-5 w-5 rounded-full ring-offset-2 ring-offset-surface ${
                    newColor === c ? "ring-2 ring-white/60" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 text-xs">
                Add
              </button>
              <button type="button" onClick={() => setAdding(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted transition hover:border-accent/40 hover:text-accent"
          >
            + New subject
          </button>
        )}
      </div>
    </aside>
  );
}
