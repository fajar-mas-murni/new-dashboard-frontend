"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Calendar, AlertCircle, FileText, Clock, CalendarDays, Inbox, BarChart3, FileSpreadsheet, Receipt, Building2, Users, Filter, ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface CustomerUnpaid {
  customer: string;
  branch: string;
  amount: number;
}

interface CustomerSummary {
  customer: string;
  branch: string;
  current: number;
  "1-30": number;
  "31-60": number;
  "61-90": number;
  "91-180": number;
  "over180": number;
  amountDue: number;
}

interface UnpaidInvoice {
  customer: string;
  branch: string;
  number: string;
  date: string;
  dueDate: string;
  amountDue: number;
}

interface PaidInvoiceSummary {
  customer: string;
  branch: string;
  currentMonth: number;
  lastMonth: number;
  last12Month: number;
}

interface PaidVsUnpaidMonthly {
  period: string;
  branch: string;
  paid: number;
  unpaid: number;
}

interface CustomerInvoice {
  customer: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  currency: string;
  amountInCurrency: number;
  amountInHomeCurrency: number;
  amountDueInHomeCurrency: number;
}

interface UmcItem {
  customer: string;
  invoiceNo: string;
  dueDate: string;
  currency: string;
  amountInCurrency: number;
  amountInHomeCurrency: number;
}

interface ArSummaryResponse {
  summary: {
    branch: string;
    customer: string;
    "unpaid-invoice": number;
    "overdue-amount": number;
    "overdue-30-plus": number;
    "overdue-90-plus": number;
  }[];
  "top-10-unpaid-customers": CustomerUnpaid[];
  "summary-customer": CustomerSummary[];
  "summary-unpaid": UnpaidInvoice[];
  "paid-invoices-summary": PaidInvoiceSummary[];
  "paid-vs-unpaid-monthly": PaidVsUnpaidMonthly[];
  "customer-invoices": CustomerInvoice[];
  "all-umc-this-year": UmcItem[];
}

