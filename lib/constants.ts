import { FilterCategory } from "@/types/ar";

export const ANAK_USAHA_COMPANIES = [
  "PT Mitra Atlas Nusantara",
  "PT Fajar Bumi Harmoni",
  "PT Fajar Mitra Harmoni",
  "PT Fajar Rawayan Utama",
];

export const CATEGORY_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "All Customers" },
  { value: "anak-usaha", label: "Anak Usaha" },
  { value: "non-anak-usaha", label: "Non Anak Usaha" },
];

export const DEFAULT_START_DATE = "2024-01-01";
