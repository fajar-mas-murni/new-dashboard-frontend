"use client";

import React from "react";
import { FileText, Clock, Calendar, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { formatAmount, isCustomerInCategory } from "@/lib/formatters";

interface KpiCardsSectionProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  customer: string;
  category: FilterCategory;
}

export function KpiCardsSection({
  data,
  loading,
  branch,
  customer,
  category,
}: KpiCardsSectionProps) {
  const rawSummary = data?.summary || [];
  const branchFilteredSummary = rawSummary.filter(
    (item: any) =>
      (branch === "all" || String(item.branch) === String(branch)) &&
      (customer === "all" || item.customer === customer) &&
      isCustomerInCategory(item.customer, category)
  );

  const currentSummary = branchFilteredSummary.reduce(
    (acc: any, curr: any) => ({
      "unpaid-invoice": acc["unpaid-invoice"] + (curr["unpaid-invoice"] || 0),
      "overdue-amount": acc["overdue-amount"] + (curr["overdue-amount"] || 0),
      "overdue-30-plus": acc["overdue-30-plus"] + (curr["overdue-30-plus"] || 0),
      "overdue-90-plus": acc["overdue-90-plus"] + (curr["overdue-90-plus"] || 0),
    }),
    { "unpaid-invoice": 0, "overdue-amount": 0, "overdue-30-plus": 0, "overdue-90-plus": 0 }
  );

  const isFiltered = branch !== "all" || customer !== "all" || category !== "all";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Unpaid Invoices Amount */}
      <Card
        className={`bg-white/95 dark:bg-slate-900/95 rounded-2xl border p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden ${
          isFiltered ? "border-theme-orange/40 ring-1 ring-theme-orange/20" : "border-gray-200/80 dark:border-slate-800/40"
        }`}
      >
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-yellow to-theme-amber rounded-r-full"></div>
        <div className="flex-shrink-0 p-3 bg-theme-yellow/10 dark:bg-theme-yellow/5 border border-theme-yellow/20 dark:border-theme-yellow/10 rounded-xl">
          <FileText className="w-5.5 h-5.5 text-theme-amber dark:text-theme-yellow" strokeWidth={2.2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center justify-between">
            <span>Unpaid Invoices Amount</span>
            {isFiltered && (
              <span className="text-[9px] bg-theme-orange/10 text-theme-orange border border-theme-orange/20 rounded px-1.5 py-0.2 font-bold lowercase">
                filtered
              </span>
            )}
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
      <Card
        className={`bg-white/95 dark:bg-slate-900/95 rounded-2xl border p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden ${
          isFiltered ? "border-theme-orange/40 ring-1 ring-theme-orange/20" : "border-gray-200/80 dark:border-slate-800/40"
        }`}
      >
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-amber to-theme-orange rounded-r-full"></div>
        <div className="flex-shrink-0 p-3 bg-theme-orange/10 dark:bg-theme-orange/5 border border-theme-orange/20 dark:border-theme-orange/10 rounded-xl">
          <Clock className="w-5.5 h-5.5 text-theme-orange dark:text-theme-amber" strokeWidth={2.2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center justify-between">
            <span>Overdue Amount</span>
            {isFiltered && (
              <span className="text-[9px] bg-theme-orange/10 text-theme-orange border border-theme-orange/20 rounded px-1.5 py-0.2 font-bold lowercase">
                filtered
              </span>
            )}
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

      {/* Card 3: Overdue 30+ Days */}
      <Card
        className={`bg-white/95 dark:bg-slate-900/95 rounded-2xl border p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden ${
          isFiltered ? "border-theme-orange/40 ring-1 ring-theme-orange/20" : "border-gray-200/80 dark:border-slate-800/40"
        }`}
      >
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-orange to-theme-red rounded-r-full"></div>
        <div className="flex-shrink-0 p-3 bg-theme-red/10 dark:bg-theme-red/5 border border-theme-red/20 dark:border-theme-red/10 rounded-xl">
          <Calendar className="w-5.5 h-5.5 text-theme-red dark:text-theme-orange" strokeWidth={2.2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center justify-between">
            <span>Overdue 30+ Days</span>
            {isFiltered && (
              <span className="text-[9px] bg-theme-orange/10 text-theme-orange border border-theme-orange/20 rounded px-1.5 py-0.2 font-bold lowercase">
                filtered
              </span>
            )}
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

      {/* Card 4: Overdue 90+ Days */}
      <Card
        className={`bg-white/95 dark:bg-slate-900/95 rounded-2xl border p-5 flex flex-row items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative ring-0 py-5 overflow-hidden ${
          isFiltered ? "border-theme-orange/40 ring-1 ring-theme-orange/20" : "border-gray-200/80 dark:border-slate-800/40"
        }`}
      >
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-theme-red to-theme-brown rounded-r-full"></div>
        <div className="flex-shrink-0 p-3 bg-theme-brown/10 dark:bg-theme-brown/5 border border-theme-brown/20 dark:border-theme-brown/10 rounded-xl">
          <CalendarDays className="w-5.5 h-5.5 text-theme-brown dark:text-theme-red" strokeWidth={2.2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center justify-between">
            <span>Overdue 90+ Days</span>
            {isFiltered && (
              <span className="text-[9px] bg-theme-orange/10 text-theme-orange border border-theme-orange/20 rounded px-1.5 py-0.2 font-bold lowercase">
                filtered
              </span>
            )}
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
  );
}
