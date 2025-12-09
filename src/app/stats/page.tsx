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

export default function StatsPage() {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<PriceEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryId | "all">("all");
  const [scope, setScope] = useState<Scope>("mine");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [familyCreating, setFamilyCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<PriceEntry | null>(null);

  // локални филтри по продукт и магазин
  const [productFilter, setProductFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");

  // Зареждаме профила (за familyId)
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

  // Зареждаме записите според обхвата + филтъра по категория (отива към бекенда)
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
          : {
              id: user.uid,
              email: user.email ?? "",
              familyId,
              createdAt: null,
            }
      );
    } catch (err) {
      console.error(err);
      setError("Грешка при създаване на семейна група.");
    } finally {
      setFamilyCreating(false);
    }
  };

  // отваряме модала за конкретния запис
  const handleAskDeleteEntry = (entry: PriceEntry) => {
    setError(null);
    setEntryToDelete(entry);
  };

  // потвърждаваме и трием
  const handleConfirmDeleteEntry = async () => {
    if (!user || !entryToDelete) return;

    try {
      setDeletingId(entryToDelete.id);
      await deletePriceEntry(user.uid, entryToDelete.id);
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Възникна грешка при изтриването на записа.");
    } finally {
      setDeletingId(null);
    }
  };

  const inviteUrl =
    typeof window !== "undefined" && userProfile?.familyId
      ? `${window.location.origin}/family/join?familyId=${userProfile.familyId}`
      : "";

  // Филтриране (по продукт / магазин) + сортиране по име на продукт (А–Я)
  const filteredAndSortedEntries = useMemo(() => {
    const productQ = productFilter.trim().toLowerCase();
    const storeQ = storeFilter.trim().toLowerCase();

    return [...entries]
      .filter((entry) =>
        productQ
          ? entry.productName.toLowerCase().includes(productQ)
          : true
      )
      .filter((entry) =>
        storeQ ? (entry.store || "").toLowerCase().includes(storeQ) : true
      )
      .sort((a, b) => {
        const nameA = (a.productName || "").trim();
        const nameB = (b.productName || "").trim();

        const byName = nameA.localeCompare(nameB, "bg", {
          sensitivity: "base",
        });

        if (byName !== 0) return byName;

        // вторичен критерий – по-нова дата първа
        return b.date.getTime() - a.date.getTime();
      });
  }, [entries, productFilter, storeFilter]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 p-4">
        <p className="text-sm text-slate-600">Зареждане…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 p-4">
        <p className="text-sm text-red-600">
          Трябва да влезеш в профила си.{" "}
          <a href="/auth/login" className="text-emerald-600 underline">
            Вход
          </a>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 p-4">
      <div className="mx-auto w-full max-w-4xl rounded-xl bg-white p-6 shadow">
        {/* HEADER + FILTERS */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Заглавие + обхват */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Статистика</h1>
              <p className="text-sm text-slate-600">
                История на въведените цени.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="text-xs font-medium text-slate-600">
                Обхват:
              </span>
              <button
                type="button"
                onClick={() => setScope("mine")}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium",
                  scope === "mine"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                Само аз
              </button>
              <button
                type="button"
                onClick={() => setScope("family")}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium",
                  scope === "family"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                Моето семейство
              </button>
              <button
                type="button"
                onClick={() => setScope("all")}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium",
                  scope === "all"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                Всички
              </button>
            </div>
          </div>

          {/* Филтри – втори ред */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Категория */}
            <div className="flex flex-col gap-1">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="categoryFilter"
              >
                Категория
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as CategoryId | "all")
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Продукт */}
            <div className="flex flex-col gap-1">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="productFilter"
              >
                Продукт
              </label>
              <input
                id="productFilter"
                type="text"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                placeholder="име на продукт"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Магазин */}
            <div className="flex flex-col gap-1">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="storeFilter"
              >
                Магазин
              </label>
              <input
                id="storeFilter"
                type="text"
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                placeholder="име на магазин"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Секция "Семейство" */}
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          {profileLoading ? (
            <span>Зареждане на семейна информация…</span>
          ) : userProfile?.familyId ? (
            <div className="flex flex-col gap-2">
              <span className="font-medium text-slate-700">
                Имаш активна семейна група.
              </span>
              <span>
                Сподели този линк с членове на семейството, за да се
                присъединят:
              </span>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 break-all rounded border border-slate-200 bg-white px-2 py-1 text-[10px]">
                  {inviteUrl || "Грешка при генериране на линк"}
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
                  className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 sm:mt-0"
                >
                  {copied ? "Копирано!" : "Копирай линка"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Нямаш семейна група още.{" "}
                <span className="font-medium">
                  Създай една и покани семейството си да си споделяте цените.
                </span>
              </span>
              <button
                type="button"
                onClick={handleCreateFamily}
                disabled={familyCreating}
                className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:mt-0"
              >
                {familyCreating ? "Създаване…" : "Създай семейство"}
              </button>
            </div>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {isLoadingEntries ? (
          <p className="text-sm text-slate-600">Зареждане на записите…</p>
        ) : filteredAndSortedEntries.length === 0 ? (
          <p className="text-sm text-slate-600">
            Няма намерени записи{" "}
            {categoryFilter !== "all" ? "за избраните филтри" : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Дата</th>
                  <th className="px-3 py-2">Категория</th>
                  <th className="px-3 py-2">Продукт</th>
                  <th className="px-3 py-2">Разфасовка</th>
                  <th className="px-3 py-2">Магазин</th>
                  {scope === "all" && (
                    <th className="px-3 py-2 text-xs">Потребител</th>
                  )}
                  <th className="px-3 py-2 text-right">Цена</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      {entry.date.toLocaleDateString("bg-BG")}
                    </td>
                    <td className="px-3 py-2">
                      {
                        CATEGORY_OPTIONS.find(
                          (c) => c.value === entry.category
                        )?.label
                      }
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/product/${encodeURIComponent(
                          entry.productName.trim().toLowerCase()
                        )}`}
                        className="text-emerald-700 hover:underline"
                      >
                        {entry.productName}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{entry.packageSize}</td>
                    <td className="px-3 py-2">{entry.store}</td>
                    {scope === "all" && (
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {entry.userId}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      {entry.price.toFixed(2)} лв
                    </td>
                    <td className="px-3 py-2 text-right">
                      {entry.userId === user.uid && (
                        <button
                          type="button"
                          onClick={() => handleAskDeleteEntry(entry)}
                          disabled={deletingId === entry.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-60"
                        >
                          {deletingId === entry.id ? "Триене..." : "Изтрий"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-right">
          <a
            href="/"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Обратно към въвеждане
          </a>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!entryToDelete}
        title="Изтриване на запис"
        description={
          entryToDelete
            ? `Наистина ли искаш да изтриеш записа за „${entryToDelete.productName}“ от ${entryToDelete.date.toLocaleDateString(
                "bg-BG"
              )}?`
            : ""
        }
        confirmLabel="Изтрий"
        cancelLabel="Откажи"
        loading={!!deletingId}
        onCancel={() => {
          if (deletingId) return; // докато трием, не затваряме
          setEntryToDelete(null);
        }}
        onConfirm={handleConfirmDeleteEntry}
      />
    </main>
  );
}
