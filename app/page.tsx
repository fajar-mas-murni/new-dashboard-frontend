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
import { UmcThisMonthCard } from "@/components/dashboard/UmcThisMonthCard";

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
    group,
    setGroup,
    groupList,
    refetch,
  } = useArData();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono antialiased transition-colors duration-300">
      {/* Global Top Navbar - Minimalist Frosted Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card/85 backdrop-blur-md px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-bold tracking-tight text-foreground uppercase">
                Dashboard
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                Finance
              </span>
            </div>
            <nav className="flex items-center gap-1.5">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground border border-border/60 shadow-xs cursor-pointer">
                Account Receivable
              </button>
              <button className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                Revenue
              </button>
              <button className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                Account Payable
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="hidden sm:inline">Live Mode</span>
          </div>
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
          group={group}
          setGroup={setGroup}
          groupList={groupList}
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
          group={group}
          customer={customer}
          category={category}
        />

        {/* Unpaid Invoices Amount by Customer (Top 10 Chart Card) */}
        <UnpaidAmountByCustomerCard
          data={data}
          loading={loading}
          branch={branch}
          group={group}
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
            group={group}
            customer={customer}
            category={category}
            setCustomer={setCustomer}
          />
          <UnpaidInvoicesCard
            data={data}
            loading={loading}
            branch={branch}
            group={group}
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
            group={group}
            customer={customer}
            category={category}
            setCustomer={setCustomer}
          />
          <PaidInvoicesDonutCard
            data={data}
            loading={loading}
            branch={branch}
            group={group}
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
          group={group}
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

        {/* UMC This Month Datatable */}
        <UmcThisMonthCard
          data={data}
          loading={loading}
          customer={customer}
          category={category}
        />
      </div>
    </div>
  );
}
