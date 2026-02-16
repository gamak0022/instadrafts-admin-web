import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050B16] text-slate-100 flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
