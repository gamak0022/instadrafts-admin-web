import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading search…</div>}>
      <SearchClient />
    </Suspense>
  );
}
