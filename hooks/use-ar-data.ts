import { useState, useEffect, useCallback, useMemo } from "react";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { DEFAULT_START_DATE } from "@/lib/constants";
import { isCustomerInCategory } from "@/lib/formatters";

export function useArData() {
  const getDefaultStartDate = () => DEFAULT_START_DATE;

  const getDefaultEndDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const [data, setData] = useState<ArSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>(getDefaultStartDate);
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate);
  const [category, setCategory] = useState<FilterCategory>("all");
  const [customer, setCustomer] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start-date", startDate);
      if (endDate) params.append("end-date", endDate);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/account-receivable/summary?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch summary data");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading dashboard data");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived unique customer names for filter dropdown
  const customerList = useMemo(() => {
    if (!data) return [];
    const names = new Set<string>();

    const summaryCust = data["summary-customer"] || [];
    summaryCust.forEach(item => {
      if (item.customer && isCustomerInCategory(item.customer, category)) {
        names.add(item.customer);
      }
    });

    const custInvoices = data["customer-invoices"] || [];
    custInvoices.forEach(item => {
      if (item.customer && isCustomerInCategory(item.customer, category)) {
        names.add(item.customer);
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [data, category]);

  // Derived unique branches for filter dropdown
  const branchList = useMemo(() => {
    if (!data) return [];
    const branches = new Set<string>();

    const summaryCust = data["summary-customer"] || [];
    summaryCust.forEach(item => {
      if (item.branch) branches.add(String(item.branch));
    });

    return Array.from(branches).sort((a, b) => a.localeCompare(b));
  }, [data]);

  return {
    data,
    loading,
    error,
    mounted,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    category,
    setCategory,
    customer,
    setCustomer,
    branch,
    setBranch,
    customerList,
    branchList,
    refetch: fetchData,
  };
}
