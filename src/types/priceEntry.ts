export type CategoryId =
  | "beer"
  | "water"
  | "meat"
  | "bread"
  | "dairy"
  | "fruits_veg"
  | "other";

export interface PriceEntry {
  id: string;
  userId: string;
  category: CategoryId;
  productName: string;
  packageSize: string;
  store: string;
  price: number;
  /** "EUR" за нови записи; липсващото поле = стар запис в BGN */
  currency?: "EUR" | "BGN";
  date: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
  note?: string;
}

export type NewPriceEntryInput = Omit<
  PriceEntry,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
