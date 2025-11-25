import { Suspense } from "react";
import { FamilyJoinClient } from "./FamilyJoinClient";

export default function JoinFamilyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 px-4 py-8">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
              <p className="text-sm text-slate-600">Зареждане…</p>
            </div>
          }
        >
          <FamilyJoinClient />
        </Suspense>
      </div>
    </main>
  );
}
