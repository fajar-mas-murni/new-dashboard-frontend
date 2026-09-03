"use client";

import React, { useState } from "react";
import { FileText, Search, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { formatPaidAmount, isCustomerInCategory } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";
import { exportToExcel } from "@/lib/excel-export";

interface PaidInvoicesCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  customer: string;
  category: FilterCategory;
  setCustomer: (cust: string) => void;
}

export function PaidInvoicesCard({
  data,
  loading,
  branch,
  customer,
  category,
  setCustomer,
}: PaidInvoicesCardProps) {
  const [paidSearch, setPaidSearch] = useState<string>("");
  const [paidSortCol, setPaidSortCol] = useState<string>("last12Month");
  const [paidSortDir, setPaidSortDir] = useState<"asc" | "desc">("desc");
  const [paidPage, setPaidPage] = useState<number>(1);

  const paidInvoices = data?.["paid-invoices-summary"] || [];
  const filteredPaid = paidInvoices.filter(
    (item) =>
      (customer === "all" || item.customer === customer) &&
      (branch === "all" || String(item.branch) === String(branch)) &&
      isCustomerInCategory(item.customer, category) &&
      (!paidSearch ||
        item.customer.toLowerCase().includes(paidSearch.toLowerCase()) ||
        (item.group && item.group.toLowerCase().includes(paidSearch.toLowerCase())) ||
        (item.branch && item.branch.toLowerCase().includes(paidSearch.toLowerCase())))
  );

  const groupedPaidMap = new Map();
  filteredPaid.forEach((item: any) => {
    const key = `${item.customer}|${item.group || ""}|${item.branch || ""}`;
    if (!groupedPaidMap.has(key)) {
      groupedPaidMap.set(key, {
        customer: item.customer,
        group: item.group || "-",
        branch: item.branch || "-",
        currentMonth: 0,
        lastMonth: 0,
        last12Month: 0,
      });
    }
    const curr = groupedPaidMap.get(key);
    curr.currentMonth += item.currentMonth || 0;
    curr.lastMonth += item.lastMonth || 0;
    curr.last12Month += item.last12Month || 0;
  });

  const groupedPaid = Array.from(groupedPaidMap.values());
  const sortedPaid = sortData(groupedPaid, paidSortCol as any, paidSortDir);

  const itemsPerPage = 8;
  const totalPaidPages = Math.ceil(sortedPaid.length / itemsPerPage) || 1;
  const paginatedPaid = sortedPaid.slice((paidPage - 1) * itemsPerPage, paidPage * itemsPerPage);
  const totalPaidAmount = groupedPaid.reduce((sum, item) => sum + (item.last12Month || 0), 0);

  const maxCurrentMonth = Math.max(...groupedPaid.map((item: any) => item.currentMonth), 1);
  const maxLastMonth = Math.max(...groupedPaid.map((item: any) => item.lastMonth), 1);
  const maxLast12Month = Math.max(...groupedPaid.map((item: any) => item.last12Month), 1);

  const columnMapping = {
    customer: "Customer",
    branch: "Branch",
    group: "Group",
    currentMonth: "Current Month",
    lastMonth: "Last Month",
    last12Month: "Last 12 Month",
  };

  return (
    <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-theme-orange" />
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
            Paid invoices by customer{" "}
            <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportToExcel(sortedPaid, "Paid_Invoices_By_Customer", columnMapping)}
            disabled={loading || sortedPaid.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
            title="Export to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <div className="relative w-full sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari customer / group / branch..."
              value={paidSearch}
              onChange={(e) => {
                setPaidSearch(e.target.value);
                setPaidPage(1);
              }}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-orange transition-all"
            />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <div className="overflow-auto flex-1 text-slate-800 dark:text-slate-100" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-theme-brown text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
              {renderSortableHeader("Customer", "customer", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "left")}
              {renderSortableHeader("Branch", "branch", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "left")}
              {renderSortableHeader("Group", "group", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "left")}
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
                  <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : sortedPaid.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedPaid.map((item: any, idx: number) => {
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
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11 ${
                      isCurrentSelected ? "bg-theme-orange/10 dark:bg-theme-orange/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={item.customer}>
                      {item.customer}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={item.branch}>
                      {item.branch || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={item.group}>
                      {item.group || "-"}
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {!loading && sortedPaid.length > 0 && (
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
      )}
    </Card>
  );
}
