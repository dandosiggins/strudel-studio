import { useState, useRef, useEffect } from 'react';

// ── Built-in presets ──────────────────────────────────────────────────────────

const PRESETS = [
  {
    name: 'Void',
    description: 'Dark ambient',
    code: `stack(
  // Deep drone pad — slow filter sweep
  note("c2 g2").sound("juno").slow(8).room(0.95).lpf(sine.range(200, 800).slow(16)).gain(0.6),

  // Mid layer — evolving supersaw
  note("<c3 eb3 g3> <bb2 d3 f3>").sound("supersaw").slow(8).room(0.9).gain(0.35).pan(sine.range(-0.5, 0.5).slow(20)),

  // High shimmer — sparse piano notes
  note("c5 ~ ~ ~ g4 ~ ~ ~ eb5 ~ ~ ~").sound("piano").room(0.95).gain(0.3).delay(0.7).slow(2),

  // Sub bass pulse
  note("c1 ~ ~ ~ ~ ~ ~ ~").sound("moog").gain(0.3).lpf(150).slow(2),

  // Very sparse percussion
  sound("bd ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~").gain(0.4).room(0.8)
)`,
  },
  {
    name: 'Midnight Drive',
    description: 'Dark synthwave',
    code: `stack(
  note("<c3 eb3 g3 bb3> <f3 ab3 c4 eb4>").sound("supersaw").slow(4).room(0.5).lpf(1200).gain(0.6),
  note("c2 ~ g2 ~ f2 ~ eb2 ~").sound("moog").gain(0.3).lpf(600).slow(2),
  sound("bd ~ bd ~").gain(0.85),
  sound("~ sd ~ sd").gain(0.7),
  sound("hh*8").gain(0.25).lpf(6000)
)`,
  },
  {
    name: 'Forest',
    description: 'Organic ambient',
    code: `stack(
  note("c4 e4 g4 b4").sound("piano").slow(4).room(0.9).delay(0.5).gain(0.4),
  note("g3 d4 a3 e4").sound("juno").slow(8).room(0.95).gain(0.3).lpf(sine.range(300, 1200).slow(12)),
  note("c2 g2 f2 eb2").sound("jvbass").slow(4).gain(0.5).room(0.6).lpf(400),
  sound("bd ~ ~ ~ ~ ~ bd ~ ~ ~ ~ ~").gain(0.35).room(0.7)
)`,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function groupPatterns(patterns) {
  const groups = {};
  for (const p of patterns) {
    const cat = p.category || 'Uncategorized';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }
  return groups;
}

function sortedCategories(groups) {
  const named = Object.keys(groups).filter((k) => k !== 'Uncategorized').sort();
  return Object.prototype.hasOwnProperty.call(groups, 'Uncategorized')
    ? [...named, 'Uncategorized']
    : named;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sidebar({
  patterns,
  currentName,
  onSave,
  onLoad,
  onDelete,
  onRename,
  onRenameCategory,
  onDeleteCategory,
  onNew,
  onNameChange,
  onImport,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [importMsg, setImportMsg] = useState(null);
  const [saveCategory, setSaveCategory] = useState('');
  const [collapsed, setCollapsed] = useState(new Set());
  const [categoryMenu, setCategoryMenu] = useState(null); // { name, x, y }
  const [renamingCat, setRenamingCat] = useState(null);   // { old, value }
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // Close ⋮ menu on outside click
  useEffect(() => {
    if (!categoryMenu) return;
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setCategoryMenu(null);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [categoryMenu]);

  function handleSave() {
    if (!currentName.trim()) return;
    onSave(currentName.trim(), saveCategory.trim() || '');
  }

  function showMsg(msg) {
    setImportMsg(msg);
    setTimeout(() => setImportMsg(null), 3000);
  }

  function handleExportAll() {
    const data = JSON.stringify(patterns.map(({ name, code, category }) => ({ name, code, category })), null, 2);
    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(data, `strudel-patterns-${date}.json`);
  }

  function handleExportOne(p) {
    const data = JSON.stringify([{ name: p.name, code: p.code, category: p.category }], null, 2);
    triggerDownload(data, `${p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`);
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        const valid = parsed.filter(
          (p) => typeof p?.name === 'string' && typeof p?.code === 'string',
        );
        if (valid.length === 0) throw new Error('no valid patterns found');
        const count = onImport(valid);
        showMsg(`${count} pattern${count !== 1 ? 's' : ''} imported`);
      } catch (err) {
        showMsg(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  function startRename(p) {
    setEditingId(p.id);
    setEditingName(p.name);
  }

  function commitRename(p) {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== p.name) onRename(p.id, trimmed);
    setEditingId(null);
  }

  function handleLoadPattern(p) {
    onLoad(p);
    setSaveCategory(p.category || '');
  }

  function toggleCollapse(cat) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function openCategoryMenu(e, name) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setCategoryMenu({ name, x: rect.left, y: rect.bottom + 2 });
  }

  function startRenameCat(name) {
    setCategoryMenu(null);
    setRenamingCat({ old: name, value: name });
  }

  function commitRenameCat() {
    if (renamingCat) {
      onRenameCategory(renamingCat.old, renamingCat.value);
      setRenamingCat(null);
    }
  }

  function handleDeleteCat(name) {
    setCategoryMenu(null);
    onDeleteCategory(name);
  }

  // Derive existing category names for datalist
  const existingCategories = [...new Set(patterns.map((p) => p.category || 'Uncategorized'))].sort();
  const groups = groupPatterns(patterns);
  const cats = sortedCategories(groups);

  return (
    <aside
      className="w-64 border-r border-gray-800 flex flex-col"
      style={{ height: '100%', flexShrink: 0, background: 'linear-gradient(160deg, #181e2d 0%, #0f1219 100%)' }}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800/70">
        <div className="flex items-center gap-2.5">
          <WaveformIcon />
          <h1 className="text-base font-bold text-gray-100 tracking-tight">
            Strudel Studio
          </h1>
        </div>
      </div>

      {/* Pattern name + category + save/new */}
      <div className="px-3 py-3 border-b border-gray-800/70 flex flex-col gap-2">
        <input
          value={currentName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Pattern name…"
          className="w-full bg-gray-800/60 text-gray-100 text-xs px-2.5 py-2 rounded-md border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none font-mono transition-colors placeholder-gray-600"
        />
        <input
          list="category-options"
          value={saveCategory}
          onChange={(e) => setSaveCategory(e.target.value)}
          placeholder="Category (optional)…"
          className="w-full bg-gray-800/40 text-gray-400 text-xs px-2.5 py-1.5 rounded-md border border-gray-700/60 focus:border-indigo-500/60 focus:outline-none font-mono transition-colors placeholder-gray-600"
        />
        <datalist id="category-options">
          {existingCategories.map((c) => <option key={c} value={c} />)}
        </datalist>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 text-xs py-2 rounded-md bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-semibold transition-colors"
          >
            Save
          </button>
          <button
            onClick={onNew}
            className="flex-1 text-xs py-2 rounded-md bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-gray-300 font-semibold border border-gray-700 transition-colors"
          >
            New
          </button>
        </div>
      </div>

      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto pb-2 min-h-0">

        {/* Presets */}
        <SectionHeader label="Presets" />
        <div className="px-2">
          {PRESETS.map((p) => (
            <PresetItem key={p.name} preset={p} onLoad={() => { onLoad(p); setSaveCategory(''); }} />
          ))}
        </div>

        {/* User pattern categories */}
        <SectionHeader label="My Patterns" />
        {patterns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <MusicNoteIcon />
            <p className="text-xs text-gray-600 italic leading-relaxed">
              No saved patterns yet.<br />Hit Save to store one.
            </p>
          </div>
        ) : (
          cats.map((cat) => {
            const pats = groups[cat];
            const isCollapsed = collapsed.has(cat);
            const isRenaming = renamingCat?.old === cat;
            const menuOpen = categoryMenu?.name === cat;

            return (
              <div key={cat}>
                {/* Category header */}
                <div className="flex items-center gap-1 px-2 py-1 mt-1 group">
                  <button
                    onClick={() => toggleCollapse(cat)}
                    className="flex-shrink-0 text-gray-700 hover:text-gray-400 transition-colors"
                  >
                    <ChevronIcon collapsed={isCollapsed} />
                  </button>
                  <FolderIcon />
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renamingCat.value}
                      onChange={(e) => setRenamingCat((r) => ({ ...r, value: e.target.value }))}
                      onBlur={commitRenameCat}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRenameCat();
                        if (e.key === 'Escape') setRenamingCat(null);
                      }}
                      className="flex-1 min-w-0 bg-gray-700 text-gray-200 text-xs px-1.5 py-0.5 rounded border border-gray-500 focus:outline-none font-mono"
                    />
                  ) : (
                    <span
                      onClick={() => toggleCollapse(cat)}
                      className="flex-1 min-w-0 text-xs font-semibold text-gray-500 truncate select-none cursor-pointer"
                    >
                      {cat}
                    </span>
                  )}
                  <span className="text-xs text-gray-700 tabular-nums flex-shrink-0">{pats.length}</span>
                  <button
                    onClick={(e) => openCategoryMenu(e, cat)}
                    className={`flex-shrink-0 p-0.5 transition-colors rounded ${
                      menuOpen
                        ? 'text-gray-400'
                        : 'text-gray-700 opacity-0 group-hover:opacity-100 hover:text-gray-400'
                    }`}
                  >
                    <DotsIcon />
                  </button>
                </div>

                {/* Pattern items */}
                {!isCollapsed && (
                  <div className="ml-4 px-1">
                    {pats.map((p) => (
                      <PatternItem
                        key={p.id}
                        pattern={p}
                        isEditing={editingId === p.id}
                        editingName={editingName}
                        onEditingNameChange={setEditingName}
                        onLoad={() => handleLoadPattern(p)}
                        onExport={() => handleExportOne(p)}
                        onDelete={() => onDelete(p.id)}
                        onStartRename={() => startRename(p)}
                        onCommitRename={() => commitRename(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Import/export toolbar */}
      {importMsg && (
        <div className={`px-3 py-1.5 text-xs text-center font-mono border-t border-gray-800/70 ${
          importMsg.startsWith('Import failed') ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {importMsg}
        </div>
      )}
      <div className="border-t border-gray-800/70 px-3 py-2 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import patterns from .json file"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded bg-gray-800/60 hover:bg-gray-700/80 text-gray-500 hover:text-gray-300 border border-gray-700/50 transition-colors"
        >
          <ImportIcon /> Import
        </button>
        <button
          onClick={handleExportAll}
          disabled={patterns.length === 0}
          title="Export all patterns to .json file"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded bg-gray-800/60 hover:bg-gray-700/80 text-gray-500 hover:text-gray-300 border border-gray-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ExportIcon /> Export All
        </button>
      </div>

      {/* Category ⋮ dropdown menu — fixed position to escape overflow */}
      {categoryMenu && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', left: categoryMenu.x, top: categoryMenu.y, zIndex: 1000 }}
          className="bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 min-w-32"
        >
          <button
            onClick={() => startRenameCat(categoryMenu.name)}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Rename folder
          </button>
          {categoryMenu.name !== 'Uncategorized' && (
            <button
              onClick={() => handleDeleteCat(categoryMenu.name)}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
            >
              Delete folder
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div className="px-4 pt-3 pb-1 flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-800/80" />
    </div>
  );
}

function PresetItem({ preset, onLoad }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-800/40 rounded-md group">
      <DiamondIcon className="text-indigo-500/60 flex-shrink-0 group-hover:text-indigo-400/80 transition-colors" />
      <div className="flex-1 min-w-0">
        <span className="block text-xs text-gray-400 font-mono truncate">{preset.name}</span>
        <span className="block text-xs text-gray-700 truncate">{preset.description}</span>
      </div>
      <button
        onClick={onLoad}
        title="Load preset"
        className="text-xs px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-700 text-indigo-400 hover:text-white transition-colors font-medium flex-shrink-0"
      >
        Load
      </button>
    </div>
  );
}

function PatternItem({
  pattern,
  isEditing,
  editingName,
  onEditingNameChange,
  onLoad,
  onExport,
  onDelete,
  onStartRename,
  onCommitRename,
}) {
  return (
    <div className="flex items-center gap-1 px-1 py-1 hover:bg-gray-800/50 rounded-md">
      {isEditing ? (
        <input
          autoFocus
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitRename();
            if (e.key === 'Escape') onEditingNameChange(pattern.name);
          }}
          className="flex-1 min-w-0 bg-gray-700 text-gray-100 text-xs px-1.5 py-0.5 rounded border border-gray-500 focus:outline-none font-mono"
        />
      ) : (
        <span
          onDoubleClick={onStartRename}
          title="Double-click to rename"
          className="flex-1 min-w-0 text-xs text-gray-400 truncate font-mono select-none"
        >
          {pattern.name}
        </span>
      )}

      <button
        onClick={onLoad}
        title="Load pattern"
        className="text-xs px-2 py-0.5 rounded bg-gray-700/80 hover:bg-indigo-600 text-gray-300 hover:text-white transition-colors font-medium flex-shrink-0"
      >
        Load
      </button>

      <button
        onClick={onExport}
        title="Export this pattern"
        className="text-gray-600 hover:text-emerald-400 transition-colors flex-shrink-0 p-0.5"
      >
        <ExportIcon />
      </button>

      <button
        onClick={onDelete}
        title="Delete"
        className="text-gray-600 hover:text-red-400 transition-colors text-sm leading-none px-0.5 flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronIcon({ collapsed }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"
      style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
      <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 14 12" fill="currentColor" className="text-gray-600 flex-shrink-0">
      <path d="M1 2.5 C1 1.7 1.7 1 2.5 1 L5 1 L6 2.5 L11.5 2.5 C12.3 2.5 13 3.2 13 4 L13 10 C13 10.8 12.3 11.5 11.5 11.5 L2.5 11.5 C1.7 11.5 1 10.8 1 10 Z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="6" cy="2.5" r="1.2" />
      <circle cx="6" cy="6" r="1.2" />
      <circle cx="6" cy="9.5" r="1.2" />
    </svg>
  );
}

function DiamondIcon({ className }) {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" className={className}>
      <polygon points="5,0 10,5 5,10 0,5" />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor" className="text-emerald-400 flex-shrink-0">
      <rect x="0"  y="5" width="2" height="4"  rx="1" />
      <rect x="4"  y="2" width="2" height="10" rx="1" />
      <rect x="8"  y="0" width="2" height="14" rx="1" />
      <rect x="12" y="3" width="2" height="8"  rx="1" />
      <rect x="16" y="6" width="2" height="3"  rx="1" />
    </svg>
  );
}

function MusicNoteIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 1v6M3.5 4.5 6 7l2.5-2.5M2 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 7V1M3.5 4.5 6 2l2.5 2.5M2 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
