"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PriceEntry } from "@/types/priceEntry";
import {
  getProductEntriesByKey,
  deletePriceEntry,
} from "@/lib/firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ConfirmDialog } from "@/components/common/confirmDialog";

type Scope = "mine" | "family" | "all";

function formatDateShort(date: Date) {
  return date.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function ProductDetailPage() {
  const params = useParams<{ productKey: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const productKey = decodeURIComponent(params.productKey);
  const [allEntries, setAllEntries] = useState<PriceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("mine");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<PriceEntry | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProductEntriesByKey(productKey);
        setAllEntries(data);
      } catch (err) {
        console.error(err);
        setError("Грешка при зареждане на данните за продукта.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productKey]);

  // Филтриране според обхвата
  const scopedEntries = useMemo(() => {
    if (!user) return allEntries;

    if (scope === "mine") {
      return allEntries.filter((e) => e.userId === user.uid);
    }

    if (scope === "family") {
      return allEntries;
    }

    return allEntries;
  }, [allEntries, scope, user]);

  // Метрики
  const stats = useMemo(() => {
    if (scopedEntries.length === 0) {
      return null;
    }

    const prices = scopedEntries.map((e) => e.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice =
      prices.reduce((sum, p) => sum + p, 0) / (prices.length || 1);

    const sortedDesc = [...scopedEntries].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    const last = sortedDesc[0];

    return {
      minPrice,
      maxPrice,
      avgPrice,
      last,
    };
  }, [scopedEntries]);

  // Данни за графиката
  const chartData = useMemo(
    () =>
      scopedEntries.map((e) => ({
        dateLabel: formatDateShort(e.date),
        price: e.price,
      })),
    [scopedEntries]
  );

  // Име на продукта
  const displayName = useMemo(() => {
    if (allEntries.length === 0) {
      return productKey.charAt(0).toUpperCase() + productKey.slice(1);
    }

    const counts = new Map<string, number>();
    for (const e of allEntries) {
      const name = e.productName || "";
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    let bestName = "";
    let bestCount = 0;
    for (const [name, count] of counts.entries()) {
      if (count > bestCount) {
        bestName = name;
        bestCount = count;
      }
    }
    return bestName || productKey;
  }, [allEntries, productKey]);

  // Отваряне на модала
  const handleAskDelete = (entry: PriceEntry) => {
    if (!user || user.uid !== entry.userId) return;
    setError(null);
    setEntryToDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!user || !entryToDelete) return;

    try {
      setDeletingId(entryToDelete.id);
      await deletePriceEntry(user.uid, entryToDelete.id);
      setAllEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Възникна грешка при изтриването.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- UI STATES WITH NEW BACKGROUND ---------- */

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
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
          <h1 className="mb-2 text-lg font-semibold">Детайли за продукт</h1>
          <p className="text-sm text-slate-600">
            За да видиш детайли за продукт, трябва да влезеш в профила си.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-4 inline-flex w-full justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Вход
          </button>
        </div>
      </main>
    );
  }

  if (!isLoading && allEntries.length < 2) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
          <h1 className="mb-2 text-lg font-semibold">{displayName}</h1>
          <p className="text-sm text-slate-600">
            За този продукт има само един запис. Страницата показва графики и детайлни статистики, когато има поне две въведения.
          </p>
          <button
            onClick={() => router.push("/stats")}
            className="mt-4 inline-flex w-full justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            ← Назад към статистика
          </button>
        </div>
      </main>
    );
  }

  /* ---------- MAIN PAGE ---------- */

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 p-4">
      <div className="mx-auto w-full max-w-4xl rounded-xl bg-white p-6 shadow">
        
        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">{displayName}</h1>
            <p className="text-sm text-slate-600">История на цените.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Обхват:</span>
            {["mine", "family", "all"].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setScope(k as Scope)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium",
                  scope === k
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                {k === "mine" ? "Само аз" : k === "family" ? "Моето семейство" : "Всички"}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* METRICS */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-sm">
              <div className="text-xs text-emerald-700">Последна цена</div>
              <div className="text-lg font-semibold text-emerald-900">
                {stats.last.price.toFixed(2)} лв
              </div>
              <div className="text-[11px] text-emerald-800">
                {stats.last.date.toLocaleDateString("bg-BG")}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-600">Най-ниска</div>
              <div className="text-lg font-semibold text-slate-900">
                {stats.minPrice.toFixed(2)} лв
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-600">Средна цена</div>
              <div className="text-lg font-semibold text-slate-900">
                {stats.avgPrice.toFixed(2)} лв
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-600">Най-висока</div>
              <div className="text-lg font-semibold text-slate-900">
                {stats.maxPrice.toFixed(2)} лв
              </div>
            </div>
          </div>
        )}

        {/* CHART */}
        {chartData.length > 0 && (
          <div className="mb-6 h-64 rounded-lg bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dateLabel" />
                <YAxis tickFormatter={(v) => v.toFixed(2)} width={60} />
                <Tooltip
                  formatter={(value: any) => `${Number(value).toFixed(2)} лв`}
                  labelFormatter={(label) => `Дата: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TABLE */}
        <div className="mb-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Дата</th>
                <th className="px-3 py-2">Разфасовка</th>
                <th className="px-3 py-2">Магазин</th>
                <th className="px-3 py-2 text-right">Цена</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>

            <tbody>
              {[...scopedEntries]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{entry.date.toLocaleDateString("bg-BG")}</td>
                    <td className="px-3 py-2">{entry.packageSize}</td>
                    <td className="px-3 py-2">{entry.store}</td>
                    <td className="px-3 py-2 text-right">{entry.price.toFixed(2)} лв</td>

                    <td className="px-3 py-2 text-right">
                      {entry.userId === user.uid && (
                        <button
                          type="button"
                          onClick={() => handleAskDelete(entry)}
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

        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
          <button
            onClick={() => router.push("/stats")}
            className="text-emerald-700 hover:underline"
          >
            ← Назад към статистика
          </button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!entryToDelete}
        title="Изтриване на запис"
        description={
          entryToDelete
            ? `Наистина ли искаш да изтриеш записа за „${entryToDelete.productName}“ на цена ${entryToDelete.price.toFixed(
                2
              )} лв от ${entryToDelete.date.toLocaleDateString("bg-BG")}?`
            : ""
        }
        confirmLabel="Изтрий"
        cancelLabel="Откажи"
        loading={!!deletingId}
        onCancel={() => {
          if (deletingId) return;
          setEntryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
