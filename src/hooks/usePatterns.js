import { useState, useCallback } from 'react';

const STORAGE_KEY = 'strudel-studio-patterns';

const SEED = [
  {
    id: 'seed-dark-pad',
    name: 'Dark Pad',
    code: `note("<c3 eb3 g3 bb3>/4").sound("sawtooth")
  .lpf(sine.range(200, 900).slow(8))
  .gain(0.4)`,
  },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // First launch — seed a demo pattern so the sidebar isn't empty
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

  const savePattern = useCallback((name, code) => {
    setPatterns((prev) => {
      const existing = prev.findIndex((p) => p.name === name);
      const updated =
        existing >= 0
          ? prev.map((p, i) => (i === existing ? { ...p, code } : p))
          : [...prev, { id: crypto.randomUUID(), name, code }];
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

  return { patterns, savePattern, deletePattern, renamePattern };
}