export default function Page() {
  const [data, setData] = useState<ArSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryPage, setSummaryPage] = useState<number>(1);
  const [unpaidPage, setUnpaidPage] = useState<number>(1);
  const [paidPage, setPaidPage] = useState<number>(1);
  const [customerInvoicesPage, setCustomerInvoicesPage] = useState<number>(1);
  const [umcPage, setUmcPage] = useState<number>(1);
  const [summaryModalPage, setSummaryModalPage] = useState<number>(1);
  const [unpaidModalPage, setUnpaidModalPage] = useState<number>(1);
  const [mounted, setMounted] = useState<boolean>(false);

  // Search & Sort states for datatables
  const [summarySearch, setSummarySearch] = useState<string>("");
  const [summarySortCol, setSummarySortCol] = useState<keyof CustomerSummary>("amountDue");
  const [summarySortDir, setSummarySortDir] = useState<"asc" | "desc">("desc");

  const [unpaidSearch, setUnpaidSearch] = useState<string>("");
  const [unpaidSortCol, setUnpaidSortCol] = useState<keyof UnpaidInvoice>("amountDue");
  const [unpaidSortDir, setUnpaidSortDir] = useState<"asc" | "desc">("desc");

  const [custInvoicesSearch, setCustInvoicesSearch] = useState<string>("");
  const [custInvoicesSortCol, setCustInvoicesSortCol] = useState<keyof CustomerInvoice>("amountDueInHomeCurrency");
  const [custInvoicesSortDir, setCustInvoicesSortDir] = useState<"asc" | "desc">("desc");

  const [umcSearch, setUmcSearch] = useState<string>("");
  const [umcSortCol, setUmcSortCol] = useState<keyof UmcItem>("amountInHomeCurrency");
  const [umcSortDir, setUmcSortDir] = useState<"asc" | "desc">("desc");

  const [paidSearch, setPaidSearch] = useState<string>("");
  const [paidSortCol, setPaidSortCol] = useState<string>("last12Month");
  const [paidSortDir, setPaidSortDir] = useState<"asc" | "desc">("desc");

  const sortData = useCallback(<T,>(data: T[], col: keyof T, dir: "asc" | "desc"): T[] => {
    return [...data].sort((a, b) => {
      let valA = a[col];
      let valB = b[col];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return dir === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return dir === "asc" ? -1 : 1;
      if (strA > strB) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, []);

  const handleToggleSort = <T extends string>(
    col: T,
    currentCol: T,
    currentDir: "asc" | "desc",
    setCol: (c: T) => void,
    setDir: (d: "asc" | "desc") => void
  ) => {
    if (currentCol === col) {
      setDir(currentDir === "asc" ? "desc" : "asc");
    } else {
      setCol(col);
      setDir("desc");
    }
  };

  const renderSortableHeader = (
    label: string,
    colKey: any,
    currentCol: any,
    currentDir: "asc" | "desc",
    onSort: (col: any) => void,
    align: "left" | "right" = "left"
  ) => {
    const isSorted = currentCol === colKey;
    return (
      <th
        onClick={() => onSort(colKey)}
        className={`px-4 py-2.5 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none group/th ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
          <span>{label}</span>
          {isSorted ? (
            currentDir === "asc" ? (
              <ArrowUp className="w-3 h-3 text-theme-orange flex-shrink-0" />
            ) : (
              <ArrowDown className="w-3 h-3 text-theme-orange flex-shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30 group-hover/th:opacity-100 flex-shrink-0 transition-opacity" />
          )}
        </div>
      </th>
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDefaultStartDate = () => {
    return `2024-01-01`;
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const toDateString = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fromDateString = (str: string) => {
    if (!str) return undefined;
    const [year, month, day] = str.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Pilih tanggal";
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${day} ${months[month - 1] || ""} ${year}`;
  };

  // Date filters defaulted to Jan 1st of current year and today
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate);
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate);
  const [category, setCategory] = useState<string>("all");
  const [categoryLabel, setCategoryLabel] = useState<string>("All Categories");
  const [customer, setCustomer] = useState<string>("all");
  const [customerLabel, setCustomerLabel] = useState<string>("All Customers");
  const [branch, setBranch] = useState<string>("all");
  const [branchLabel, setBranchLabel] = useState<string>("All Branches");

  const ANAK_USAHA = [
    "mitra atlas nusantara",
    "fajar bumi harmoni",
    "fajar mitra harmoni",
    "fajar rawayan utama"
  ];

  const isCustomerInCategory = useCallback((customerName: string, cat: string) => {
    if (cat === "all") return true;
    if (!customerName) return false;
    const nameLower = customerName.toLowerCase();
    const isAnak = ANAK_USAHA.some(au => nameLower.includes(au));
    if (cat === "anak_usaha") return isAnak;
    if (cat === "non_anak_usaha") return !isAnak;
    return true;
  }, []);

  const mapBranchOption = useCallback((item: any) => ({
    value: String(item.BranchName),
    label: item.BranchName || item.BranchCode,
  }), []);

  const mapCustomerOption = useCallback((item: any) => ({
    value: item.CustomerName,
    label: item.CustomerName || item.CustomerCode,
  }), []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start-date", startDate);
      if (endDate) params.append("end-date", endDate);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account-receivable/summary?${params.toString()}`);

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
  };

  useEffect(() => {
    setSummaryPage(1);
    setUnpaidPage(1);
    setPaidPage(1);
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    setSummaryPage(1);
    setUnpaidPage(1);
    setPaidPage(1);
    setCustomerInvoicesPage(1);
    setUmcPage(1);
    setSummaryModalPage(1);
    setUnpaidModalPage(1);
  }, [customer, category]);

  // Formatter displaying the original raw value in Indonesian locale format
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  const formatPaidAmount = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">

      {/* Global Top Navbar */}
      <header className="w-full bg-gradient-to-r from-theme-black via-theme-header-via to-theme-header-to text-white shadow-md border-b border-slate-850 relative overflow-hidden py-3 px-6 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between md:justify-start gap-8">
          <h1 className="text-sm font-bold tracking-tight z-10 flex items-center gap-2">
            <span className="w-2 h-2 bg-theme-orange rounded-full animate-pulse"></span>
            New Dashboard
          </h1>
          <nav className="flex items-center gap-4 sm:gap-6 z-10">
            <button className="text-xs font-semibold text-white cursor-pointer relative py-1.5 after:absolute after:-bottom-3.5 after:left-0 after:right-0 after:h-0.5 after:bg-theme-orange">
              Account Receivable
            </button>
            <button className="text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer py-1.5">
              Revenue
            </button>
            <button className="text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer py-1.5">
              Account Payable
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Dashboard Header & Filters (Combined) */}
        <div className="bg-gradient-to-r from-theme-black via-theme-header-via to-theme-header-to text-white rounded-2xl px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between shadow-md border border-theme-orange/20 relative overflow-hidden gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-theme-yellow/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <h2 className="text-base sm:text-lg font-bold tracking-tight z-10 whitespace-nowrap">
            Accounts Receivable dashboard
          </h2>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 z-10">
            <Dialog>
              <DialogTrigger className="flex items-center gap-2 px-4 py-2 bg-[#f0f2f5] dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300/80 dark:border-slate-700 hover:border-theme-orange/20 hover:text-theme-orange text-gray-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors h-9 cursor-pointer">
                <Filter className="w-4 h-4" />
                Filters
                {(category !== "all" || customer !== "all" || branch !== "all" || startDate !== getDefaultStartDate() || endDate !== getDefaultEndDate()) && (
                  <span className="flex items-center justify-center bg-theme-orange text-white w-4 h-4 rounded-full text-[9px] font-bold">!</span>
                )}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-[60]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Filter Data</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-5 py-4">
                  {/* Branch Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Branch:</label>
                    <SearchableSelect
                      value={branch}
                      selectedLabel={branchLabel}
                      onValueChange={(val, label) => { setBranch(val); setBranchLabel(label); }}
                      fetchUrl={`${process.env.NEXT_PUBLIC_API_URL}/master/branch`}
                      mapOption={mapBranchOption}
                      placeholder="Select branch"
                      allLabel="All Branches"
                      pageSize={10}
                      className="w-full"
                      icon={<Building2 className="w-4 h-4" />}
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Category:</label>
                    <SearchableSelect
                      value={category}
                      selectedLabel={categoryLabel}
                      onValueChange={(val, label) => {
                        setCategory(val);
                        setCategoryLabel(label);
                        setCustomer("all");
                        setCustomerLabel("All Customers");
                      }}
                      staticOptions={[
                        { value: "anak_usaha", label: "Anak Usaha" },
                        { value: "non_anak_usaha", label: "Non Anak Usaha" }
                      ]}
                      placeholder="Select category"
                      allLabel="All Customers"
                      className="w-full"
                      icon={<Users className="w-4 h-4" />}
                    />
                  </div>

                  {/* Customer Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Customer:</label>
                    <SearchableSelect
                      value={customer}
                      selectedLabel={customerLabel}
                      onValueChange={(val, label) => { setCustomer(val); setCustomerLabel(label); }}
                      fetchUrl={`${process.env.NEXT_PUBLIC_API_URL}/master/customer?category=${category}`}
                      mapOption={mapCustomerOption}
                      placeholder="Select customer"
                      allLabel="All Customers"
                      pageSize={10}
                      className="w-full"
                      icon={<Users className="w-4 h-4" />}
                    />
                  </div>

                  {/* Start Date Picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Start Date:</label>
                    <Popover>
                      <PopoverTrigger className="w-full flex flex-row items-center justify-start text-left font-semibold bg-[#f0f2f5] dark:bg-slate-800 border border-gray-300/80 dark:border-slate-700 hover:bg-gray-250 dark:hover:bg-slate-700 text-xs rounded-xl px-3 py-2 cursor-pointer text-[#2d2e30] dark:text-slate-100 h-9 transition-colors ring-0 outline-none">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                        {formatDisplayDate(startDate)}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900 z-[100]">
                        <ShadcnCalendar
                          mode="single"
                          defaultMonth={fromDateString(startDate)}
                          selected={fromDateString(startDate)}
                          onSelect={(date) => {
                            if (date) setStartDate(toDateString(date));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date Picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">End Date:</label>
                    <Popover>
                      <PopoverTrigger className="w-full flex flex-row items-center justify-start text-left font-semibold bg-[#f0f2f5] dark:bg-slate-800 border border-gray-300/80 dark:border-slate-700 hover:bg-gray-250 dark:hover:bg-slate-700 text-xs rounded-xl px-3 py-2 cursor-pointer text-[#2d2e30] dark:text-slate-100 h-9 transition-colors ring-0 outline-none">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                        {formatDisplayDate(endDate)}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900 z-[100]">
                        <ShadcnCalendar
                          mode="single"
                          defaultMonth={fromDateString(endDate)}
                          selected={fromDateString(endDate)}
                          onSelect={(date) => {
                            if (date) setEndDate(toDateString(date));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t border-gray-100 dark:border-slate-800 pt-4 mt-2">
                  <button
                    onClick={() => {
                      setStartDate(getDefaultStartDate());
                      setEndDate(getDefaultEndDate());
                      setCategory("all");
                      setCategoryLabel("All Customers");
                      setCustomer("all");
                      setCustomerLabel("All Customers");
                      setBranch("all");
                      setBranchLabel("All Branches");
                    }}
                    className="text-xs text-slate-500 hover:text-theme-orange font-semibold cursor-pointer transition-colors"
                  >
                    Reset Filters
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <button
              onClick={fetchData}
              disabled={mounted ? loading : false}
              suppressHydrationWarning
              className="p-2.5 bg-[#f0f2f5] dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl border border-gray-300/80 dark:border-slate-700 hover:border-theme-orange/20 hover:text-theme-orange transition-colors cursor-pointer h-9 w-9 flex items-center justify-center text-gray-600 dark:text-gray-300"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${mounted && loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Error:</span> {error}
            </div>
          </div>
        )}

        {/* Main content: Grid of 4 Cards */}
        {(() => {
          const rawSummary = data?.summary || [];
          const branchFilteredSummary = rawSummary.filter((item: any) =>
            (branch === "all" || String(item.branch) === String(branch)) &&
            (customer === "all" || item.customer === customer) &&
            isCustomerInCategory(item.customer, category)
          );
          const currentSummary = branchFilteredSummary.reduce((acc: any, curr: any) => ({
            "unpaid-invoice": acc["unpaid-invoice"] + (curr["unpaid-invoice"] || 0),
            "overdue-amount": acc["overdue-amount"] + (curr["overdue-amount"] || 0),
            "overdue-30-plus": acc["overdue-30-plus"] + (curr["overdue-30-plus"] || 0),
            "overdue-90-plus": acc["overdue-90-plus"] + (curr["overdue-90-plus"] || 0),
          }), { "unpaid-invoice": 0, "overdue-amount": 0, "overdue-30-plus": 0, "overdue-90-plus": 0 });

          return (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* Card 1: Unpaid Invoices Amount */}
                <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden">
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-yellow to-theme-amber rounded-r-full"></div>
                  <div className="flex-shrink-0 p-3 bg-theme-yellow/10 dark:bg-theme-yellow/5 border border-theme-yellow/20 dark:border-theme-yellow/10 rounded-xl">
                    <FileText className="w-5.5 h-5.5 text-theme-amber dark:text-theme-yellow" strokeWidth={2.2} />
                  </div>
                  <CardContent className="p-0 min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                      Unpaid Invoices Amount
                    </p>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5 tracking-tight truncate">
                      {loading ? (
                        <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mt-1" />
                      ) : (
                        formatAmount(currentSummary["unpaid-invoice"] || 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2: Overdue Amount */}
                <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden">
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-amber to-theme-orange rounded-r-full"></div>
                  <div className="flex-shrink-0 p-3 bg-theme-orange/10 dark:bg-theme-orange/5 border border-theme-orange/20 dark:border-theme-orange/10 rounded-xl">
                    <Clock className="w-5.5 h-5.5 text-theme-orange dark:text-theme-amber" strokeWidth={2.2} />
                  </div>
                  <CardContent className="p-0 min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                      Overdue Amount
                    </p>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5 tracking-tight truncate">
                      {loading ? (
                        <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mt-1" />
                      ) : (
                        formatAmount(currentSummary["overdue-amount"] || 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Overdue Invoices 30+ Days */}
                <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden">
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-orange to-theme-red rounded-r-full"></div>
                  <div className="flex-shrink-0 p-3 bg-theme-red/10 dark:bg-theme-red/5 border border-theme-red/20 dark:border-theme-red/10 rounded-xl">
                    <Calendar className="w-5.5 h-5.5 text-theme-red dark:text-theme-orange" strokeWidth={2.2} />
                  </div>
                  <CardContent className="p-0 min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                      Overdue 30+ Days
                    </p>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5 tracking-tight truncate">
                      {loading ? (
                        <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mt-1" />
                      ) : (
                        formatAmount(currentSummary["overdue-30-plus"] || 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Card 4: Overdue Invoices 90+ Days */}
                <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden">
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-red to-theme-brown rounded-r-full"></div>
                  <div className="flex-shrink-0 p-3 bg-theme-brown/10 dark:bg-theme-brown/5 border border-theme-brown/20 dark:border-theme-brown/10 rounded-xl">
                    <CalendarDays className="w-5.5 h-5.5 text-theme-brown dark:text-theme-red" strokeWidth={2.2} />
                  </div>
                  <CardContent className="p-0 min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                      Overdue 90+ Days
                    </p>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5 tracking-tight truncate">
                      {loading ? (
                        <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mt-1" />
                      ) : (
                        formatAmount(currentSummary["overdue-90-plus"] || 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })()}

        {/* Top 10 Customers Chart Section */}
        {loading ? (
          <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 p-6 shadow-sm relative overflow-hidden transition-colors duration-300 animate-pulse">
            <CardHeader className="p-0 mb-6">
              <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            </CardHeader>
            <Separator className="opacity-50" />
            <CardContent className="p-0 pt-6">
              <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                {/* Left Column: Skeletal Bars */}
                <div className="flex-1 space-y-4 pr-0 lg:pr-8 pb-6 lg:pb-0">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto flex-shrink-0"></div>
                      <div className="flex-1 h-5.5 bg-slate-100 dark:bg-slate-800/50 rounded-md"></div>
                    </div>
                  ))}
                </div>
                {/* Right Column: Skeletal Donut & Legend */}
                <div className="w-full lg:w-[540px] flex flex-row items-center justify-center gap-10 pl-0 lg:pl-8">
                  <div className="w-[200px] h-[200px] rounded-full border-[18px] border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-3.5 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-6 w-8 bg-slate-300 dark:bg-slate-800 rounded mt-0.5"></div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5 h-6">
                        <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                        <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (() => {
          const rawTop = data?.["top-10-unpaid-customers"] || [];
          const branchFilteredTop = rawTop.filter((item: any) =>
            (branch === "all" || String(item.branch) === String(branch)) &&
            isCustomerInCategory(item.customer, category)
          );
          const topMap = new Map();
          branchFilteredTop.forEach((item: any) => {
            const cust = item.customer;
            if (topMap.has(cust)) topMap.set(cust, topMap.get(cust) + item.amount);
            else topMap.set(cust, item.amount);
          });
          const filteredTop10 = Array.from(topMap, ([customer, amount]) => ({ customer, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

          if (filteredTop10.length === 0) {
            return (
              <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 p-12 shadow-sm relative overflow-hidden transition-colors duration-300 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/40 mb-4 text-slate-400 dark:text-slate-500 animate-pulse">
                  <Inbox className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">
                  Tidak ada data ditemukan
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 max-w-sm">
                  Tidak ada transaksi piutang tercatat pada periode yang Anda pilih. Silakan sesuaikan filter tanggal di atas.
                </p>
              </Card>
            );
          }

          return (
            <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-sm relative overflow-hidden transition-colors duration-300">
              <CardHeader className="p-6">
                <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                  <BarChart3 className="w-5.5 h-5.5 text-theme-orange" />
                  <span className="flex items-center flex-wrap gap-x-1">Unpaid invoices amount by customer (Top 10) <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span></span>
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-8 items-stretch p-6">
                  {/* Left Column: Horizontal Bar Chart */}
                  <div className="flex-1 flex flex-col justify-between pr-0 lg:pr-8 pb-6 lg:pb-0">
                    <div className="space-y-3.5">
                      {filteredTop10.map((item, idx) => {
                        const maxVal = filteredTop10[0]?.amount || 1;
                        const pct = (item.amount / maxVal) * 100;
                        const isMuted = customer !== "all" && customer !== item.customer;

                        return (
                          <div
                            key={idx}
                            onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                            className={`flex items-center gap-3 cursor-pointer group transition-all duration-300 ${isMuted ? "opacity-30 scale-[0.98]" : "opacity-100"}`}
                          >
                            <div className="w-28 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 truncate group-hover:text-blue-600 transition-colors" title={item.customer}>
                              {item.customer}
                            </div>
                            <div className="flex-1 h-5.5 bg-slate-100 dark:bg-slate-800/50 rounded-md overflow-hidden relative flex items-center shadow-inner">
                              <div
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: `var(--chart-${(idx % 10) + 1})`
                                }}
                                className="h-full rounded-r-md transition-all duration-500 group-hover:brightness-110 shadow-sm"
                              ></div>
                              <span className="absolute left-2.5 text-[9px] font-bold text-white drop-shadow-sm">
                                {new Intl.NumberFormat("id-ID").format(item.amount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Donut Chart & Legend */}
                  <div className="w-full lg:w-[540px] flex flex-row items-center justify-center gap-10 pl-0 lg:pl-8">
                    {(() => {
                      const totalUnpaidTop10 = filteredTop10.reduce((sum, item) => sum + item.amount, 0) || 1;
                      const radius = 75;
                      const circumference = 2 * Math.PI * radius;
                      let accumulatedAngle = 0;

                      return (
                        <>
                          {/* SVG Donut Chart */}
                          <div className="relative w-[200px] h-[200px] flex-shrink-0 flex items-center justify-center">
                            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                              {filteredTop10.map((item, idx) => {
                                const p = item.amount / totalUnpaidTop10;
                                const strokeOffset = circumference - (p * circumference);
                                const angle = accumulatedAngle;
                                accumulatedAngle += p * 360;
                                const isSelected = customer === item.customer;
                                const isAnySelected = customer !== "all";
                                const isMuted = isAnySelected && !isSelected;

                                return (
                                  <circle
                                    key={idx}
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    fill="transparent"
                                    stroke={`var(--chart-${(idx % 10) + 1})`}
                                    strokeWidth={isSelected ? "22" : "18"}
                                    strokeDasharray={`${circumference} ${circumference}`}
                                    strokeDashoffset={strokeOffset}
                                    transform={`rotate(${angle} 100 100)`}
                                    strokeLinecap="round"
                                    className={`transition-all duration-300 cursor-pointer ${isMuted ? "opacity-30" : "opacity-100"}`}
                                    onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                                  />
                                );
                              })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Top 10</span>
                              <span className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-0.5">AR</span>
                            </div>
                          </div>

                          {/* Legend List */}
                          <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto pr-1 select-none">
                            {filteredTop10.map((item, idx) => {
                              const p = (item.amount / totalUnpaidTop10) * 100;
                              const isSelected = customer === item.customer;
                              const isAnySelected = customer !== "all";
                              const isMuted = isAnySelected && !isSelected;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                                  className={`flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 rounded-md ${isMuted ? "opacity-35" : "opacity-100"} ${isSelected ? "bg-slate-100/80 dark:bg-slate-800/50" : ""}`}
                                >
                                  <span
                                    style={{ backgroundColor: `var(--chart-${(idx % 10) + 1})` }}
                                    className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                                  ></span>
                                  <span className="text-slate-700 dark:text-slate-300 truncate flex-1" title={item.customer}>
                                    {item.customer}
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400 pl-1">
                                    {p.toFixed(1)}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* AR Aging Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Table 1: Summary (Top 10) */}
          <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <CardHeader className="px-5 py-4 flex flex-row items-center justify-between gap-2.5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-theme-orange" />
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">Summary Customers (Top 10) <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span></CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-theme-brown text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
                    {renderSortableHeader("Customer", "customer", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
                    {renderSortableHeader("Current", "current", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                    {renderSortableHeader("1-30", "1-30", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                    {renderSortableHeader("31-60", "31-60", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                    {renderSortableHeader("61-90", "61-90", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                    {renderSortableHeader("91-180", "91-180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                    {renderSortableHeader("Over 180", "over180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                    {renderSortableHeader("Amount Due", "amountDue", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse h-11">
                        <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (() => {
                    const summaryCustomers = data?.["summary-customer"] || [];
                    const filteredSummary = summaryCustomers.filter(item =>
                      (customer === "all" || item.customer === customer) &&
                      (branch === "all" || String(item.branch) === String(branch)) &&
                      isCustomerInCategory(item.customer, category)
                    );
                    const sortedSummary = sortData(filteredSummary, summarySortCol, summarySortDir);
                    const top10Summary = sortedSummary.slice(0, 10);

                    if (top10Summary.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                            No data found
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <>
                        {top10Summary.map((item, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11 ${customer === item.customer ? "bg-theme-orange/10 dark:bg-theme-orange/5" : ""}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={item.customer}>{item.customer}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{item.current ? formatAmount(item.current) : "0"}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{item["1-30"] ? formatAmount(item["1-30"]) : "0"}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{item["31-60"] ? formatAmount(item["31-60"]) : "0"}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{item["61-90"] ? formatAmount(item["61-90"]) : "0"}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{item["91-180"] ? formatAmount(item["91-180"]) : "0"}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{item["over180"] ? formatAmount(item["over180"]) : "0"}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountDue)}</td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Modal */}
            {!loading && (() => {
              const summaryCustomers = data?.["summary-customer"] || [];
              const filteredSummaryBase = summaryCustomers.filter(item =>
                (customer === "all" || item.customer === customer) &&
                (branch === "all" || String(item.branch) === String(branch)) &&
                isCustomerInCategory(item.customer, category)
              );
              const totalSummaryAmountDue = filteredSummaryBase.reduce((sum, item) => sum + (item.amountDue || 0), 0);

              const filteredSummaryModal = filteredSummaryBase.filter(item =>
                !summarySearch || item.customer.toLowerCase().includes(summarySearch.toLowerCase())
              );
              const sortedSummaryModal = sortData(filteredSummaryModal, summarySortCol, summarySortDir);

              const itemsPerPageModal = 10;
              const totalSummaryPagesModal = Math.ceil(sortedSummaryModal.length / itemsPerPageModal) || 1;
              const paginatedSummaryModal = sortedSummaryModal.slice((summaryModalPage - 1) * itemsPerPageModal, summaryModalPage * itemsPerPageModal);

              if (filteredSummaryBase.length === 0) return null;

              return (
                <div className="border-t border-gray-100 dark:border-slate-850 px-4 py-3 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/30 mt-auto">
                  <Dialog>
                    <DialogTrigger className="cursor-pointer group flex items-center gap-2 hover:text-theme-orange transition-colors">
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        Grand Total: <span className="text-theme-orange ml-1 underline decoration-dotted">{formatAmount(totalSummaryAmountDue)}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-theme-orange bg-theme-orange/10 border border-theme-orange/30 rounded px-2 py-0.5 group-hover:bg-theme-orange group-hover:text-white transition-colors">
                        Lihat Detail
                      </span>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[90vw] lg:max-w-6xl w-full max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-0 overflow-hidden z-[70]">
                      <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-theme-orange" />
                          Detail Summary Customers <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
                        </DialogTitle>
                        <div className="relative w-full sm:w-56">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari customer..."
                            value={summarySearch}
                            onChange={(e) => setSummarySearch(e.target.value)}
                            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-orange"
                          />
                        </div>
                      </DialogHeader>
                      <div className="overflow-auto flex-1 p-6">
                        <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                          <thead>
                            <tr className="bg-theme-brown text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
                              {renderSortableHeader("Customer", "customer", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
                              {renderSortableHeader("Current", "current", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                              {renderSortableHeader("1-30", "1-30", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                              {renderSortableHeader("31-60", "31-60", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                              {renderSortableHeader("61-90", "61-90", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                              {renderSortableHeader("91-180", "91-180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                              {renderSortableHeader("Over 180", "over180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                              {renderSortableHeader("Amount Due", "amountDue", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                            {paginatedSummaryModal.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11">
                                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{item.customer}</td>
                                <td className="px-4 py-3 text-right font-medium">{item.current ? formatAmount(item.current) : "0"}</td>
                                <td className="px-4 py-3 text-right font-medium">{item["1-30"] ? formatAmount(item["1-30"]) : "0"}</td>
                                <td className="px-4 py-3 text-right font-medium">{item["31-60"] ? formatAmount(item["31-60"]) : "0"}</td>
                                <td className="px-4 py-3 text-right font-medium">{item["61-90"] ? formatAmount(item["61-90"]) : "0"}</td>
                                <td className="px-4 py-3 text-right font-medium">{item["91-180"] ? formatAmount(item["91-180"]) : "0"}</td>
                                <td className="px-4 py-3 text-right font-medium">{item["over180"] ? formatAmount(item["over180"]) : "0"}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountDue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/30 flex-shrink-0">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          Grand Total: <span className="text-theme-orange ml-1">{formatAmount(totalSummaryAmountDue)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">
                            {(summaryModalPage - 1) * itemsPerPageModal + 1}-{Math.min(summaryModalPage * itemsPerPageModal, sortedSummaryModal.length)} / {sortedSummaryModal.length}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSummaryModalPage(p => Math.max(1, p - 1))}
                              disabled={summaryModalPage === 1}
                              className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              &lt;
                            </button>
                            <button
                              onClick={() => setSummaryModalPage(p => Math.min(totalSummaryPagesModal, p + 1))}
                              disabled={summaryModalPage === totalSummaryPagesModal}
                              className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <span className="text-slate-400 text-[11px] font-medium">Top 10 Displayed</span>
                </div>
              );
            })()}
          </Card>

          {/* Table 2: Unpaid Invoices (Top 10) */}
          <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <CardHeader className="px-5 py-4 flex flex-row items-center justify-between gap-2.5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-theme-orange" />
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
                  Unpaid Invoices (Top 10) <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
                </CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#1A3644] text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
                    {renderSortableHeader("Customer", "customer", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                    {renderSortableHeader("Number", "number", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                    {renderSortableHeader("Date", "date", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                    {renderSortableHeader("Due Date", "dueDate", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                    {renderSortableHeader("Amount Due", "amountDue", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "right")}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse h-11">
                        <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (() => {
                    const unpaidInvoices = data?.["summary-unpaid"] || [];
                    const filteredUnpaid = unpaidInvoices.filter(item =>
                      (customer === "all" || item.customer === customer) &&
                      (branch === "all" || String(item.branch) === String(branch)) &&
                      isCustomerInCategory(item.customer, category)
                    );
                    const sortedUnpaid = sortData(filteredUnpaid, unpaidSortCol, unpaidSortDir);
                    const top10Unpaid = sortedUnpaid.slice(0, 10);

                    if (top10Unpaid.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                            No data found
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <>
                        {top10Unpaid.map((item, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11 ${customer === item.customer ? "bg-theme-orange/10 dark:bg-theme-orange/5" : ""}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={item.customer}>{item.customer}</td>
                            <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">{item.number}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-450">{formatDate(item.date)}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-450">{formatDate(item.dueDate)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountDue)}</td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Modal */}
            {!loading && (() => {
              const unpaidInvoices = data?.["summary-unpaid"] || [];
              const filteredUnpaidBase = unpaidInvoices.filter(item =>
                (customer === "all" || item.customer === customer) &&
                (branch === "all" || String(item.branch) === String(branch)) &&
                isCustomerInCategory(item.customer, category)
              );
              const totalUnpaidAmountDue = filteredUnpaidBase.reduce((sum, item) => sum + (item.amountDue || 0), 0);

              const filteredUnpaidModal = filteredUnpaidBase.filter(item =>
                !unpaidSearch ||
                item.customer.toLowerCase().includes(unpaidSearch.toLowerCase()) ||
                (item.number && item.number.toLowerCase().includes(unpaidSearch.toLowerCase()))
              );
              const sortedUnpaidModal = sortData(filteredUnpaidModal, unpaidSortCol, unpaidSortDir);

              const itemsPerPageModal = 10;
              const totalUnpaidPagesModal = Math.ceil(sortedUnpaidModal.length / itemsPerPageModal) || 1;
              const paginatedUnpaidModal = sortedUnpaidModal.slice((unpaidModalPage - 1) * itemsPerPageModal, unpaidModalPage * itemsPerPageModal);

              if (filteredUnpaidBase.length === 0) return null;

              return (
                <div className="border-t border-gray-100 dark:border-slate-850 px-4 py-3 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/30 mt-auto">
                  <Dialog>
                    <DialogTrigger className="cursor-pointer group flex items-center gap-2 hover:text-theme-orange transition-colors">
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        Grand Total: <span className="text-theme-orange ml-1 underline decoration-dotted">{formatAmount(totalUnpaidAmountDue)}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-theme-orange bg-theme-orange/10 border border-theme-orange/30 rounded px-2 py-0.5 group-hover:bg-theme-orange group-hover:text-white transition-colors">
                        Lihat Detail
                      </span>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[90vw] lg:max-w-6xl w-full max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-0 overflow-hidden z-[70]">
                      <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-theme-orange" />
                          Detail Unpaid Invoices <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
                        </DialogTitle>
                        <div className="relative w-full sm:w-56">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari unpaid invoice..."
                            value={unpaidSearch}
                            onChange={(e) => setUnpaidSearch(e.target.value)}
                            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-orange"
                          />
                        </div>
                      </DialogHeader>
                      <div className="overflow-auto flex-1 p-6">
                        <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                          <thead>
                            <tr className="bg-[#1A3644] text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
                              {renderSortableHeader("Customer", "customer", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                              {renderSortableHeader("Number", "number", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                              {renderSortableHeader("Date", "date", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                              {renderSortableHeader("Due Date", "dueDate", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                              {renderSortableHeader("Amount Due", "amountDue", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "right")}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                            {paginatedUnpaidModal.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11">
                                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{item.customer}</td>
                                <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-400">{item.number}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-450">{formatDate(item.date)}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-450">{formatDate(item.dueDate)}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountDue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/30 flex-shrink-0">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          Grand Total: <span className="text-theme-orange ml-1">{formatAmount(totalUnpaidAmountDue)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">
                            {(unpaidModalPage - 1) * itemsPerPageModal + 1}-{Math.min(unpaidModalPage * itemsPerPageModal, sortedUnpaidModal.length)} / {sortedUnpaidModal.length}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setUnpaidModalPage(p => Math.max(1, p - 1))}
                              disabled={unpaidModalPage === 1}
                              className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              &lt;
                            </button>
                            <button
                              onClick={() => setUnpaidModalPage(p => Math.min(totalUnpaidPagesModal, p + 1))}
                              disabled={unpaidModalPage === totalUnpaidPagesModal}
                              className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <span className="text-slate-400 text-[11px] font-medium">Top 10 Displayed</span>
                </div>
              );
            })()}
          </Card>

        </div>

        {/* Paid Invoices Section */}
        <div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Table: Paid Invoices by Customer */}
            <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-theme-orange" />
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">Paid invoices by customer <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span></CardTitle>
                </div>
                <div className="relative w-full sm:w-44">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={paidSearch}
                    onChange={(e) => setPaidSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-orange transition-all"
                  />
                </div>
              </CardHeader>
              <Separator />
              <div className="overflow-auto flex-1 text-slate-800 dark:text-slate-100" style={{ scrollbarGutter: "stable" }}>
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-theme-brown text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
                      {renderSortableHeader("Customer", "customer", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "left")}
                      {renderSortableHeader("Current Month", "currentMonth", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "right")}
                      {renderSortableHeader("Last Month", "lastMonth", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "right")}
                      {renderSortableHeader("Last 12 Month", "last12Month", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "right")}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse h-11">
                          <td className="px-4 py-3"><div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                          <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                          <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                          <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        </tr>
                      ))
                    ) : (() => {
                      const paidInvoices = data?.["paid-invoices-summary"] || [];
                      const filteredPaid = paidInvoices.filter(item =>
                        (customer === "all" || item.customer === customer) &&
                        (branch === "all" || String(item.branch) === String(branch)) &&
                        isCustomerInCategory(item.customer, category) &&
                        (!paidSearch || item.customer.toLowerCase().includes(paidSearch.toLowerCase()))
                      );
                      const groupedPaidMap = new Map();
                      filteredPaid.forEach((item: any) => {
                        if (!groupedPaidMap.has(item.customer)) {
                          groupedPaidMap.set(item.customer, { customer: item.customer, currentMonth: 0, lastMonth: 0, last12Month: 0 });
                        }
                        const curr = groupedPaidMap.get(item.customer);
                        curr.currentMonth += (item.currentMonth || 0);
                        curr.lastMonth += (item.lastMonth || 0);
                        curr.last12Month += (item.last12Month || 0);
                      });
                      const groupedPaid = Array.from(groupedPaidMap.values());
                      const sortedPaid = sortData(groupedPaid, paidSortCol as any, paidSortDir);

                      const itemsPerPage = 8;
                      const totalPaidPages = Math.ceil(sortedPaid.length / itemsPerPage) || 1;
                      const paginatedPaid = sortedPaid.slice((paidPage - 1) * itemsPerPage, paidPage * itemsPerPage);

                      if (sortedPaid.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                              No data found
                            </td>
                          </tr>
                        );
                      }

                      const maxCurrentMonth = Math.max(...groupedPaid.map((item: any) => item.currentMonth), 1);
                      const maxLastMonth = Math.max(...groupedPaid.map((item: any) => item.lastMonth), 1);
                      const maxLast12Month = Math.max(...groupedPaid.map((item: any) => item.last12Month), 1);

                      return (
                        <>
                          {paginatedPaid.map((item: any, idx: number) => {
                            const isCurrentSelected = customer === item.customer;

                            const currentBg = item.currentMonth > 0
                              ? `rgba(26, 54, 68, ${Math.max(0.08, (item.currentMonth / maxCurrentMonth) * 0.85)})`
                              : "transparent";
                            const currentText = item.currentMonth > 0 && (item.currentMonth / maxCurrentMonth > 0.55)
                              ? "text-white font-semibold"
                              : "text-slate-750 dark:text-slate-250 font-semibold";

                            const lastBg = item.lastMonth > 0
                              ? `rgba(26, 54, 68, ${Math.max(0.08, (item.lastMonth / maxLastMonth) * 0.85)})`
                              : "transparent";
                            const lastText = item.lastMonth > 0 && (item.lastMonth / maxLastMonth > 0.55)
                              ? "text-white font-semibold"
                              : "text-slate-750 dark:text-slate-250 font-semibold";

                            const last12Bg = item.last12Month > 0
                              ? `rgba(224, 86, 36, ${Math.max(0.08, (item.last12Month / maxLast12Month) * 0.75)})`
                              : "transparent";
                            const last12Text = item.last12Month > 0 && (item.last12Month / maxLast12Month > 0.5)
                              ? "text-white font-bold"
                              : "text-slate-800 dark:text-slate-200 font-bold";

                            return (
                              <tr
                                key={idx}
                                onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11 ${isCurrentSelected ? "bg-theme-orange/10 dark:bg-theme-orange/5" : ""}`}
                              >
                                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={item.customer}>
                                  {item.customer}
                                </td>
                                <td className={`px-4 py-3 text-right ${currentText}`} style={{ backgroundColor: currentBg }}>
                                  {item.currentMonth ? formatPaidAmount(item.currentMonth) : "0"}
                                </td>
                                <td className={`px-4 py-3 text-right ${lastText}`} style={{ backgroundColor: lastBg }}>
                                  {item.lastMonth ? formatPaidAmount(item.lastMonth) : "0"}
                                </td>
                                <td className={`px-4 py-3 text-right ${last12Text}`} style={{ backgroundColor: last12Bg }}>
                                  {item.last12Month ? formatPaidAmount(item.last12Month) : "0"}
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              {!loading && (() => {
                const paidInvoices = data?.["paid-invoices-summary"] || [];
                const filteredPaid = paidInvoices.filter(item =>
                  (customer === "all" || item.customer === customer) &&
                  (branch === "all" || String(item.branch) === String(branch)) &&
                  isCustomerInCategory(item.customer, category) &&
                  (!paidSearch || item.customer.toLowerCase().includes(paidSearch.toLowerCase()))
                );
                const groupedPaidMap = new Map();
                filteredPaid.forEach((item: any) => {
                  if (!groupedPaidMap.has(item.customer)) {
                    groupedPaidMap.set(item.customer, { customer: item.customer, currentMonth: 0, lastMonth: 0, last12Month: 0 });
                  }
                  const curr = groupedPaidMap.get(item.customer);
                  curr.currentMonth += (item.currentMonth || 0);
                  curr.lastMonth += (item.lastMonth || 0);
                  curr.last12Month += (item.last12Month || 0);
                });
                const groupedPaid = Array.from(groupedPaidMap.values());
                const sortedPaid = sortData(groupedPaid, paidSortCol as any, paidSortDir);

                const itemsPerPage = 8;
                const totalPaidPages = Math.ceil(sortedPaid.length / itemsPerPage) || 1;
                const totalPaidAmount = groupedPaid.reduce((sum, item) => sum + (item.last12Month || 0), 0);

                if (sortedPaid.length === 0) return null;

                return (
                  <div className="border-t border-gray-100 dark:border-slate-850 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30 mt-auto">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Grand Total: <span className="text-theme-orange ml-1">{formatPaidAmount(totalPaidAmount)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {(paidPage - 1) * itemsPerPage + 1}-{Math.min(paidPage * itemsPerPage, sortedPaid.length)} / {sortedPaid.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPaidPage(p => Math.max(1, p - 1))}
                          disabled={paidPage === 1}
                          className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          &lt;
                        </button>
                        <button
                          onClick={() => setPaidPage(p => Math.min(totalPaidPages, p + 1))}
                          disabled={paidPage === totalPaidPages}
                          className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          &gt;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>

            {/* Donut Chart: Last 12 month paid invoices amount */}
            <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="px-5 py-4 flex flex-row items-center gap-2.5 flex-shrink-0">
                <Receipt className="w-5 h-5 text-theme-orange" />
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">Last 12 month paid invoices amount <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span></CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0 flex-1 flex flex-col justify-center">
                {loading ? (
                  <div className="flex flex-row items-center justify-center gap-10 p-6 animate-pulse">
                    <div className="w-[180px] h-[180px] rounded-full border-[18px] border-slate-200 dark:border-slate-800 flex items-center justify-center">
                      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="flex-1 space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 h-6">
                          <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (() => {
                  const paidInvoices = data?.["paid-invoices-summary"] || [];
                  const filteredPaid = paidInvoices.filter(item => (customer === "all" || item.customer === customer) && (branch === "all" || String(item.branch) === String(branch)) && isCustomerInCategory(item.customer, category));

                  const groupedPaidMap = new Map();
                  filteredPaid.forEach((item: any) => {
                    if (!groupedPaidMap.has(item.customer)) {
                      groupedPaidMap.set(item.customer, { customer: item.customer, currentMonth: 0, lastMonth: 0, last12Month: 0 });
                    }
                    const curr = groupedPaidMap.get(item.customer);
                    curr.currentMonth += (item.currentMonth || 0);
                    curr.lastMonth += (item.lastMonth || 0);
                    curr.last12Month += (item.last12Month || 0);
                  });
                  const groupedPaid = Array.from(groupedPaidMap.values());

                  if (groupedPaid.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                        No data found
                      </div>
                    );
                  }

                  const sorted = [...groupedPaid].sort((a, b) => b.last12Month - a.last12Month);
                  let donutData = [];
                  if (sorted.length > 7) {
                    donutData = sorted.slice(0, 7);
                    const otherSum = sorted.slice(7).reduce((sum, item) => sum + item.last12Month, 0);
                    donutData.push({ customer: "Lainnya", branch: "all", last12Month: otherSum, currentMonth: 0, lastMonth: 0 });
                  } else {
                    donutData = sorted;
                  }

                  const totalPaidLast12 = groupedPaid.reduce((sum, item) => sum + item.last12Month, 0) || 1;
                  const radius = 70;
                  const circumference = 2 * Math.PI * radius;
                  let accumulatedAngle = 0;

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-6">

                      <div className="relative w-[180px] h-[180px] flex-shrink-0 flex items-center justify-center">
                        <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                          {donutData.map((item, idx) => {
                            const p = item.last12Month / totalPaidLast12;
                            const strokeOffset = circumference - (p * circumference);
                            const angle = accumulatedAngle;
                            accumulatedAngle += p * 360;
                            const isSelected = customer === item.customer;
                            const isAnySelected = customer !== "all";
                            const isMuted = isAnySelected && !isSelected && item.customer !== "Lainnya";

                            return (
                              <circle
                                key={idx}
                                cx="90"
                                cy="90"
                                r={radius}
                                fill="transparent"
                                stroke={`var(--chart-${(idx % 10) + 1})`}
                                strokeWidth="18"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeOffset}
                                transform={`rotate(${angle} 90 90)`}
                                className={`transition-all duration-300 ${isMuted ? "opacity-35" : "opacity-100 hover:stroke-[22px] cursor-pointer"}`}
                                onClick={() => {
                                  if (item.customer !== "Lainnya") {
                                    setCustomer(customer === item.customer ? "all" : item.customer);
                                  }
                                }}
                              />
                            );
                          })}
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent pointer-events-none">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
                          <span className="text-[14px] sm:text-[15px] font-black text-slate-800 dark:text-white mt-0.5" title={formatPaidAmount(totalPaidLast12)}>
                            {totalPaidLast12 >= 1e9 ? (totalPaidLast12 / 1e9).toFixed(1) + "B" : totalPaidLast12 >= 1e6 ? (totalPaidLast12 / 1e6).toFixed(1) + "M" : formatPaidAmount(totalPaidLast12)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5 max-h-[220px] overflow-auto pr-1">
                        {donutData.map((item, idx) => {
                          const p = (item.last12Month / totalPaidLast12) * 100;
                          const isSelected = customer === item.customer;
                          const isAnySelected = customer !== "all";
                          const isMuted = isAnySelected && !isSelected && item.customer !== "Lainnya";

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (item.customer !== "Lainnya") {
                                  setCustomer(customer === item.customer ? "all" : item.customer);
                                }
                              }}
                              className={`flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 rounded-md ${isMuted ? "opacity-35" : "opacity-100"} ${isSelected ? "bg-slate-100/80 dark:bg-slate-800/50" : ""}`}
                            >
                              <span
                                style={{ backgroundColor: `var(--chart-${(idx % 10) + 1})` }}
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/20"
                              ></span>
                              <span className="text-slate-700 dark:text-slate-300 truncate flex-1" title={item.customer}>
                                {item.customer}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 pl-1 text-[10px]">
                                {p.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })()}
              </CardContent>
            </Card>

          </div>

          {/* Bar Chart: Paid vs Unpaid Invoices */}
          <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden p-6 sm:p-8 relative transition-colors duration-300 mt-8 mb-4">
            <CardHeader className="p-0 mb-5 flex flex-row items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-theme-orange" />
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a202c] dark:text-white">
                Paid vs unpaid invoices <span className="text-sm font-normal italic text-slate-500 ml-1 tracking-normal">in home currency</span>
              </h2>
            </CardHeader>
            <CardContent className="p-0 pt-1">
              {loading ? (
                <div className="h-80 w-full bg-slate-50 dark:bg-slate-800/20 rounded-xl animate-pulse flex items-end justify-between p-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-8 bg-slate-200 dark:bg-slate-700" style={{ height: `${20 + i * 5}%` }}></div>
                  ))}
                </div>
              ) : (() => {
                const rawMonthlyData = data?.["paid-vs-unpaid-monthly"] || [];
                const branchFilteredMonthly = rawMonthlyData.filter((item: any) =>
                  (branch === "all" || String(item.branch) === String(branch)) &&
                  (customer === "all" || item.customer === customer) &&
                  isCustomerInCategory(item.customer, category)
                );
                const monthlyMap = new Map();
                branchFilteredMonthly.forEach((item: any) => {
                  const period = item.period;
                  if (!monthlyMap.has(period)) monthlyMap.set(period, { period, paid: 0, unpaid: 0 });
                  monthlyMap.get(period).paid += item.paid;
                  monthlyMap.get(period).unpaid += item.unpaid;
                });
                const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => a.period.localeCompare(b.period));

                if (monthlyData.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                      No data found
                    </div>
                  );
                }

                const maxAmount = Math.max(...monthlyData.map(m => (m.paid || 0) + (m.unpaid || 0)), 10000);

                // Adjusted max for Y axis padding so the top bar isn't touching the edge
                const yAxisTicks = [maxAmount, maxAmount * 0.75, maxAmount * 0.5, maxAmount * 0.25, 0];

                const formatYAxis = (val: number) => {
                  if (val === 0) return "0";
                  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val);
                };

                const formatPeriod = (periodStr: string) => {
                  if (!periodStr || periodStr.length !== 6) return periodStr;
                  const year = periodStr.substring(0, 4);
                  const monthIdx = parseInt(periodStr.substring(4, 6)) - 1;
                  const stdMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                  return `${stdMonths[monthIdx]} ${year}`;
                };

                return (
                  <div className="space-y-8">
                    {/* Legend */}
                    <div className="flex items-center gap-5 text-[13px] font-medium text-[#1a202c] dark:text-slate-300 select-none pl-12">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-3 bg-[#067e9f] shadow-sm"></span>
                        <span>paid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-3 bg-[#e15b49] shadow-sm"></span>
                        <span>unpaid</span>
                      </div>
                    </div>

                    <div className="flex h-[320px] items-stretch gap-4 relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pl-14 pointer-events-none z-0 pb-7">
                        {yAxisTicks.map((_, i) => (
                          <div key={i} className={`w-full ${i === 4 ? 'border-t-2 border-gray-300 dark:border-gray-500' : 'border-t border-gray-100 dark:border-slate-800'}`}></div>
                        ))}
                      </div>

                      {/* Y-Axis Labels */}
                      <div className="flex flex-col justify-between text-[11px] font-medium text-[#4a5568] dark:text-slate-400 pr-2 select-none w-14 z-10 pb-7 -mt-2">
                        {yAxisTicks.map((val, i) => (
                          <span key={i} className="text-right leading-none">{formatYAxis(val)}</span>
                        ))}
                      </div>

                      {/* Bars Container */}
                      <div className="flex-1 flex items-end justify-between z-10 relative pb-7">
                        {monthlyData.map((item, idx) => {
                          const total = (item.paid || 0) + (item.unpaid || 0);
                          const paidPct = total > 0 ? ((item.paid || 0) / total) * 100 : 0;
                          const unpaidPct = total > 0 ? ((item.unpaid || 0) / total) * 100 : 0;
                          const totalHeightPct = (total / maxAmount) * 100;

                          return (
                            <div key={idx} className="flex flex-col items-center flex-1 group min-w-0 h-full relative">

                              <div className="w-full max-w-[36px] sm:max-w-[56px] h-full flex flex-col justify-end relative mx-auto">
                                {total > 0 && (
                                  <div
                                    style={{ height: `${totalHeightPct}%` }}
                                    className="w-full flex flex-col justify-end overflow-hidden transition-all duration-300 hover:brightness-110 cursor-pointer"
                                  >
                                    {item.unpaid > 0 && (
                                      <div
                                        style={{ height: `${unpaidPct}%` }}
                                        className="w-full bg-[#e15b49] border border-[#e15b49]/20"
                                      />
                                    )}
                                    {item.paid > 0 && (
                                      <div
                                        style={{ height: `${paidPct}%` }}
                                        className="w-full bg-[#067e9f] border border-[#067e9f]/20"
                                      />
                                    )}
                                  </div>
                                )}

                                {/* Custom Tooltip on Hover */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-slate-900 text-white rounded p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200 z-30 text-xs w-44 space-y-1.5 border border-slate-700">
                                  <div className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 text-center text-slate-200">
                                    {formatPeriod(item.period)}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 bg-[#067e9f] rounded-sm"></span>
                                      <span className="text-slate-300">Paid:</span>
                                    </div>
                                    <span className="font-medium">{formatPaidAmount(item.paid)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 bg-[#e15b49] rounded-sm"></span>
                                      <span className="text-slate-300">Unpaid:</span>
                                    </div>
                                    <span className="font-medium">{formatPaidAmount(item.unpaid)}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-700 pt-1.5 mt-1.5 font-bold">
                                    <span>Total:</span>
                                    <span>{formatPaidAmount(total)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* X-Axis Label */}
                              <div className="absolute top-[100%] pt-2 w-full text-center">
                                <span className="text-[11px] font-medium text-[#4a5568] dark:text-slate-400 whitespace-nowrap block" title={formatPeriod(item.period)}>
                                  {formatPeriod(item.period)}
                                </span>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Customer Invoices Table */}
          <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px] mt-8 mb-4">
            <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-theme-orange" />
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
                  Customer Invoices <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
                </CardTitle>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari invoice / customer..."
                  value={custInvoicesSearch}
                  onChange={(e) => setCustInvoicesSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-orange transition-all"
                />
              </div>
            </CardHeader>
            <Separator />
            <div className="overflow-auto flex-1 text-slate-800 dark:text-slate-100" style={{ scrollbarGutter: "stable" }}>
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#1A3644] text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
                    {renderSortableHeader("CUSTOMER", "customer", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
                    {renderSortableHeader("INVOICE NO.", "invoiceNo", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
                    {renderSortableHeader("DATE", "date", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
                    {renderSortableHeader("DUE DATE", "dueDate", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
                    {renderSortableHeader("CURRENCY", "currency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
                    {renderSortableHeader("AMOUNT IN CURRENCY", "amountInCurrency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "right")}
                    {renderSortableHeader("AMOUNT IN HOME CURRENCY", "amountInHomeCurrency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "right")}
                    {renderSortableHeader("AMOUNT DUE IN HOME CURRENCY", "amountDueInHomeCurrency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "right")}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse h-11">
                        <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (() => {
                    const allInvoices = data?.["customer-invoices"] || [];
                    const filteredInvoices = allInvoices.filter(item =>
                      (customer === "all" || item.customer === customer) &&
                      isCustomerInCategory(item.customer, category) &&
                      (!custInvoicesSearch ||
                        item.customer.toLowerCase().includes(custInvoicesSearch.toLowerCase()) ||
                        (item.invoiceNo && item.invoiceNo.toLowerCase().includes(custInvoicesSearch.toLowerCase())))
                    );
                    const sortedInvoices = sortData(filteredInvoices, custInvoicesSortCol, custInvoicesSortDir);

                    const itemsPerPage = 8;
                    const paginatedInvoices = sortedInvoices.slice((customerInvoicesPage - 1) * itemsPerPage, customerInvoicesPage * itemsPerPage);

                    if (sortedInvoices.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                            No data found
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <>
                        {paginatedInvoices.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={item.customer}>{item.customer}</td>
                            <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.invoiceNo}</td>
                            <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{formatDate(item.date)}</td>
                            <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{formatDate(item.dueDate)}</td>
                            <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.currency}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{formatAmount(item.amountInCurrency)}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{formatAmount(item.amountInHomeCurrency)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountDueInHomeCurrency)}</td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {!loading && (() => {
              const allInvoices = data?.["customer-invoices"] || [];
              const filteredInvoices = allInvoices.filter(item =>
                (customer === "all" || item.customer === customer) &&
                isCustomerInCategory(item.customer, category) &&
                (!custInvoicesSearch ||
                  item.customer.toLowerCase().includes(custInvoicesSearch.toLowerCase()) ||
                  (item.invoiceNo && item.invoiceNo.toLowerCase().includes(custInvoicesSearch.toLowerCase())))
              );
              const sortedInvoices = sortData(filteredInvoices, custInvoicesSortCol, custInvoicesSortDir);
              const itemsPerPage = 8;
              const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage) || 1;
              const totalAmtHome = sortedInvoices.reduce((sum, item) => sum + (item.amountInHomeCurrency || 0), 0);

              if (sortedInvoices.length === 0) return null;

              return (
                <div className="border-t border-gray-100 dark:border-slate-850 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30 mt-auto">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Grand Total: <span className="text-theme-orange ml-1">{formatAmount(totalAmtHome)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {(customerInvoicesPage - 1) * itemsPerPage + 1}-{Math.min(customerInvoicesPage * itemsPerPage, sortedInvoices.length)} / {sortedInvoices.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCustomerInvoicesPage(p => Math.max(1, p - 1))}
                        disabled={customerInvoicesPage === 1}
                        className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() => setCustomerInvoicesPage(p => Math.min(totalPages, p + 1))}
                        disabled={customerInvoicesPage === totalPages}
                        className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* UMC This Year Table */}
          <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border overflow-hidden flex flex-col h-[500px] mt-8 mb-4 transition-all duration-300 border-gray-200/80 dark:border-slate-800/40 shadow-sm">
            <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-theme-orange" />
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
                  UMC This Year <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
                </CardTitle>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ref nbr / customer..."
                  value={umcSearch}
                  onChange={(e) => setUmcSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-orange transition-all"
                />
              </div>
            </CardHeader>
            <Separator />
            <div className="overflow-auto flex-1 text-slate-800 dark:text-slate-100" style={{ scrollbarGutter: "stable" }}>
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#1A3644] text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
                    {renderSortableHeader("CUSTOMER", "customer", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
                    {renderSortableHeader("REF NBR", "invoiceNo", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
                    {renderSortableHeader("DUE DATE", "dueDate", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
                    {renderSortableHeader("CURRENCY", "currency", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
                    {renderSortableHeader("AMOUNT IN CURRENCY", "amountInCurrency", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "right")}
                    {renderSortableHeader("AMOUNT IN HOME CURRENCY", "amountInHomeCurrency", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "right")}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse h-11">
                        <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (() => {
                    const allUmc = data?.["all-umc-this-year"] || [];
                    const filteredUmc = allUmc.filter(item =>
                      (customer === "all" || item.customer === customer) &&
                      isCustomerInCategory(item.customer, category) &&
                      (!umcSearch ||
                        item.customer.toLowerCase().includes(umcSearch.toLowerCase()) ||
                        (item.invoiceNo && item.invoiceNo.toLowerCase().includes(umcSearch.toLowerCase())))
                    );
                    const sortedUmc = sortData(filteredUmc, umcSortCol, umcSortDir);

                    const itemsPerPage = 8;
                    const paginatedUmc = sortedUmc.slice((umcPage - 1) * itemsPerPage, umcPage * itemsPerPage);

                    if (sortedUmc.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                            No data found
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <>
                        {paginatedUmc.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={item.customer}>{item.customer}</td>
                            <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.invoiceNo}</td>
                            <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{formatDate(item.dueDate)}</td>
                            <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.currency || "-"}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{formatAmount(item.amountInCurrency)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountInHomeCurrency)}</td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {!loading && (() => {
              const allUmc = data?.["all-umc-this-year"] || [];
              const filteredUmc = allUmc.filter(item =>
                (customer === "all" || item.customer === customer) &&
                isCustomerInCategory(item.customer, category) &&
                (!umcSearch ||
                  item.customer.toLowerCase().includes(umcSearch.toLowerCase()) ||
                  (item.invoiceNo && item.invoiceNo.toLowerCase().includes(umcSearch.toLowerCase())))
              );
              const sortedUmc = sortData(filteredUmc, umcSortCol, umcSortDir);
              const itemsPerPage = 8;
              const totalPages = Math.ceil(sortedUmc.length / itemsPerPage) || 1;
              const totalAmountHome = sortedUmc.reduce((sum, item) => sum + (item.amountInHomeCurrency || 0), 0);

              if (sortedUmc.length === 0) return null;

              return (
                <div className="border-t border-gray-100 dark:border-slate-850 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30 mt-auto">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Grand Total: <span className="text-theme-orange ml-1">{formatAmount(totalAmountHome)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {(umcPage - 1) * itemsPerPage + 1}-{Math.min(umcPage * itemsPerPage, sortedUmc.length)} / {sortedUmc.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUmcPage(p => Math.max(1, p - 1))}
                        disabled={umcPage === 1}
                        className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() => setUmcPage(p => Math.min(totalPages, p + 1))}
                        disabled={umcPage === totalPages}
                        className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>

        </div>

      </div>
    </div>
  );
}
