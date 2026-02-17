"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function SearchClient() {
  const sp = useSearchParams();
  const q = sp.get("q") || "";

  const meta = useMemo(() => {
    return { q, ts: new Date().toISOString() };
  }, [q]);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Search</h1>
      <p style={{ opacity: 0.7, marginTop: 8 }}>
        Query: <span style={{ fontFamily: "monospace" }}>{meta.q || "(empty)"}</span>
      </p>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Debug</div>
        <pre style={{ fontSize: 12, marginTop: 8 }}>{JSON.stringify(meta, null, 2)}</pre>
      </div>
    </main>
  );
}
