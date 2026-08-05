import { ANAK_USAHA_COMPANIES } from "./constants";
import { FilterCategory } from "@/types/ar";

export const formatAmount = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatPaidAmount = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const formatPeriod = (periodStr: string | undefined | null): string => {
  if (!periodStr || periodStr.length < 6) return periodStr || "";
  const year = periodStr.substring(0, 4);
  const month = periodStr.substring(4, 6);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const mIndex = parseInt(month, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${monthNames[mIndex]} ${year}`;
  }
  return periodStr;
};

export const isCustomerInCategory = (custName: string | undefined | null, category: FilterCategory): boolean => {
  if (category === "all") return true;
  if (!custName) return false;

  const cleanName = custName.trim().toLowerCase();
  const isAnakUsaha = ANAK_USAHA_COMPANIES.some(comp =>
    cleanName.includes(comp.toLowerCase()) || comp.toLowerCase().includes(cleanName)
  );

  if (category === "anak-usaha") return isAnakUsaha;
  if (category === "non-anak-usaha") return !isAnakUsaha;
  return true;
};
