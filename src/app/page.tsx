"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PriceEntryForm } from "@/components/forms/PriceEntryForm";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 px-4">
        <p className="text-sm text-slate-600">Зареждане…</p>
      </main>
    );
  }

  // ПУБЛИЧЕН ЛЕНДИНГ (гост)
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10">
          {/* HERO */}
          <section className="mb-10 grid flex-1 grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Ново · Личен дневник за цените
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Следи цените в{" "}
                <span className="text-emerald-600">своите магазини</span>.
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Въвеждаш продукти и цени за секунди, а <b>PriceDiary</b> пази
                историята вместо теб. Виж кога нещо е наистина на промоция и
                споделяй данните със семейството си.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Започни безплатно
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-md border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Вход
                </Link>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Няма абонамент, няма реклами – просто личен помощник за цени.
              </p>
            </div>

            {/* Малка „превю“ карта */}
            <div className="hidden md:flex">
              <div className="relative ml-auto w-full max-w-md rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Превю: Въвеждане на продукт
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Лично
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">Бира &middot; Хайникен</span>
                    <span className="font-semibold text-slate-900">2.60 лв</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">
                      Месо &middot; Пилешко филе
                    </span>
                    <span className="font-semibold text-slate-900">9.80 лв</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="text-slate-600">
                      Мляко &middot; 1 л, магазин Х
                    </span>
                    <span className="font-semibold text-slate-900">3.10 лв</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-500">
                  Историята на цените се пази автоматично. Можеш да филтрираш
                  по продукт, категория или семейна група.
                </p>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="mb-10">
            <h2 className="text-base font-semibold text-slate-900">
              Защо да ползваш PriceDiary?
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <FeatureCard
                title="Въвеждане за секунди"
                description="Категория, продукт, разфасовка, магазин и цена. Нищо излишно – само най-важните полета."
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 6h14M5 12h8M5 18h5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
              <FeatureCard
                title="История по продукти"
                description="Кликваш върху продукт и виждаш всички въведени цени и графика как са се променяли."
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 19h16M6 16l3-7 4 5 3-9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <FeatureCard
                title="Споделено със семейството"
                description="Създаваш семейна група и всеки може да въвежда цени. Статистиката се обединява."
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6 8v-1a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-slate-900">
              Как работи?
            </h2>
            <ol className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <li className="flex gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
                <span className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-emerald-600 text-center text-xs font-semibold text-white">
                  1
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    Регистрирай се или влез
                  </p>
                  <p className="text-xs text-slate-600">
                    Нужно ти е само e-mail и парола. Нищо повече.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
                <span className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-emerald-600 text-center text-xs font-semibold text-white">
                  2
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    Започни да въвеждаш цени
                  </p>
                  <p className="text-xs text-slate-600">
                    Всеки път, когато пазаруваш, добавяш продуктите, които те
                    интересуват.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
                <span className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-emerald-600 text-center text-xs font-semibold text-white">
                  3
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    Сравнявай и планирай
                  </p>
                  <p className="text-xs text-slate-600">
                    Виж кога е изгодно да купуваш и колко реално ти струват
                    любимите стоки.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* FOOTER */}
          <footer className="mt-auto border-t border-slate-200 pt-4 text-xs text-slate-500">
            <p>
              PriceDiary &copy; {new Date().getFullYear()} · Малък помощник за
              твоя семеен бюджет.
            </p>
          </footer>
        </div>
      </main>
    );
  }

  // ВЪВЕЖДАНЕ за логнат потребител
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-slate-900">PriceDiary</h1>
          <p className="text-sm text-slate-600">
            Въведи продукт и цена, за да започнеш своя дневник на цените.
          </p>
        </div>

        <PriceEntryForm />
      </div>
    </main>
  );
}

// Малък компонент за feature карти
type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}
