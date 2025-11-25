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
  date: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
  note?: string;
}

export type NewPriceEntryInput = Omit<
  PriceEntry,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
