/* ══════════════════════════════════════════
   MNEMO — app.js
   Full note-taking + flashcard application
   All data persisted in localStorage
══════════════════════════════════════════ */

// ── State ──────────────────────────────────
let state = {
  subjects: [],
  notes: [],
  activeSubject: 'all',
  activeView: 'notes',
  activeFilter: 'all',
  searchQuery: '',
  editingNoteId: null,
  editingSubjectId: null,
  selectedColor: '#7c6af7',
  selectedIcon: '📚',
  // Flashcard state
  fcDeck: [],
  fcIndex: 0,
  fcFlipped: false,
  fcCorrect: 0,
  fcTotal: 0,
};

// ── Config ─────────────────────────────────
const COLORS = [
  '#7c6af7','#5ecfea','#5eea9a','#e8c96a',
  '#ea5e87','#f0804a','#a78bfa','#34d399',
  '#60a5fa','#f472b6','#fb923c','#a3e635'
];

const ICONS = [
  '📚','🔬','🧮','🌍','💡','⚗️','📐','🎭',
  '📝','🎵','💻','🏛️','🔭','🧬','📖','✏️',
  '🧪','🗺️','🎯','🔤','🌿','⚡','🧲','🌊'
];

// ── Persistence ────────────────────────────
function save() {
  localStorage.setItem('mnemo_subjects', JSON.stringify(state.subjects));
  localStorage.setItem('mnemo_notes', JSON.stringify(state.notes));
}

function load() {
  try {
    const s = localStorage.getItem('mnemo_subjects');
    const n = localStorage.getItem('mnemo_notes');
    if (s) state.subjects = JSON.parse(s);
    if (n) state.notes = JSON.parse(n);
  } catch(e) { console.warn('Load error', e); }
}

// ── Init ────────────────────────────────────
function init() {
  load();
  generateNoise();
  renderSubjectList();
  renderNotes();
  updateStats();
  populateSubjectSelects();
  buildColorSwatches();
  buildIconGrid();
}

// ── Noise canvas ────────────────────────────
function generateNoise() {
  const canvas = document.getElementById('noiseCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 256; canvas.height = 256;
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  canvas.style.cssText = `
    position:fixed;inset:0;width:100%;height:100%;
    pointer-events:none;opacity:0.025;z-index:9999;
    background:url(${canvas.toDataURL()}) repeat;
  `;
}

// ── Sidebar ─────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sb.classList.toggle('mobile-open');
  } else {
    sb.classList.toggle('collapsed');
  }
}

// ── Views ────────────────────────────────────
function switchView(view, btn) {
  state.activeView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const titles = { notes: 'All Notes', flashcards: 'Flashcards' };
  document.getElementById('topbarTitle').textContent = titles[view];
  document.getElementById('ctaBtn').style.display = view === 'notes' ? 'flex' : 'none';

  if (view === 'flashcards') {
    populateFcFilter();
    loadFlashcards();
  }
}

// ── Subject list ─────────────────────────────
function renderSubjectList() {
  const list = document.getElementById('subjectList');
  list.innerHTML = '';

  // "All" item
  const allLi = document.createElement('li');
  allLi.className = 'subject-item' + (state.activeSubject === 'all' ? ' active' : '');
  allLi.innerHTML = `
    <span class="subject-icon">◈</span>
    <span class="subject-name">All Notes</span>
    <span class="subject-count">${state.notes.length}</span>
  `;
  allLi.onclick = () => selectSubject('all', allLi);
  list.appendChild(allLi);

  state.subjects.forEach(sub => {
    const count = state.notes.filter(n => n.subjectId === sub.id).length;
    const li = document.createElement('li');
    li.className = 'subject-item' + (state.activeSubject === sub.id ? ' active' : '');
    li.innerHTML = `
      <span class="subject-dot" style="color:${sub.color};background:${sub.color}"></span>
      <span class="subject-icon">${sub.icon}</span>
      <span class="subject-name">${escHtml(sub.name)}</span>
      <span class="subject-count">${count}</span>
      <div class="subject-actions">
        <button class="subj-action-btn" onclick="event.stopPropagation();editSubject('${sub.id}')" title="Edit">✎</button>
        <button class="subj-action-btn delete" onclick="event.stopPropagation();deleteSubject('${sub.id}')" title="Delete">×</button>
      </div>
    `;
    li.onclick = () => selectSubject(sub.id, li);
    list.appendChild(li);
  });
}

