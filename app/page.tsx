"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { useArData } from "@/hooks/use-ar-data";
import { FilterHeader } from "@/components/dashboard/FilterHeader";
import { KpiCardsSection } from "@/components/dashboard/KpiCardsSection";
import { UnpaidAmountByCustomerCard } from "@/components/dashboard/UnpaidAmountByCustomerCard";
import { PaidVsUnpaidChartCard } from "@/components/dashboard/PaidVsUnpaidChartCard";
import { SummaryCustomersCard } from "@/components/dashboard/SummaryCustomersCard";
import { UnpaidInvoicesCard } from "@/components/dashboard/UnpaidInvoicesCard";
import { PaidInvoicesCard } from "@/components/dashboard/PaidInvoicesCard";
import { PaidInvoicesDonutCard } from "@/components/dashboard/PaidInvoicesDonutCard";
import { CustomerInvoicesCard } from "@/components/dashboard/CustomerInvoicesCard";
import { UmcThisYearCard } from "@/components/dashboard/UmcThisYearCard";

export default function Page() {
  const {
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
    refetch,
  } = useArData();

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
        {/* Filter & Action Header */}
        <FilterHeader
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          category={category}
          setCategory={setCategory}
          customer={customer}
          setCustomer={setCustomer}
          branch={branch}
          setBranch={setBranch}
          loading={loading}
          mounted={mounted}
          onRefresh={refetch}
        />

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        )}

        {/* Top 4 KPI Metrics Cards */}
        <KpiCardsSection
          data={data}
          loading={loading}
          branch={branch}
          customer={customer}
          category={category}
        />

        {/* Unpaid Invoices Amount by Customer (Top 10 Chart Card) */}
        <UnpaidAmountByCustomerCard
          data={data}
          loading={loading}
          branch={branch}
          customer={customer}
          category={category}
          setCustomer={setCustomer}
        />

        {/* Summary Customers & Unpaid Invoices Top 10 Datatables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SummaryCustomersCard
            data={data}
            loading={loading}
            branch={branch}
            customer={customer}
            category={category}
            setCustomer={setCustomer}
          />
          <UnpaidInvoicesCard
            data={data}
            loading={loading}
            branch={branch}
            customer={customer}
            category={category}
            setCustomer={setCustomer}
          />
        </div>

        {/* Paid Invoices Datatable & Donut Chart Side-by-Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PaidInvoicesCard
            data={data}
            loading={loading}
            branch={branch}
            customer={customer}
            category={category}
            setCustomer={setCustomer}
          />
          <PaidInvoicesDonutCard
            data={data}
            loading={loading}
            branch={branch}
            customer={customer}
            category={category}
            setCustomer={setCustomer}
          />
        </div>

        {/* Paid vs Unpaid Monthly Bar Chart */}
        <PaidVsUnpaidChartCard
          data={data}
          loading={loading}
          branch={branch}
          customer={customer}
          category={category}
        />

        {/* Customer Invoices Full Datatable */}
        <CustomerInvoicesCard
          data={data}
          loading={loading}
          customer={customer}
          category={category}
        />

        {/* UMC This Year Datatable */}
        <UmcThisYearCard
          data={data}
          loading={loading}
          customer={customer}
          category={category}
        />
      </div>
    </div>
  );
}
