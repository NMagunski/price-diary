import { Suspense } from "react";
import { FamilyJoinClient } from "./FamilyJoinClient";

export default function JoinFamilyPage() {
  return (
    <main className="flex min-h-[calc(100dvh-56px)] items-center justify-center bg-bg px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        }
      >
        <FamilyJoinClient />
      </Suspense>
    </main>
  );
}
