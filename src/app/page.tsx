"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PriceEntryForm } from "@/components/forms/PriceEntryForm";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </main>
    );
  }

  /* ── Logged-in: entry form ── */
  if (user) {
    return (
      <main className="min-h-[calc(100dvh-56px)] bg-bg px-4 py-8">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-fg">Въведи цена</h1>
            <p className="mt-1 text-sm text-fg-2">
              Добави продукт и цена към твоя дневник.
            </p>
          </div>
          <div className="rounded-xl border border-stroke bg-surface p-6 shadow-sm">
            <PriceEntryForm />
          </div>
        </div>
      </main>
    );
  }

  /* ── Landing ── */
  return (
    <main className="min-h-[calc(100dvh-56px)] bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">

        {/* Hero */}
        <section className="mb-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-accent-l px-3 py-1 text-xs font-medium text-accent">
              Ново · Личен дневник за цените
            </span>

            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
              Следи цените в{" "}
              <span className="text-accent">своите магазини.</span>
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-fg-2 sm:text-base">
              Въвеждаш продукти и цени за секунди, а{" "}
              <strong className="font-medium text-fg">PriceDiary</strong> пази
              историята вместо теб. Виж кога нещо е наистина на промоция и
              споделяй данните с цялото семейство.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/register"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-h"
              >
                Започни безплатно
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-stroke px-5 text-sm font-medium text-fg-2 transition-colors hover:bg-muted hover:text-fg"
              >
                Вход
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted-fg">
              Без абонамент · Без реклами · Само ти и твоите цени.
            </p>
          </div>

          {/* Preview card */}
          <div className="hidden md:flex md:justify-end">
            <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-fg">
                  Последни записи
                </span>
                <span className="rounded-full bg-accent-l px-2 py-0.5 text-[10px] font-semibold text-accent">
                  Лично
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Бира · Хайникен", eur: "1,33 €", bgn: "2,60 лв." },
                  { name: "Месо · Пилешко филе", eur: "5,01 €", bgn: "9,80 лв." },
                  { name: "Мляко · 1 л", eur: "1,58 €", bgn: "3,10 лв." },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-xs"
                  >
                    <span className="text-fg-2">{item.name}</span>
                    <span className="nums">
                      <span className="font-semibold text-fg">{item.eur}</span>
                      <span className="ml-1.5 text-muted-fg">{item.bgn}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-fg">
                Историята се пази автоматично. Филтрирай по продукт,
                категория или семейна група.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-14">
          <h2 className="mb-5 text-base font-semibold text-fg">
            Защо да ползваш PriceDiary?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Въвеждане за секунди"
              description="Категория, продукт, разфасовка, магазин и цена. Само най-важните полета."
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M5 6h14M5 12h8M5 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
            <FeatureCard
              title="История по продукти"
              description="Кликваш и виждаш всички цени с графика как са се менили."
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M4 19h16M6 16l3-7 4 5 3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <FeatureCard
              title="Споделено с цялото семейство"
              description="Създаваш семейна група и всеки добавя цени. Статистиката се обединява."
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 8v-1a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="mb-5 text-base font-semibold text-fg">Как работи?</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {[
              { n: "1", title: "Регистрирай се или влез", body: "Нужно ти е само e-mail и парола." },
              { n: "2", title: "Започни да въвеждаш цени", body: "При всяко пазаруване добавяш продуктите, които те интересуват." },
              { n: "3", title: "Сравнявай и планирай", body: "Виж кога е изгодно да купуваш и колко реално ти струват любимите стоки." },
            ].map((step) => (
              <li
                key={step.n}
                className="flex gap-3 rounded-xl border border-stroke bg-surface px-4 py-3.5"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  {step.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-2">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-stroke pt-5 text-xs text-muted-fg">
          PriceDiary &copy; {new Date().getFullYear()} · Малък помощник за твоя семеен бюджет.
        </footer>
      </div>
    </main>
  );
}

type FeatureCardProps = { title: string; description: string; icon: React.ReactNode };

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stroke bg-surface p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-l text-accent">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-fg-2">{description}</p>
      </div>
    </div>
  );
}
