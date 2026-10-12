"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CategoryId, PriceEntry } from "@/types/priceEntry";
import {
  getPriceEntries,
  getAllPriceEntries,
  getFamilyEntriesForUser,
  getUserProfile,
  createFamilyForUser,
  deletePriceEntry,
} from "@/lib/firebase/firestore";
import { UserProfile } from "@/types/user";
import Link from "next/link";
import { ConfirmDialog } from "@/components/common/confirmDialog";
import { entryPrices, formatEur, formatBgn } from "@/lib/currency";

const CATEGORY_OPTIONS: { value: CategoryId | "all"; label: string }[] = [
  { value: "all", label: "Всички категории" },
  { value: "beer", label: "Бира" },
  { value: "meat", label: "Месо" },
  { value: "water", label: "Вода" },
  { value: "bread", label: "Хляб" },
  { value: "dairy", label: "Млечни" },
  { value: "fruits_veg", label: "Плодове и зеленчуци" },
  { value: "other", label: "Други" },
];

type Scope = "mine" | "family" | "all";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "mine", label: "Само аз" },
  { value: "family", label: "Моето семейство" },
  { value: "all", label: "Всички" },
];

const inputCls =
  "h-10 w-full rounded-lg border border-stroke bg-surface px-3 text-sm text-fg placeholder:text-muted-fg transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-sky-500/20";

