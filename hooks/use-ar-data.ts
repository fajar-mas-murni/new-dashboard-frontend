import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { DEFAULT_START_DATE } from "@/lib/constants";
import { isCustomerInCategory } from "@/lib/formatters";

export interface SectionLoadingState {
  summary: boolean;
  paidSummary: boolean;
  paidVsUnpaid: boolean;
  customerInvoices: boolean;
  umc: boolean;
}

const initialData: ArSummaryResponse = {
  summary: [],
  "top-10-unpaid-customers": [],
  "summary-customer": [],
  "summary-unpaid": [],
  "paid-invoices-summary": [],
  "paid-vs-unpaid-monthly": [],
  "customer-invoices": [],
  "all-umc-this-month": [],
};

export function useArData() {
  const getDefaultStartDate = () => DEFAULT_START_DATE;

  const getDefaultEndDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const [data, setData] = useState<ArSummaryResponse>(initialData);
  const [sectionLoading, setSectionLoading] = useState<SectionLoadingState>({
    summary: true,
    paidSummary: true,
    paidVsUnpaid: true,
    customerInvoices: true,
    umc: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>(getDefaultStartDate);
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate);
  const [category, setCategory] = useState<FilterCategory>("all");
  const [customer, setCustomer] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");
  const [group, setGroup] = useState<string>("all");

  const fetchIdRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setError(null);
    setSectionLoading({
      summary: true,
      paidSummary: true,
      paidVsUnpaid: true,
      customerInvoices: true,
      umc: true,
    });

    const params = new URLSearchParams();
    if (startDate) params.append("start-date", startDate);
    if (endDate) params.append("end-date", endDate);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030";

    const fetchJson = async (endpoint: string) => {
      try {
        const res = await fetch(`${apiUrl}/account-receivable${endpoint}`);
        if (!res.ok) {
          throw new Error(`Endpoint ${endpoint} returned ${res.status}`);
        }
        const json = await res.json();
        return json.data || [];
      } catch (err: any) {
        console.warn(`Failed to fetch ${endpoint}:`, err.message);
        return null;
      }
    };

    // 1. Fetch main AR Summary (fastest - sets up KPI cards & initial customers)
    (async () => {
      try {
        const summaryData = await fetchJson(`/summary${queryString}`);
        if (currentFetchId !== fetchIdRef.current) return;

        if (summaryData) {
          setData(prev => ({
            ...prev,
            summary: summaryData.summary || [],
            "top-10-unpaid-customers": summaryData["top-10-unpaid-customers"] || [],
            "summary-customer": summaryData["summary-customer"] || [],
            "summary-unpaid": summaryData["summary-unpaid"] || [],
          }));
        }
      } catch (err: any) {
        if (currentFetchId === fetchIdRef.current) {
          setError(err.message || "Failed to load summary data");
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setSectionLoading(prev => ({ ...prev, summary: false }));
        }
      }
    })();

    // 2. Fetch Paid Invoices Summary
    (async () => {
      const paidSummary = await fetchJson(`/paid-invoices-summary${queryString}`);
      if (currentFetchId !== fetchIdRef.current) return;
      if (paidSummary) {
        setData(prev => ({
          ...prev,
          "paid-invoices-summary": Array.isArray(paidSummary) ? paidSummary : [],
        }));
      }
      setSectionLoading(prev => ({ ...prev, paidSummary: false }));
    })();

    // 3. Fetch Paid vs Unpaid Monthly
    (async () => {
      const monthlyData = await fetchJson(`/paid-vs-unpaid-monthly${queryString}`);
      if (currentFetchId !== fetchIdRef.current) return;
      if (monthlyData) {
        setData(prev => ({
          ...prev,
          "paid-vs-unpaid-monthly": Array.isArray(monthlyData) ? monthlyData : [],
        }));
      }
      setSectionLoading(prev => ({ ...prev, paidVsUnpaid: false }));
    })();

    // 4. Fetch Customer Invoices
    (async () => {
      const customerInvoices = await fetchJson(`/customer-invoices${queryString}`);
      if (currentFetchId !== fetchIdRef.current) return;
      if (customerInvoices) {
        setData(prev => ({
          ...prev,
          "customer-invoices": Array.isArray(customerInvoices) ? customerInvoices : [],
        }));
      }
      setSectionLoading(prev => ({ ...prev, customerInvoices: false }));
    })();

    // 5. Fetch UMC This Month
    (async () => {
      const umcData = await fetchJson(`/all-umc-this-month${queryString}`);
      if (currentFetchId !== fetchIdRef.current) return;
      if (umcData) {
        setData(prev => ({
          ...prev,
          "all-umc-this-month": Array.isArray(umcData) ? umcData : [],
        }));
      }
      setSectionLoading(prev => ({ ...prev, umc: false }));
    })();

  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Overall loading: true if summary is still loading or if everything is loading
  const loading = sectionLoading.summary;
  const isAnyLoading = Object.values(sectionLoading).some(Boolean);

  // Derived unique customer names for filter dropdown
  const customerList = useMemo(() => {
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
    const branches = new Set<string>();

    const summaryCust = data["summary-customer"] || [];
    summaryCust.forEach(item => {
      if (item.branch && item.branch !== "Unknown") branches.add(String(item.branch));
    });

    return Array.from(branches).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Derived unique groups for filter dropdown
  const groupList = useMemo(() => {
    const groups = new Set<string>();
    let hasUnknown = false;

    const checkItem = (grp?: string | null) => {
      if (!grp || grp === "-" || grp.trim() === "" || grp === "Unknown") {
        hasUnknown = true;
      } else {
        groups.add(grp.trim());
      }
    };

    (data["summary"] || []).forEach(item => checkItem(item.group));
    (data["top-10-unpaid-customers"] || []).forEach(item => checkItem(item.group));
    (data["summary-customer"] || []).forEach(item => checkItem(item.group));
    (data["summary-unpaid"] || []).forEach(item => checkItem(item.group));
    (data["paid-invoices-summary"] || []).forEach(item => checkItem(item.group));
    (data["paid-vs-unpaid-monthly"] || []).forEach(item => checkItem(item.group));

    const sortedGroups = Array.from(groups).sort((a, b) => a.localeCompare(b));
    if (hasUnknown) {
      sortedGroups.push("Unknown");
    }
    return sortedGroups;
  }, [data]);

  return {
    data,
    loading,
    isAnyLoading,
    sectionLoading,
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
    group,
    setGroup,
    customerList,
    branchList,
    groupList,
    refetch: fetchData,
  };
}
