"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { joinFamily } from "@/lib/firebase/firestore";
import { useState } from "react";

export default function JoinFamilyPage() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get("familyId");
  const { user, loading } = useAuth();
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!familyId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
          <h1 className="mb-2 text-lg font-semibold">Покана за семейство</h1>
          <p className="text-sm text-red-600">
            Невалиден или липсващ идентификатор на семейство.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-slate-600">Зареждане…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
          <h1 className="mb-2 text-lg font-semibold">Покана за семейство</h1>
          <p className="text-sm text-slate-600">
            За да се присъединиш към това семейство, първо трябва да влезеш в
            профила си.
          </p>
          <a
            href="/auth/login"
            className="mt-4 inline-flex w-full justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Вход
          </a>
        </div>
      </main>
    );
  }

  const handleJoin = async () => {
    setError(null);
    setSuccess(null);
    try {
      setJoining(true);
      await joinFamily(user.uid, familyId);
      setSuccess("Успешно се присъедини към семейната група.");
      setTimeout(() => {
        router.push("/stats");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Възникна грешка при присъединяването. Опитай отново.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="mb-2 text-lg font-semibold">Покана за семейство</h1>
        <p className="mb-4 text-sm text-slate-600">
          Ще се присъединиш към семейна
          група с идентификатор:
        </p>
        <p className="mb-4 break-all rounded bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {familyId}
        </p>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-2 text-sm text-emerald-600">{success}</p>}
        <button
          type="button"
          disabled={joining}
          onClick={handleJoin}
          className="mt-2 inline-flex w-full justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {joining ? "Присъединяване…" : "Присъедини ме към семейството"}
        </button>
      </div>
    </main>
  );
}