export default function StatsPage() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<PriceEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");
  const [scope, setScope] = useState<Scope>("mine");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [familyCreating, setFamilyCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<PriceEntry | null>(null);

  const [productFilter, setProductFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setProfileLoading(true);
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (err) {
        console.error(err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      setIsLoadingEntries(true);
      setError(null);
      try {
        const categoryOption =
          categoryFilter === "all" ? undefined : { category: categoryFilter };
        let data: PriceEntry[] = [];
        if (scope === "mine") {
          data = await getPriceEntries(user.uid, categoryOption);
        } else if (scope === "family") {
          data = await getFamilyEntriesForUser(user.uid, categoryOption);
        } else {
          data = await getAllPriceEntries(categoryOption);
        }
        setEntries(data);
      } catch (err) {
        console.error(err);
        setError("Грешка при зареждане на записите.");
      } finally {
        setIsLoadingEntries(false);
      }
    };
    fetchEntries();
  }, [user, categoryFilter, scope]);

  const handleCreateFamily = async () => {
    if (!user) return;
    setError(null);
    try {
      setFamilyCreating(true);
      const familyId = await createFamilyForUser(user.uid);
      setUserProfile((prev) =>
        prev
          ? { ...prev, familyId }
          : { id: user.uid, email: user.email ?? "", familyId, createdAt: null }
      );
    } catch (err) {
      console.error(err);
      setError("Грешка при създаване на семейна група.");
    } finally {
      setFamilyCreating(false);
    }
  };

  const handleAskDeleteEntry = (entry: PriceEntry) => {
    setError(null);
    setEntryToDelete(entry);
  };

  const handleConfirmDeleteEntry = async () => {
    if (!user || !entryToDelete) return;
    try {
      setDeletingId(entryToDelete.id);
      await deletePriceEntry(user.uid, entryToDelete.id);
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Грешка при изтриването на записа.");
    } finally {
      setDeletingId(null);
    }
  };

  const inviteUrl =
    typeof window !== "undefined" && userProfile?.familyId
      ? `${window.location.origin}/family/join?familyId=${userProfile.familyId}`
      : "";

  const filteredAndSortedEntries = useMemo(() => {
    const productQ = productFilter.trim().toLowerCase();
    const storeQ = storeFilter.trim().toLowerCase();
    return [...entries]
      .filter((e) => (productQ ? e.productName.toLowerCase().includes(productQ) : true))
      .filter((e) => (storeQ ? (e.store || "").toLowerCase().includes(storeQ) : true))
      .sort((a, b) => {
        const byName = (a.productName || "").trim().localeCompare(
          (b.productName || "").trim(),
          "bg",
          { sensitivity: "base" }
        );
        return byName !== 0 ? byName : b.date.getTime() - a.date.getTime();
      });
  }, [entries, productFilter, storeFilter]);

  /* ── Loading / auth guards ── */
  if (loading) {
    return (
      <main className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4">
        <p className="text-sm text-fg-2">
          Трябва да влезеш в профила си.{" "}
          <a href="/auth/login" className="font-medium text-accent underline-offset-2 hover:underline">
            Вход
          </a>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-56px)] bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-fg">Статистика</h1>
          <p className="mt-1 text-sm text-fg-2">История на въведените цени.</p>
        </div>

        <div className="rounded-xl border border-stroke bg-surface shadow-sm">

          {/* ── Controls ── */}
          <div className="border-b border-stroke px-5 py-4 space-y-4">

            {/* Scope pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-fg-2">Обхват:</span>
              {SCOPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScope(value)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150",
                    scope === value
                      ? "bg-accent text-white"
                      : "bg-muted text-fg-2 hover:bg-stroke hover:text-fg",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-fg-2" htmlFor="sf-cat">Категория</label>
                <select
                  id="sf-cat"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryId | "all")}
                  className={inputCls}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-fg-2" htmlFor="sf-product">Продукт</label>
                <input
                  id="sf-product"
                  type="text"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  placeholder="Търсене по продукт"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-fg-2" htmlFor="sf-store">Магазин</label>
                <input
                  id="sf-store"
                  type="text"
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  placeholder="Търсене по магазин"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Family section ── */}
          <div className="border-b border-stroke bg-muted/40 px-5 py-3 text-xs">
            {profileLoading ? (
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            ) : userProfile?.familyId ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-fg">Активна семейна група</span>
                <div className="flex items-center gap-2">
                  <code className="max-w-[240px] truncate rounded border border-stroke bg-surface px-2 py-1 text-[10px] text-fg-2">
                    {inviteUrl || "—"}
                  </code>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!inviteUrl) return;
                      try {
                        await navigator.clipboard.writeText(inviteUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-h"
                  >
                    {copied ? "Копирано!" : "Копирай"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-fg-2">
                  Нямаш семейна група.{" "}
                  <span className="font-medium text-fg">Създай и покани семейството си.</span>
                </span>
                <button
                  type="button"
                  onClick={handleCreateFamily}
                  disabled={familyCreating}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-h disabled:opacity-50"
                >
                  {familyCreating ? "Създаване…" : "Създай семейство"}
                </button>
              </div>
            )}
          </div>

          {/* ── Content ── */}
          <div className="px-5 py-4">
            {error && (
              <div role="alert" className="mb-4 rounded-lg bg-danger-l px-3 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            {/* Loading skeleton */}
            {isLoadingEntries ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : filteredAndSortedEntries.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <svg className="h-6 w-6 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-fg">Няма намерени записи</p>
                  <p className="mt-1 text-xs text-fg-2">
                    {categoryFilter !== "all" || productFilter || storeFilter
                      ? "Опитай с различни филтри."
                      : "Добави първия си продукт от началната страница."}
                  </p>
                </div>
                {!productFilter && !storeFilter && categoryFilter === "all" && (
                  <Link
                    href="/"
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-h"
                  >
                    Въведи продукт
                  </Link>
                )}
              </div>
            ) : (
              /* Table */
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm" aria-label="Записи на цени">
                  <thead>
                    <tr className="border-b border-stroke">
                      <th className="pb-2 pr-4 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Дата</th>
                      <th className="pb-2 pr-4 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Категория</th>
                      <th className="pb-2 pr-4 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Продукт</th>
                      <th className="pb-2 pr-4 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Разф.</th>
                      <th className="pb-2 pr-4 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Магазин</th>
                      {scope === "all" && (
                        <th className="pb-2 pr-4 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Потребител</th>
                      )}
                      <th className="pb-2 pr-4 pt-1 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-fg">EUR</th>
                      <th className="pb-2 pt-1 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-fg">BGN</th>
                      <th className="pb-2 pt-1" aria-label="Действия" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {filteredAndSortedEntries.map((entry) => {
                      const { eur, bgn } = entryPrices(entry.price, entry.currency);
                      return (
                        <tr
                          key={entry.id}
                          className="transition-colors hover:bg-muted/40"
                        >
                          <td className="py-2.5 pr-4 text-xs text-fg-2">
                            {entry.date.toLocaleDateString("bg-BG")}
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-fg-2">
                            {CATEGORY_OPTIONS.find((c) => c.value === entry.category)?.label}
                          </td>
                          <td className="py-2.5 pr-4 text-sm">
                            <Link
                              href={`/product/${encodeURIComponent(entry.productName.trim().toLowerCase())}`}
                              className="font-medium text-fg underline-offset-2 hover:text-accent hover:underline"
                            >
                              {entry.productName}
                            </Link>
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-fg-2">{entry.packageSize}</td>
                          <td className="py-2.5 pr-4 text-xs text-fg-2">{entry.store}</td>
                          {scope === "all" && (
                            <td className="py-2.5 pr-4 max-w-[120px] truncate text-xs text-muted-fg">
                              {entry.userId}
                            </td>
                          )}
                          <td className="nums py-2.5 pr-4 text-right text-sm font-semibold text-fg">
                            {formatEur(eur)}
                          </td>
                          <td className="nums py-2.5 text-right text-xs text-fg-2">
                            {formatBgn(bgn)}
                          </td>
                          <td className="py-2.5 pl-3 text-right">
                            {entry.userId === user.uid && (
                              <button
                                type="button"
                                onClick={() => handleAskDeleteEntry(entry)}
                                disabled={deletingId === entry.id}
                                aria-label={`Изтрий ${entry.productName}`}
                                className="rounded px-1.5 py-1 text-xs text-muted-fg transition-colors hover:bg-danger-l hover:text-danger disabled:opacity-50"
                              >
                                {deletingId === entry.id ? "…" : "Изтрий"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stroke px-5 py-3">
            <Link href="/" className="text-sm font-medium text-accent underline-offset-2 hover:underline">
              ← Въведи нова цена
            </Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!entryToDelete}
        title="Изтриване на запис"
        description={
          entryToDelete
            ? `Наистина ли искаш да изтриеш записа за „${entryToDelete.productName}" от ${entryToDelete.date.toLocaleDateString("bg-BG")}?`
            : ""
        }
        confirmLabel="Изтрий"
        cancelLabel="Откажи"
        loading={!!deletingId}
        onCancel={() => { if (deletingId) return; setEntryToDelete(null); }}
        onConfirm={handleConfirmDeleteEntry}
      />
    </main>
  );
}
