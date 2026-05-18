import { useState, useCallback } from 'react';

const STORAGE_KEY = 'strudel-studio-patterns';

const SEED = [
  {
    id: 'seed-dark-pad',
    name: 'Dark Pad',
    category: 'Examples',
    code: `note("<c3 eb3 g3 bb3>/4").sound("sawtooth")
  .lpf(sine.range(200, 900).slow(8))
  .gain(0.4)`,
  },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveToStorage(patterns) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

export default function usePatterns() {
  const [patterns, setPatterns] = useState(loadFromStorage);

  // category is optional — existing patterns without it are treated as Uncategorized at read time
  const savePattern = useCallback((name, code, category) => {
    setPatterns((prev) => {
      const existing = prev.findIndex((p) => p.name === name);
      if (existing >= 0) {
        // update code; only change category if one was explicitly provided
        const updated = prev.map((p, i) =>
          i === existing
            ? { ...p, code, ...(category ? { category } : {}) }
            : p,
        );
        saveToStorage(updated);
        return updated;
      }
      const newPat = {
        id: crypto.randomUUID(),
        name,
        code,
        category: category || 'Uncategorized',
      };
      const updated = [...prev, newPat];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const deletePattern = useCallback((id) => {
    setPatterns((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const renamePattern = useCallback((id, newName) => {
    setPatterns((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, name: newName } : p));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const renameCategory = useCallback((oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setPatterns((prev) => {
      const updated = prev.map((p) =>
        (p.category || 'Uncategorized') === oldName ? { ...p, category: trimmed } : p,
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Deleting a category moves all its patterns to Uncategorized
  const deleteCategory = useCallback((name) => {
    setPatterns((prev) => {
      const updated = prev.map((p) =>
        (p.category || 'Uncategorized') === name ? { ...p, category: 'Uncategorized' } : p,
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const importPatterns = useCallback((incoming) => {
    setPatterns((prev) => {
      const taken = new Set(prev.map((p) => p.name));
      const toAdd = incoming.map(({ name, code, category }) => {
        let finalName = name;
        if (taken.has(finalName)) {
          finalName = `${name} (imported)`;
          let n = 2;
          while (taken.has(finalName)) finalName = `${name} (imported ${n++})`;
        }
        taken.add(finalName);
        return { id: crypto.randomUUID(), name: finalName, code, category: category || 'Uncategorized' };
      });
      const updated = [...prev, ...toAdd];
      saveToStorage(updated);
      return updated;
    });
    return incoming.length;
  }, []);

  return { patterns, savePattern, deletePattern, renamePattern, renameCategory, deleteCategory, importPatterns };
}
