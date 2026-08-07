"use client";

import React, { useState } from "react";
import { Receipt, Search } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, UnpaidInvoice, FilterCategory } from "@/types/ar";
import { formatAmount, formatDate, isCustomerInCategory } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";

interface UnpaidInvoicesCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  customer: string;
  category: FilterCategory;
  setCustomer: (cust: string) => void;
}

export function UnpaidInvoicesCard({
  data,
  loading,
  branch,
  customer,
  category,
  setCustomer,
}: UnpaidInvoicesCardProps) {
  const [unpaidSearch, setUnpaidSearch] = useState<string>("");
  const [unpaidSortCol, setUnpaidSortCol] = useState<keyof UnpaidInvoice>("amountDue");
  const [unpaidSortDir, setUnpaidSortDir] = useState<"asc" | "desc">("desc");
  const [unpaidModalPage, setUnpaidModalPage] = useState<number>(1);

  const unpaidInvoices = data?.["summary-unpaid"] || [];
  const filteredUnpaidBase = unpaidInvoices.filter(
    (item) =>
      (customer === "all" || item.customer === customer) &&
      (branch === "all" || String(item.branch) === String(branch)) &&
      isCustomerInCategory(item.customer, category)
  );

  const sortedUnpaid = sortData(filteredUnpaidBase, unpaidSortCol, unpaidSortDir);
  const top10Unpaid = sortedUnpaid.slice(0, 10);
  const totalUnpaidAmountDue = filteredUnpaidBase.reduce((sum, item) => sum + (item.amountDue || 0), 0);

  const filteredUnpaidModal = filteredUnpaidBase.filter(
    (item) =>
      !unpaidSearch ||
      item.customer.toLowerCase().includes(unpaidSearch.toLowerCase()) ||
      (item.number && item.number.toLowerCase().includes(unpaidSearch.toLowerCase()))
  );
  const sortedUnpaidModal = sortData(filteredUnpaidModal, unpaidSortCol, unpaidSortDir);

  const itemsPerPageModal = 10;
  const totalUnpaidPagesModal = Math.ceil(sortedUnpaidModal.length / itemsPerPageModal) || 1;
  const paginatedUnpaidModal = sortedUnpaidModal.slice(
    (unpaidModalPage - 1) * itemsPerPageModal,
    unpaidModalPage * itemsPerPageModal
  );

  return (
    <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <CardHeader className="px-5 py-4 flex flex-row items-center justify-between gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-theme-orange" />
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
            Unpaid Invoices (Top 10){" "}
            <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
          </CardTitle>
        </div>
      </CardHeader>
      <Separator />
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[#1A3644] text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
              {renderSortableHeader(
                "Customer",
                "customer",
                unpaidSortCol,
                unpaidSortDir,
                (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir),
                "left"
              )}
              {renderSortableHeader(
                "Number",
                "number",
                unpaidSortCol,
                unpaidSortDir,
                (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir),
                "left"
              )}
              {renderSortableHeader(
                "Date",
                "date",
                unpaidSortCol,
                unpaidSortDir,
                (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir),
                "left"
              )}
              {renderSortableHeader(
                "Due Date",
                "dueDate",
                unpaidSortCol,
                unpaidSortDir,
                (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir),
                "left"
              )}
              {renderSortableHeader(
                "Amount Due",
                "amountDue",
                unpaidSortCol,
                unpaidSortDir,
                (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir),
                "right"
              )}
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
            ) : top10Unpaid.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              top10Unpaid.map((item, idx) => (
                <tr
                  key={idx}
                  onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11 ${customer === item.customer ? "bg-theme-orange/10 dark:bg-theme-orange/5" : ""
                    }`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={item.customer}>
                    {item.customer}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">{item.number}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-450">{formatDate(item.date)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-450">{formatDate(item.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">
                    {formatAmount(item.amountDue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Modal */}
      {!loading && filteredUnpaidBase.length > 0 && (
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
              <DialogHeader className="p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-14 sm:pr-16">
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
              <div className="overflow-auto flex-1">
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
      )}
    </Card>
  );
}
