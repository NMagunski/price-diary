"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CategoryId, NewPriceEntryInput } from "@/types/priceEntry";
import { addPriceEntry } from "@/lib/firebase/firestore";
import { eurToBgn, formatEur, formatBgn } from "@/lib/currency";

const CATEGORY_OPTIONS: { value: CategoryId; label: string }[] = [
  { value: "beer", label: "Бира" },
  { value: "meat", label: "Месо" },
  { value: "water", label: "Вода" },
  { value: "bread", label: "Хляб" },
  { value: "dairy", label: "Млечни" },
  { value: "fruits_veg", label: "Плодове и зеленчуци" },
  { value: "other", label: "Други" },
];

type FormState = {
  category: CategoryId;
  productName: string;
  packageSize: string;
  store: string;
  price: string;
  date: string;
  note: string;
};

type LastEntryTemplate = {
  category: CategoryId;
  productName: string;
  packageSize: string;
  date: string;
};

const LOCAL_KEY_LAST_CATEGORY = "pricediary:lastCategory";
const LOCAL_KEY_LAST_STORE = "pricediary:lastStore";

const inputCls =
  "h-11 w-full rounded-lg border border-stroke bg-surface px-3 text-sm text-fg placeholder:text-muted-fg transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-sky-500/20";

const labelCls = "text-sm font-medium text-fg";

const initialFormState = (): FormState => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return {
    category: "beer",
    productName: "",
    packageSize: "",
    store: "",
    price: "",
    date: `${yyyy}-${mm}-${dd}`,
    note: "",
  };
};

export function PriceEntryForm() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastEntryTemplate, setLastEntryTemplate] =
    useState<LastEntryTemplate | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCategory = window.localStorage.getItem(LOCAL_KEY_LAST_CATEGORY);
    const storedStore = window.localStorage.getItem(LOCAL_KEY_LAST_STORE);
    const validCategoryValues = CATEGORY_OPTIONS.map((c) => c.value);
    const isValidCategory =
      storedCategory && validCategoryValues.includes(storedCategory as CategoryId);
    setForm((prev) => ({
      ...prev,
      category: isValidCategory ? (storedCategory as CategoryId) : prev.category,
      store: storedStore ?? prev.store,
    }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-center text-sm text-fg-2">
        Трябва да влезеш в профила си.{" "}
        <a href="/auth/login" className="font-medium text-accent underline-offset-2 hover:underline">
          Вход
        </a>
      </p>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const priceNumber = Number(form.price.replace(",", "."));
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setErrorMessage("Моля, въведи валидна цена.");
      return;
    }
    if (!form.productName.trim()) {
      setErrorMessage("Моля, въведи ime на продукта.");
      return;
    }
    const dateObj = new Date(form.date);
    if (Number.isNaN(dateObj.getTime())) {
      setErrorMessage("Невалидна дата.");
      return;
    }

    const entryData: NewPriceEntryInput = {
      category: form.category,
      productName: form.productName.trim(),
      packageSize: form.packageSize.trim(),
      store: form.store.trim(),
      price: priceNumber,
      currency: "EUR",
      date: dateObj,
      note: form.note.trim(),
    };

    const template: LastEntryTemplate = {
      category: form.category,
      productName: form.productName.trim(),
      packageSize: form.packageSize.trim(),
      date: form.date,
    };
    setLastEntryTemplate(template);

    try {
      setIsSubmitting(true);
      await addPriceEntry(user.uid, entryData);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_KEY_LAST_CATEGORY, entryData.category);
        if (entryData.store) {
          window.localStorage.setItem(LOCAL_KEY_LAST_STORE, entryData.store);
        }
      }

      setSuccessMessage(
        `Записано: ${entryData.productName} — ${formatEur(entryData.price)} (${formatBgn(eurToBgn(entryData.price))}) · ${entryData.store || "без магазин"}`
      );

      setForm((prev) => ({
        ...initialFormState(),
        category: prev.category,
      }));
    } catch (err) {
      console.error(err);
      setErrorMessage("Грешка при записването. Опитай отново.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseLastTemplate = () => {
    if (!lastEntryTemplate) return;
    setForm((prev) => ({
      ...prev,
      ...initialFormState(),
      category: lastEntryTemplate.category,
      productName: lastEntryTemplate.productName,
      packageSize: lastEntryTemplate.packageSize,
      date: lastEntryTemplate.date,
      store: "",
      price: "",
      note: "",
    }));
    setSuccessMessage(null);
  };

  const handleNewProduct = () => {
    setForm((prev) => ({ ...initialFormState(), category: prev.category }));
    setSuccessMessage(null);
    setLastEntryTemplate(null);
  };

  // Live BGN preview
  const priceNum = Number(form.price.replace(",", "."));
  const bgnPreview = !Number.isNaN(priceNum) && priceNum > 0
    ? eurToBgn(priceNum)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Категория */}
      <div className="space-y-1.5">
        <label className={labelCls} htmlFor="pd-category">Категория</label>
        <select
          id="pd-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className={inputCls}
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Продукт */}
      <div className="space-y-1.5">
        <label className={labelCls} htmlFor="pd-product">Продукт</label>
        <input
          id="pd-product"
          name="productName"
          value={form.productName}
          onChange={handleChange}
          placeholder="Хайникен"
          autoComplete="off"
          className={inputCls}
        />
      </div>

      {/* Разфасовка */}
      <div className="space-y-1.5">
        <label className={labelCls} htmlFor="pd-pkg">Разфасовка</label>
        <input
          id="pd-pkg"
          name="packageSize"
          value={form.packageSize}
          onChange={handleChange}
          placeholder="500 мл кен"
          className={inputCls}
        />
      </div>

      {/* Магазин */}
      <div className="space-y-1.5">
        <label className={labelCls} htmlFor="pd-store">Магазин</label>
        <input
          id="pd-store"
          name="store"
          value={form.store}
          onChange={handleChange}
          placeholder="Фантастико"
          autoComplete="off"
          className={inputCls}
        />
      </div>

      {/* Цена + Дата */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="pd-price">Цена (EUR)</label>
          <input
            id="pd-price"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="1.28"
            inputMode="decimal"
            className={[inputCls, "nums"].join(" ")}
          />
          {bgnPreview !== null && (
            <p className="nums text-xs text-fg-2">≈ {formatBgn(bgnPreview)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={labelCls} htmlFor="pd-date">Дата</label>
          <input
            id="pd-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
      </div>

      {/* Бележка */}
      <div className="space-y-1.5">
        <label className={labelCls} htmlFor="pd-note">
          Бележка{" "}
          <span className="font-normal text-muted-fg">(по желание)</span>
        </label>
        <textarea
          id="pd-note"
          name="note"
          value={form.note}
          onChange={handleChange}
          rows={2}
          placeholder="на промоция, клубна карта…"
          className={[inputCls, "h-auto py-2.5 resize-none"].join(" ")}
        />
      </div>

      {/* Error */}
      {errorMessage && (
        <div role="alert" className="rounded-lg bg-danger-l px-3 py-2.5 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="space-y-2 rounded-lg bg-accent-l px-3 py-2.5">
          <p className="text-sm font-medium text-accent">{successMessage}</p>
          {lastEntryTemplate && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUseLastTemplate}
                className="rounded-md border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
              >
                + още за този продукт
              </button>
              <button
                type="button"
                onClick={handleNewProduct}
                className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-fg-2 transition-colors hover:bg-muted hover:text-fg"
              >
                Нов продукт
              </button>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-lg bg-accent text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-h disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Записване…" : "Запиши"}
      </button>
    </form>
  );
}
