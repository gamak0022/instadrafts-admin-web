export type Person = { id: string; name: string };

function normalizePerson(x: any): Person | null {
  const id = String(x?.id || '').trim();
  const name = String(x?.name || '').trim();
  if (!id) return null;
  return { id, name: name || id };
}

export function parsePeople(raw: string | undefined, fallbackPrefix: string): Person[] {
  try {
    const arr = JSON.parse(raw || '[]');
    if (Array.isArray(arr) && arr.length) {
      const out = arr.map(normalizePerson).filter(Boolean) as Person[];
      if (out.length) return out;
    }
  } catch {}
  // fallback defaults (so UI always has something)
  return [
    { id: `${fallbackPrefix}_1`, name: `${fallbackPrefix.toUpperCase()} 1` },
    { id: `${fallbackPrefix}_2`, name: `${fallbackPrefix.toUpperCase()} 2` },
  ];
}
