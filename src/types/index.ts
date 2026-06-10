export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface NoteLink {
  id: string;
  url: string;
  label: string;
}

export interface Note {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  images: string[];
  links: NoteLink[];
  flashcardFront: string;
  flashcardBack: string;
  isFlashcard: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  categories: Category[];
  notes: Note[];
}
