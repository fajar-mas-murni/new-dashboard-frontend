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
  arOther: boolean;
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

function processRawArOther(rawItems: any[]) {
  const summaryTemp = new Map<string, any>();
  const customerTemp = new Map<string, any>();
  const customerMap = new Map<string, any>();

  rawItems.forEach((dt: any) => {
    const branch = String(dt["Branch"] || "Unknown");
    const group = String(dt["SalesGroup"] || dt["Group"] || "Unknown");
    const customer = String(dt["CustomerName"] || "Unknown");
    const rate = parseFloat(dt["Rate"] || 1);
    const balance = parseFloat(dt["BalanceIDR"] || 0);

    const key = customer + "|" + branch + "|" + group;
    if (!summaryTemp.has(key)) {
      summaryTemp.set(key, {
        branch,
        group,
        customer,
        "unpaid-invoice": 0,
        "overdue-amount": 0,
        "overdue-30-plus": 0,
        "overdue-90-plus": 0,
      });
    }
    const sumItem = summaryTemp.get(key);
    sumItem["unpaid-invoice"] += balance;
    sumItem["overdue-amount"] += (
      (parseFloat(dt["Current"] || 0) * rate) +
      (parseFloat(dt["_130"] || 0) * rate)
    );
    sumItem["overdue-30-plus"] += (
      (parseFloat(dt["_3160"] || 0) * rate) +
      (parseFloat(dt["_6090"] || 0) * rate)
    );
    sumItem["overdue-90-plus"] += (
      (parseFloat(dt["_90180"] || 0) * rate) +
      (parseFloat(dt["over180"] || 0) * rate)
    );

    if (customerTemp.has(key)) {
      customerTemp.get(key).amount += balance;
    } else {
      customerTemp.set(key, { customer, branch, group, amount: balance });
    }

    const current = (parseFloat(dt["Current"] || 0) * rate) || 0;
    const val1_30 = (parseFloat(dt["_130"] || 0) * rate) || 0;
    const val31_60 = (parseFloat(dt["_3160"] || 0) * rate) || 0;
    const val61_90 = (parseFloat(dt["_6090"] || 0) * rate) || 0;
    const val91_180 = (parseFloat(dt["_90180"] || 0) * rate) || 0;
    const val_over180 = (parseFloat(dt["over180"] || 0) * rate) || 0;

    if (customerMap.has(key)) {
      const existing = customerMap.get(key);
      existing.current += current;
      existing["1-30"] += val1_30;
      existing["31-60"] += val31_60;
      existing["61-90"] += val61_90;
      existing["91-180"] += val91_180;
      existing["over180"] += val_over180;
      existing.amountDue += balance;
    } else {
      customerMap.set(key, {
        customer,
        branch,
        group,
        current,
        "1-30": val1_30,
        "31-60": val31_60,
        "61-90": val61_90,
        "91-180": val91_180,
        "over180": val_over180,
        amountDue: balance,
      });
    }
  });

  const summaryUnpaid = rawItems.map((dt: any) => ({
    customer: dt["CustomerName"] || "Unknown",
    branch: String(dt["Branch"] || "Unknown"),
    group: String(dt["SalesGroup"] || "Unknown"),
    number: dt["RefNbr"] || dt["DocumentNo"] || "",
    date: dt["Date"],
    dueDate: dt["DueDate"],
    amountDue: parseFloat(dt["BalanceIDR"] || 0),
  }));

  return {
    summary: Array.from(summaryTemp.values()),
    "top-10-unpaid-customers": Array.from(customerTemp.values()),
    "summary-customer": Array.from(customerMap.values()),
    "summary-unpaid": summaryUnpaid,
  };
}

export function useArData() {
  const getDefaultStartDate = () => DEFAULT_START_DATE;

  const getDefaultEndDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const [data, setData] = useState<ArSummaryResponse>(initialData);
  const [arOtherData, setArOtherData] = useState<ArSummaryResponse>(initialData);
  const [sectionLoading, setSectionLoading] = useState<SectionLoadingState>({
    summary: true,
    paidSummary: true,
    paidVsUnpaid: true,
    customerInvoices: true,
    umc: true,
    arOther: true,
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
      arOther: true,
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

    // 6. Fetch AR Other Summary
    (async () => {
      try {
        const otherRes = await fetchJson(`/ar-other${queryString}`);
        if (currentFetchId !== fetchIdRef.current) return;

        if (otherRes) {
          if (Array.isArray(otherRes)) {
            const processed = processRawArOther(otherRes);
            setArOtherData({
              ...initialData,
              ...processed,
            });
          } else if (typeof otherRes === "object") {
            setArOtherData({
              ...initialData,
              summary: otherRes.summary || [],
              "top-10-unpaid-customers": otherRes["top-10-unpaid-customers"] || [],
              "summary-customer": otherRes["summary-customer"] || [],
              "summary-unpaid": otherRes["summary-unpaid"] || [],
            });
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch AR Other:", err.message);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setSectionLoading(prev => ({ ...prev, arOther: false }));
        }
      }
    })();

  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Overall loading: true if summary is still loading
  const loading = sectionLoading.summary;
  const isAnyLoading = Object.values(sectionLoading).some(Boolean);

  // Derived unique customer names for filter dropdown (including AR Other)
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

    const otherCust = arOtherData["summary-customer"] || [];
    otherCust.forEach(item => {
      if (item.customer && isCustomerInCategory(item.customer, category)) {
        names.add(item.customer);
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [data, arOtherData, category]);

  // Derived unique branches for filter dropdown (including AR Other)
  const branchList = useMemo(() => {
    const branches = new Set<string>();

    const summaryCust = data["summary-customer"] || [];
    summaryCust.forEach(item => {
      if (item.branch && item.branch !== "Unknown") branches.add(String(item.branch));
    });

    const otherCust = arOtherData["summary-customer"] || [];
    otherCust.forEach(item => {
      if (item.branch && item.branch !== "Unknown") branches.add(String(item.branch));
    });

    return Array.from(branches).sort((a, b) => a.localeCompare(b));
  }, [data, arOtherData]);

  // Derived unique groups for filter dropdown (including AR Other)
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

    (arOtherData["summary"] || []).forEach(item => checkItem(item.group));
    (arOtherData["top-10-unpaid-customers"] || []).forEach(item => checkItem(item.group));
    (arOtherData["summary-customer"] || []).forEach(item => checkItem(item.group));
    (arOtherData["summary-unpaid"] || []).forEach(item => checkItem(item.group));

    const sortedGroups = Array.from(groups).sort((a, b) => a.localeCompare(b));
    if (hasUnknown) {
      sortedGroups.push("Unknown");
    }
    return sortedGroups;
  }, [data, arOtherData]);

  return {
    data,
    arOtherData,
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
