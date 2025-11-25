"use client";

import { FormEvent, useState } from "react";
import { loginWithEmail } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await loginWithEmail(email, password);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Грешка при вход.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-semibold">Вход</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Имейл
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Парола
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Влизане..." : "Влез"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Нямаш акаунт?{" "}
          <a href="/auth/register" className="font-medium text-emerald-700 hover:underline">
            Регистрирай се
          </a>
        </p>
      </div>
    </main>
  );
}
