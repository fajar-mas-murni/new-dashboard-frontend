"use client";

import React, { useState } from "react";
import { Receipt, Search, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, UmcItem, FilterCategory } from "@/types/ar";
import { formatAmount, formatDate, isCustomerInCategory } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";
import { exportToExcel } from "@/lib/excel-export";

interface UmcThisYearCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  customer: string;
  category: FilterCategory;
}

export function UmcThisYearCard({
  data,
  loading,
  customer,
  category,
}: UmcThisYearCardProps) {
  const [umcSearch, setUmcSearch] = useState<string>("");
  const [umcSortCol, setUmcSortCol] = useState<keyof UmcItem>("amountInHomeCurrency");
  const [umcSortDir, setUmcSortDir] = useState<"asc" | "desc">("desc");
  const [umcPage, setUmcPage] = useState<number>(1);

  const allUmc = data?.["all-umc-this-year"] || [];
  const filteredUmc = allUmc.filter(
    (item) =>
      (customer === "all" || item.customer === customer) &&
      isCustomerInCategory(item.customer, category) &&
      (!umcSearch ||
        item.customer.toLowerCase().includes(umcSearch.toLowerCase()) ||
        (item.invoiceNo && item.invoiceNo.toLowerCase().includes(umcSearch.toLowerCase())))
  );

  const sortedUmc = sortData(filteredUmc, umcSortCol, umcSortDir);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedUmc.length / itemsPerPage) || 1;
  const paginatedUmc = sortedUmc.slice((umcPage - 1) * itemsPerPage, umcPage * itemsPerPage);
  const totalAmountHome = sortedUmc.reduce((sum, item) => sum + (item.amountInHomeCurrency || 0), 0);

  const columnMapping = {
    customer: "Customer",
    invoiceNo: "Ref Nbr",
    docDate: "Doc Date",
    currency: "Currency",
    amountInCurrency: "Amount in Currency",
    amountInHomeCurrency: "Amount in Home Currency",
  };

  return (
    <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border overflow-hidden flex flex-col h-[500px] mt-8 mb-4 transition-all duration-300 border-gray-200/80 dark:border-slate-800/40 shadow-sm">
      <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-theme-orange" />
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
            UMC This Year{" "}
            <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportToExcel(sortedUmc, "UMC_This_Year", columnMapping)}
            disabled={loading || sortedUmc.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
            title="Export to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ref nbr / customer..."
              value={umcSearch}
              onChange={(e) => {
                setUmcSearch(e.target.value);
                setUmcPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-theme-orange transition-all"
            />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <div className="overflow-auto flex-1 text-slate-800 dark:text-slate-100" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-[#1A3644] text-white text-[10px] uppercase font-bold tracking-wider h-10 sticky top-0 z-10">
              {renderSortableHeader("CUSTOMER", "customer", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
              {renderSortableHeader("REF NBR", "invoiceNo", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
              {renderSortableHeader("DOC DATE", "docDate", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
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
            ) : sortedUmc.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedUmc.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11"
                >
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={item.customer}>
                    {item.customer}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.invoiceNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{formatDate(item.docDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.currency || "-"}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{formatAmount(item.amountInCurrency)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountInHomeCurrency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {!loading && sortedUmc.length > 0 && (
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
      )}
    </Card>
  );
}
