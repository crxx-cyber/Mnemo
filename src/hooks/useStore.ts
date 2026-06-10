"use client";

import { useCallback, useEffect, useState } from "react";
import { generateId, getDefaultData, loadData, saveData } from "@/lib/storage";
import type { AppData, Category, Note, NoteLink } from "@/types";

export function useStore() {
  const [data, setData] = useState<AppData>(getDefaultData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(data);
  }, [data, hydrated]);

  const addCategory = useCallback((name: string, color: string) => {
    const category: Category = {
      id: generateId(),
      name: name.trim(),
      color,
      createdAt: Date.now(),
    };
    setData((prev) => ({ ...prev, categories: [...prev.categories, category] }));
    return category.id;
  }, []);

  const updateCategory = useCallback((id: string, name: string, color?: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, name: name.trim(), ...(color ? { color } : {}) } : c
      ),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData((prev) => ({
      categories: prev.categories.filter((c) => c.id !== id),
      notes: prev.notes.filter((n) => n.categoryId !== id),
    }));
  }, []);

  const addNote = useCallback((categoryId: string) => {
    const now = Date.now();
    const note: Note = {
      id: generateId(),
      categoryId,
      title: "",
      content: "",
      images: [],
      links: [],
      flashcardFront: "",
      flashcardBack: "",
      isFlashcard: false,
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
    return note.id;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }));
  }, []);

  const addLink = useCallback((noteId: string, url: string, label: string) => {
    const link: NoteLink = { id: generateId(), url, label };
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId ? { ...n, links: [...n.links, link], updatedAt: Date.now() } : n
      ),
    }));
  }, []);

  const removeLink = useCallback((noteId: string, linkId: string) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId
          ? { ...n, links: n.links.filter((l) => l.id !== linkId), updatedAt: Date.now() }
          : n
      ),
    }));
  }, []);

  const addImage = useCallback((noteId: string, dataUrl: string) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId
          ? { ...n, images: [...n.images, dataUrl], updatedAt: Date.now() }
          : n
      ),
    }));
  }, []);

  const removeImage = useCallback((noteId: string, index: number) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              images: n.images.filter((_, i) => i !== index),
              updatedAt: Date.now(),
            }
          : n
      ),
    }));
  }, []);

  return {
    hydrated,
    categories: data.categories,
    notes: data.notes,
    addCategory,
    updateCategory,
    deleteCategory,
    addNote,
    updateNote,
    deleteNote,
    addLink,
    removeLink,
    addImage,
    removeImage,
  };
}