function selectSubject(id, el) {
  state.activeSubject = id;
  document.querySelectorAll('.subject-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');

  // Update page title
  if (id === 'all') {
    document.getElementById('topbarTitle').textContent = 'All Notes';
  } else {
    const sub = state.subjects.find(s => s.id === id);
    if (sub) document.getElementById('topbarTitle').textContent = sub.name;
  }

  renderNotes();
}

// ── Notes rendering ───────────────────────────
function getFilteredNotes() {
  let notes = [...state.notes];

  if (state.activeSubject !== 'all') {
    notes = notes.filter(n => n.subjectId === state.activeSubject);
  }

  if (state.activeFilter === 'flashcard') {
    notes = notes.filter(n => n.isFlashcard);
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      stripTags(n.content).toLowerCase().includes(q) ||
      (n.tag && n.tag.toLowerCase().includes(q))
    );
  }

  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  const empty = document.getElementById('emptyState');
  const filtered = getFilteredNotes();

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = '';

  filtered.forEach((note, i) => {
    const sub = state.subjects.find(s => s.id === note.subjectId);
    const preview = stripTags(note.content).slice(0, 140);
    const date = formatDate(note.updatedAt);

    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.setProperty('--card-accent', sub ? sub.color : 'var(--accent)');
    card.style.animationDelay = `${i * 40}ms`;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-title">${escHtml(note.title)}</div>
        ${note.isFlashcard ? '<span class="card-fc-badge">⟡ Card</span>' : ''}
      </div>
      <div class="card-preview">${escHtml(preview)}${preview.length >= 140 ? '…' : ''}</div>
      <div class="card-footer">
        <div class="card-tags">
          ${sub ? `<span class="card-tag subject-tag" style="--tag-bg:${hexAlpha(sub.color,0.1)};--tag-color:${sub.color};--tag-border:${hexAlpha(sub.color,0.25)}">${sub.icon} ${escHtml(sub.name)}</span>` : ''}
          ${note.tag ? `<span class="card-tag label-tag">${escHtml(note.tag)}</span>` : ''}
        </div>
        <span class="card-date">${date}</span>
        <button class="card-menu-btn" onclick="event.stopPropagation();showCardMenu(event,'${note.id}')" title="Options">···</button>
      </div>
    `;

    card.onclick = () => viewNote(note.id);
    grid.appendChild(card);
  });
}

// ── Note CRUD ─────────────────────────────────
function openNoteModal(noteId = null) {
  clearNoteForm();
  const heading = document.getElementById('modalHeading');

  if (noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    state.editingNoteId = noteId;
    heading.textContent = 'Edit Note';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteSubject').value = note.subjectId || '';
    document.getElementById('noteContent').innerHTML = note.content;
    document.getElementById('noteTag').value = note.tag || '';
    document.getElementById('noteIsFlashcard').checked = note.isFlashcard;
  } else {
    state.editingNoteId = null;
    heading.textContent = 'New Note';
    // pre-select active subject
    if (state.activeSubject !== 'all') {
      document.getElementById('noteSubject').value = state.activeSubject;
    }
  }

  populateNoteSubjectSelect();
  openModal('noteModal');
  setTimeout(() => document.getElementById('noteTitle').focus(), 150);
}

function clearNoteForm() {
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').innerHTML = '';
  document.getElementById('noteTag').value = '';
  document.getElementById('noteIsFlashcard').checked = false;
}

function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').innerHTML.trim();
  const subjectId = document.getElementById('noteSubject').value || null;
  const tag = document.getElementById('noteTag').value.trim();
  const isFlashcard = document.getElementById('noteIsFlashcard').checked;

  if (!title) { showToast('Please enter a title', 'error'); return; }
  if (!content || content === '') { showToast('Please add some content', 'error'); return; }

  const now = Date.now();

  if (state.editingNoteId) {
    const idx = state.notes.findIndex(n => n.id === state.editingNoteId);
    if (idx !== -1) {
      state.notes[idx] = {
        ...state.notes[idx],
        title, content, subjectId, tag, isFlashcard,
        updatedAt: now
      };
    }
    showToast('Note updated ✓', 'success');
  } else {
    state.notes.push({
      id: uid(),
      title, content, subjectId, tag, isFlashcard,
      createdAt: now,
      updatedAt: now
    });
    showToast('Note saved ✓', 'success');
  }

  save();
  closeModal('noteModal');
  renderNotes();
  renderSubjectList();
  updateStats();
}

function viewNote(id) {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  state.editingNoteId = id;

  const sub = state.subjects.find(s => s.id === note.subjectId);

  document.getElementById('viewTitle').textContent = note.title;

  document.getElementById('viewMeta').innerHTML = `
    ${sub ? `<span class="card-tag subject-tag" style="--tag-bg:${hexAlpha(sub.color,0.1)};--tag-color:${sub.color};--tag-border:${hexAlpha(sub.color,0.25)}">${sub.icon} ${escHtml(sub.name)}</span>` : ''}
    ${note.tag ? `<span class="card-tag label-tag">${escHtml(note.tag)}</span>` : ''}
    ${note.isFlashcard ? '<span class="card-fc-badge">⟡ Flashcard</span>' : ''}
    <span class="card-date" style="margin-left:4px">${formatDate(note.updatedAt)}</span>
  `;

  document.getElementById('viewContent').innerHTML = note.content;
  openModal('viewModal');
}

function editViewedNote() {
  closeModal('viewModal');
  setTimeout(() => openNoteModal(state.editingNoteId), 150);
}

function deleteViewedNote() {
  if (!confirm('Delete this note?')) return;
  state.notes = state.notes.filter(n => n.id !== state.editingNoteId);
  save();
  closeModal('viewModal');
  renderNotes();
  renderSubjectList();
  updateStats();
  showToast('Note deleted', 'success');
}

function showCardMenu(e, noteId) {
  e.stopPropagation();
  // inline edit/delete options using a temporary menu
  const existing = document.getElementById('cardContextMenu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'cardContextMenu';
  menu.style.cssText = `
    position:fixed;top:${e.clientY}px;left:${e.clientX}px;
    background:var(--bg-3);border:1px solid var(--border-2);
    border-radius:8px;padding:6px;z-index:500;
    box-shadow:0 8px 30px rgba(0,0,0,0.5);
    display:flex;flex-direction:column;gap:2px;min-width:140px;
  `;

  const mkBtn = (label, fn, danger = false) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = `
      padding:8px 12px;background:transparent;border:none;
      border-radius:6px;cursor:pointer;text-align:left;
      font-family:var(--font-ui);font-size:13px;width:100%;
      color:${danger ? 'var(--rose)' : 'var(--text-1)'};transition:background 0.15s;
    `;
    b.onmouseenter = () => b.style.background = 'var(--bg-4)';
    b.onmouseleave = () => b.style.background = 'transparent';
    b.onclick = () => { menu.remove(); fn(); };
    return b;
  };

  menu.appendChild(mkBtn('✎  Edit', () => openNoteModal(noteId)));
  menu.appendChild(mkBtn('×  Delete', () => {
    if (!confirm('Delete this note?')) return;
    state.notes = state.notes.filter(n => n.id !== noteId);
    save(); renderNotes(); renderSubjectList(); updateStats();
    showToast('Note deleted', 'success');
  }, true));

  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
}

// ── Filter ────────────────────────────────────
function setFilter(filter, el) {
  state.activeFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderNotes();
}

function handleSearch() {
  state.searchQuery = document.getElementById('searchInput').value;
  renderNotes();
}

// ── Subjects ──────────────────────────────────
function openSubjectModal(id = null) {
  state.editingSubjectId = id;
  document.getElementById('subjectModalHeading').textContent = id ? 'Edit Subject' : 'New Subject';

  if (id) {
    const sub = state.subjects.find(s => s.id === id);
    if (sub) {
      document.getElementById('subjectNameInput').value = sub.name;
      state.selectedColor = sub.color;
      state.selectedIcon = sub.icon;
    }
  } else {
    document.getElementById('subjectNameInput').value = '';
    state.selectedColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    state.selectedIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
  }

  buildColorSwatches();
  buildIconGrid();
  openModal('subjectModal');
  setTimeout(() => document.getElementById('subjectNameInput').focus(), 150);
}

function editSubject(id) { openSubjectModal(id); }

function deleteSubject(id) {
  const sub = state.subjects.find(s => s.id === id);
  const noteCount = state.notes.filter(n => n.subjectId === id).length;
  const msg = noteCount > 0
    ? `Delete "${sub.name}" and unassign ${noteCount} note(s)?`
    : `Delete subject "${sub.name}"?`;
  if (!confirm(msg)) return;

  state.notes = state.notes.map(n => n.subjectId === id ? { ...n, subjectId: null } : n);
  state.subjects = state.subjects.filter(s => s.id !== id);
  if (state.activeSubject === id) selectSubject('all', null);
  save();
  renderSubjectList();
  renderNotes();
  updateStats();
  populateSubjectSelects();
  showToast('Subject deleted', 'success');
}

function saveSubject() {
  const name = document.getElementById('subjectNameInput').value.trim();
  if (!name) { showToast('Enter a subject name', 'error'); return; }

  if (state.editingSubjectId) {
    const idx = state.subjects.findIndex(s => s.id === state.editingSubjectId);
    if (idx !== -1) {
      state.subjects[idx] = { ...state.subjects[idx], name, color: state.selectedColor, icon: state.selectedIcon };
    }
    showToast('Subject updated ✓', 'success');
  } else {
    state.subjects.push({ id: uid(), name, color: state.selectedColor, icon: state.selectedIcon });
    showToast('Subject created ✓', 'success');
  }

  save();
  closeModal('subjectModal');
  renderSubjectList();
  renderNotes();
  updateStats();
  populateSubjectSelects();
}

function buildColorSwatches() {
  const wrap = document.getElementById('colorSwatches');
  wrap.innerHTML = '';
  COLORS.forEach(color => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (color === state.selectedColor ? ' selected' : '');
    sw.style.background = color;
    sw.style.boxShadow = `0 0 10px ${color}55`;
    sw.onclick = () => {
      state.selectedColor = color;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    };
    wrap.appendChild(sw);
  });
}

function buildIconGrid() {
  const wrap = document.getElementById('iconGrid');
  wrap.innerHTML = '';
  ICONS.forEach(icon => {
    const btn = document.createElement('div');
    btn.className = 'icon-opt' + (icon === state.selectedIcon ? ' selected' : '');
    btn.textContent = icon;
    btn.title = icon;
    btn.onclick = () => {
      state.selectedIcon = icon;
      document.querySelectorAll('.icon-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    };
    wrap.appendChild(btn);
  });
}

// ── Selects population ────────────────────────
function populateSubjectSelects() {
  populateNoteSubjectSelect();
  populateFcFilter();
}

function populateNoteSubjectSelect() {
  const sel = document.getElementById('noteSubject');
  sel.innerHTML = '<option value="">— Unsorted —</option>';
  state.subjects.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub.id;
    opt.textContent = `${sub.icon} ${sub.name}`;
    sel.appendChild(opt);
  });
}

function populateFcFilter() {
  const sel = document.getElementById('fcSubjectFilter');
  const cur = sel.value;
  sel.innerHTML = '<option value="all">All Subjects</option>';
  state.subjects.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub.id;
    opt.textContent = `${sub.icon} ${sub.name}`;
    sel.appendChild(opt);
  });
  sel.value = cur || 'all';
}

// ── Flashcards ────────────────────────────────
function loadFlashcards() {
  const filter = document.getElementById('fcSubjectFilter').value;
  let cards = state.notes.filter(n => n.isFlashcard);
  if (filter !== 'all') cards = cards.filter(n => n.subjectId === filter);

  state.fcDeck = cards;
  state.fcIndex = 0;
  state.fcFlipped = false;
  state.fcCorrect = 0;
  state.fcTotal = 0;

  const fcEmpty = document.getElementById('fcEmpty');
  const fcMain = document.getElementById('fcMain');

  if (cards.length === 0) {
    fcEmpty.style.display = 'flex';
    fcMain.style.display = 'none';
    document.getElementById('fcScoreDisplay').style.display = 'none';
    return;
  }

  fcEmpty.style.display = 'none';
  fcMain.style.display = 'flex';
  document.getElementById('fcScoreDisplay').style.display = 'none';
  renderCard();
}

function renderCard() {
  const card = state.fcDeck[state.fcIndex];
  if (!card) return;

  const fc = document.getElementById('flashcard');
  fc.classList.remove('flipped');
  state.fcFlipped = false;

  document.getElementById('fcFront').textContent = card.title;
  document.getElementById('fcBack').innerHTML = card.content;

  const total = state.fcDeck.length;
  document.getElementById('fcCounter').textContent = `Card ${state.fcIndex + 1} of ${total}`;
  document.getElementById('fcProgressBar').style.width = `${((state.fcIndex + 1) / total) * 100}%`;
  document.getElementById('fcHint').style.display = 'block';
  document.getElementById('fcRatingBtns').style.display = 'none';

  // Update score display
  if (state.fcTotal > 0) {
    document.getElementById('fcScoreDisplay').style.display = 'flex';
    document.getElementById('fcCorrect').textContent = state.fcCorrect;
    document.getElementById('fcTotal').textContent = state.fcTotal;
  }
}

function flipCard() {
  const fc = document.getElementById('flashcard');
  fc.classList.toggle('flipped');
  state.fcFlipped = !state.fcFlipped;

  if (state.fcFlipped) {
    document.getElementById('fcHint').style.display = 'none';
    document.getElementById('fcRatingBtns').style.display = 'flex';
  }
}

function nextCard() {
  if (state.fcIndex < state.fcDeck.length - 1) {
    state.fcIndex++;
    renderCard();
  } else {
    showToast('🎉 End of deck!', 'success');
  }
}

function prevCard() {
  if (state.fcIndex > 0) {
    state.fcIndex--;
    renderCard();
  }
}

function rateCard(correct) {
  state.fcTotal++;
  if (correct) state.fcCorrect++;
  nextCard();
}

function shuffleFlashcards() {
  state.fcDeck = [...state.fcDeck].sort(() => Math.random() - 0.5);
  state.fcIndex = 0;
  state.fcFlipped = false;
  state.fcCorrect = 0;
  state.fcTotal = 0;
  renderCard();
  showToast('Deck shuffled ⇄', 'success');
}

// ── Toggle flashcard field ────────────────────
function toggleFcField() {
  // No extra field needed — just visual feedback
}

// ── Editor helpers ────────────────────────────
function fmt(cmd, val) {
  document.getElementById('noteContent').focus();
  document.execCommand(cmd, false, val || null);
}

function wrapFormula() {
  document.getElementById('noteContent').focus();
  const sel = window.getSelection();
  const text = sel.toString() || 'formula here';
  document.execCommand('insertHTML', false,
    `<span class="formula-block">${escHtml(text)}</span>&nbsp;`);
}

function insertUL() {
  document.getElementById('noteContent').focus();
  document.execCommand('insertUnorderedList', false, null);
}

// ── Modals ─────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

function overlayClose(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

// ── Stats ─────────────────────────────────────
function updateStats() {
  document.getElementById('statNotes').textContent = state.notes.length;
  document.getElementById('statCards').textContent = state.notes.filter(n => n.isFlashcard).length;
  document.getElementById('statSubjects').textContent = state.subjects.length;
}

// ── Utilities ─────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function stripTags(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.className = 'toast', 2800);
}

// ── Keyboard shortcuts ────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['noteModal','subjectModal','viewModal'].forEach(id => {
      if (document.getElementById(id).classList.contains('open')) closeModal(id);
    });
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    if (state.activeView === 'notes') openNoteModal();
  }
});

// ── Bootstrap ─────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
