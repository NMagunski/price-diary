"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CategoryId, NewPriceEntryInput } from "@/types/priceEntry";
import { addPriceEntry } from "@/lib/firebase/firestore";

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

  // При първо зареждане – използваме последна категория и магазин от localStorage
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

  // Loading auth
  if (loading) {
    return (
      <p className="text-center text-sm text-slate-600">
        Зареждане…
      </p>
    );
  }

  // No user logged in
  if (!user) {
    return (
      <p className="text-center text-sm text-red-600">
        Трябва да влезеш в профила си.{" "}
        <a href="/auth/login" className="text-emerald-600 underline">
          Вход
        </a>
      </p>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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
      setErrorMessage("Моля, въведи име на продукта.");
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
      date: dateObj,
      note: form.note.trim(), // винаги string
    };

    // Запазваме шаблон за "още записи за този продукт"
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

      // Запомняме последна категория и магазин
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_KEY_LAST_CATEGORY, entryData.category);
        if (entryData.store) {
          window.localStorage.setItem(LOCAL_KEY_LAST_STORE, entryData.store);
        }
      }

      setSuccessMessage(
        `Записано: ${entryData.productName} – ${entryData.price.toFixed(
          2
        )} лв (${entryData.store || "без магазин"})`
      );

      // Нулираме формата, но запазваме категорията
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

  // Бърз бутон: още записи за същия продукт
  const handleUseLastTemplate = () => {
    if (!lastEntryTemplate) return;

    setForm((prev) => ({
      ...prev,
      ...initialFormState(),
      category: lastEntryTemplate.category,
      productName: lastEntryTemplate.productName,
      packageSize: lastEntryTemplate.packageSize,
      date: lastEntryTemplate.date,
      // store, price и note остават празни
      store: "",
      price: "",
      note: "",
    }));

    setSuccessMessage(null);
  };

  // Нов продукт – изчистваме всичко, но пазим категорията
  const handleNewProduct = () => {
    setForm((prev) => ({
      ...initialFormState(),
      category: prev.category,
    }));
    setSuccessMessage(null);
    setLastEntryTemplate(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Категория */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Категория</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="border rounded-md px-3 py-2"
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Продукт */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Продукт</label>
        <input
          name="productName"
          value={form.productName}
          onChange={handleChange}
          placeholder="Хайникен"
          className="border rounded-md px-3 py-2"
        />
      </div>

      {/* Разфасовка */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Разфасовка</label>
        <input
          name="packageSize"
          value={form.packageSize}
          onChange={handleChange}
          placeholder="500 мл кен"
          className="border rounded-md px-3 py-2"
        />
      </div>

      {/* Магазин */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Магазин</label>
        <input
          name="store"
          value={form.store}
          onChange={handleChange}
          placeholder="Фантастико"
          className="border rounded-md px-3 py-2"
        />
      </div>

      {/* Цена + дата */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Цена (лв)</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="2.50"
            inputMode="decimal"
            className="border rounded-md px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Дата</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Бележка */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Бележка (по желание)</label>
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          rows={2}
          placeholder="на промоция, клубна карта и т.н."
          className="border rounded-md px-3 py-2"
        />
      </div>

      {/* Съобщения + бързи бутони */}
      {errorMessage && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      {successMessage && (
        <div className="space-y-2">
          <p className="text-emerald-600 text-sm">{successMessage}</p>

          {lastEntryTemplate && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUseLastTemplate}
                className="inline-flex items-center rounded-md border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                + още за този продукт
              </button>
              <button
                type="button"
                onClick={handleNewProduct}
                className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Нов продукт
              </button>
            </div>
          )}
        </div>
      )}

      {/* Бутон */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition disabled:opacity-60"
      >
        {isSubmitting ? "Записване…" : "Запиши"}
      </button>
    </form>
  );
}
