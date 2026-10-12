"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PriceEntry } from "@/types/priceEntry";
import { getProductEntriesByKey, deletePriceEntry } from "@/lib/firebase/firestore";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { ConfirmDialog } from "@/components/common/confirmDialog";
import { entryPrices, eurToBgn, formatEur, formatBgn } from "@/lib/currency";

type Scope = "mine" | "family" | "all";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "mine", label: "Само аз" },
  { value: "family", label: "Семейство" },
  { value: "all", label: "Всички" },
];

function formatDateShort(date: Date) {
  return date.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit" });
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

  const scopedEntries = useMemo(() => {
    if (!user) return allEntries;
    if (scope === "mine") return allEntries.filter((e) => e.userId === user.uid);
    return allEntries;
  }, [allEntries, scope, user]);

  const stats = useMemo(() => {
    if (scopedEntries.length === 0) return null;
    const eurPrices = scopedEntries.map((e) => entryPrices(e.price, e.currency).eur);
    const minPrice = Math.min(...eurPrices);
    const maxPrice = Math.max(...eurPrices);
    const avgPrice = eurPrices.reduce((s, p) => s + p, 0) / eurPrices.length;
    const last = [...scopedEntries].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    return { minPrice, maxPrice, avgPrice, last };
  }, [scopedEntries]);

  const chartData = useMemo(
    () => scopedEntries.map((e) => ({
      dateLabel: formatDateShort(e.date),
      price: entryPrices(e.price, e.currency).eur,
    })),
    [scopedEntries]
  );

  const displayName = useMemo(() => {
    if (allEntries.length === 0) {
      return productKey.charAt(0).toUpperCase() + productKey.slice(1);
    }
    const counts = new Map<string, number>();
    for (const e of allEntries) counts.set(e.productName, (counts.get(e.productName) || 0) + 1);
    let best = "";
    let bestCount = 0;
    for (const [name, count] of counts.entries()) {
      if (count > bestCount) { best = name; bestCount = count; }
    }
    return best || productKey;
  }, [allEntries, productKey]);

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
      setError("Грешка при изтриването.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Auth / loading guards ── */
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
        <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
          <h1 className="mb-2 text-base font-semibold text-fg">Детайли за продукт</h1>
          <p className="text-sm text-fg-2">За да видиш детайлите, трябва да влезеш в профила си.</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-5 h-11 w-full rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-h"
          >
            Вход
          </button>
        </div>
      </main>
    );
  }

  if (!isLoading && allEntries.length < 2) {
    return (
      <main className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-6 shadow-sm">
          <h1 className="mb-2 text-base font-semibold text-fg">{displayName}</h1>
          <p className="text-sm text-fg-2">
            За графики и подробна статистика са нужни поне два записа за този продукт.
          </p>
          <button
            onClick={() => router.push("/stats")}
            className="mt-5 h-11 w-full rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-h"
          >
            ← Назад към статистика
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-56px)] bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">

        {/* Page header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-fg">{displayName}</h1>
            <p className="mt-0.5 text-sm text-fg-2">История на цените.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
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
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-danger-l px-3 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Metrics */}
          {stats && (() => {
            const lastP = entryPrices(stats.last.price, stats.last.currency);
            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Last price */}
                <div className="rounded-xl border border-stroke bg-surface p-4">
                  <p className="text-xs font-medium text-accent">Последна цена</p>
                  <p className="nums mt-1 text-xl font-semibold text-fg">{formatEur(lastP.eur)}</p>
                  <p className="nums mt-0.5 text-xs text-fg-2">{formatBgn(lastP.bgn)}</p>
                  <p className="mt-1 text-[11px] text-muted-fg">
                    {stats.last.date.toLocaleDateString("bg-BG")}
                  </p>
                </div>

                {/* Min */}
                <div className="rounded-xl border border-stroke bg-surface p-4">
                  <p className="text-xs font-medium text-muted-fg">Най-ниска</p>
                  <p className="nums mt-1 text-xl font-semibold text-fg">{formatEur(stats.minPrice)}</p>
                  <p className="nums mt-0.5 text-xs text-fg-2">{formatBgn(eurToBgn(stats.minPrice))}</p>
                </div>

                {/* Avg */}
                <div className="rounded-xl border border-stroke bg-surface p-4">
                  <p className="text-xs font-medium text-muted-fg">Средна</p>
                  <p className="nums mt-1 text-xl font-semibold text-fg">{formatEur(stats.avgPrice)}</p>
                  <p className="nums mt-0.5 text-xs text-fg-2">{formatBgn(eurToBgn(stats.avgPrice))}</p>
                </div>

                {/* Max */}
                <div className="rounded-xl border border-stroke bg-surface p-4">
                  <p className="text-xs font-medium text-muted-fg">Най-висока</p>
                  <p className="nums mt-1 text-xl font-semibold text-fg">{formatEur(stats.maxPrice)}</p>
                  <p className="nums mt-0.5 text-xs text-fg-2">{formatBgn(eurToBgn(stats.maxPrice))}</p>
                </div>
              </div>
            );
          })()}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-stroke bg-surface p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-fg">
                Динамика на цената (EUR)
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: "var(--color-fg-secondary)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${Number(v).toFixed(2)}`}
                      tick={{ fontSize: 11, fill: "var(--color-fg-secondary)" }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: 12,
                        color: "var(--color-fg)",
                      }}
                      formatter={(value: unknown) => {
                        const eur = Number(value);
                        return [`${formatEur(eur)}  (${formatBgn(eurToBgn(eur))})`, "Цена"];
                      }}
                      labelFormatter={(label) => `Дата: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--color-accent)", strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-stroke bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm" aria-label={`Записи за ${displayName}`}>
                <thead>
                  <tr className="border-b border-stroke bg-muted/50">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Дата</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Разфасовка</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Магазин</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-fg">EUR</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-fg">BGN</th>
                    <th className="px-4 py-2.5" aria-label="Действия" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {[...scopedEntries]
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((entry) => {
                      const { eur, bgn } = entryPrices(entry.price, entry.currency);
                      return (
                        <tr key={entry.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-2.5 text-xs text-fg-2">
                            {entry.date.toLocaleDateString("bg-BG")}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-fg-2">{entry.packageSize}</td>
                          <td className="px-4 py-2.5 text-xs text-fg-2">{entry.store}</td>
                          <td className="nums px-4 py-2.5 text-right text-sm font-semibold text-fg">
                            {formatEur(eur)}
                          </td>
                          <td className="nums px-4 py-2.5 text-right text-xs text-fg-2">
                            {formatBgn(bgn)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {entry.userId === user.uid && (
                              <button
                                type="button"
                                onClick={() => handleAskDelete(entry)}
                                disabled={deletingId === entry.id}
                                aria-label={`Изтрий запис от ${entry.date.toLocaleDateString("bg-BG")}`}
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
          </div>

          {/* Back link */}
          <div className="pb-2">
            <button
              onClick={() => router.push("/stats")}
              className="text-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              ← Назад към статистика
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!entryToDelete}
        title="Изтриване на запис"
        description={
          entryToDelete
            ? `Наистина ли искаш да изтриеш записа за „${entryToDelete.productName}" на цена ${formatEur(entryPrices(entryToDelete.price, entryToDelete.currency).eur)} от ${entryToDelete.date.toLocaleDateString("bg-BG")}?`
            : ""
        }
        confirmLabel="Изтрий"
        cancelLabel="Откажи"
        loading={!!deletingId}
        onCancel={() => { if (deletingId) return; setEntryToDelete(null); }}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
