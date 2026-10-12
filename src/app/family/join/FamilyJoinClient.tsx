"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { joinFamily } from "@/lib/firebase/firestore";
import { useState } from "react";

export function FamilyJoinClient() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get("familyId");
  const { user, loading } = useAuth();
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!familyId) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
        <h1 className="mb-2 text-base font-semibold text-fg">Покана за семейство</h1>
        <p className="text-sm text-danger">Невалиден или липсващ идентификатор на семейство.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
        <h1 className="mb-2 text-base font-semibold text-fg">Покана за семейство</h1>
        <p className="mb-5 text-sm text-fg-2">
          За да се присъединиш към това семейство, първо трябва да влезеш в профила си.
        </p>
        <Link
          href="/auth/login"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-h"
        >
          Вход
        </Link>
      </div>
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
    <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
      <h1 className="mb-2 text-base font-semibold text-fg">Покана за семейство</h1>
      <p className="mb-3 text-sm text-fg-2">Ще се присъединиш към семейна група с идентификатор:</p>
      <p className="mb-5 break-all rounded-lg bg-muted px-3 py-2 text-xs text-fg-2">
        {familyId}
      </p>

      {error && (
        <div role="alert" className="mb-3 rounded-lg bg-danger-l px-3 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-3 rounded-lg bg-accent-l px-3 py-2.5 text-sm text-accent">
          {success}
        </div>
      )}

      <button
        type="button"
        disabled={joining}
        onClick={handleJoin}
        className="h-11 w-full rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-h disabled:cursor-not-allowed disabled:opacity-50"
      >
        {joining ? "Присъединяване…" : "Присъедини ме към семейството"}
      </button>
    </div>
  );
}
