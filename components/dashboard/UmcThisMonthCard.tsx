"use client";

import React, { useState } from "react";
import { Receipt, Search, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, UmcItem, FilterCategory } from "@/types/ar";
import { formatAmount, formatDate, isCustomerInCategory } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";
import { exportToExcel } from "@/lib/excel-export";

interface UmcThisMonthCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  customer: string;
  category: FilterCategory;
}

export function UmcThisMonthCard({
  data,
  loading,
  customer,
  category,
}: UmcThisMonthCardProps) {
  const [umcSearch, setUmcSearch] = useState<string>("");
  const [umcSortCol, setUmcSortCol] = useState<keyof UmcItem>("amountInHomeCurrency");
  const [umcSortDir, setUmcSortDir] = useState<"asc" | "desc">("desc");
  const [umcPage, setUmcPage] = useState<number>(1);

  const allUmc = data?.["all-umc-this-month"] || [];
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
    <Card className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[500px] mt-8 mb-4 transition-all duration-200">
      <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center flex-wrap gap-x-2">
              <span>UMC This Month</span>
              <span className="text-xs font-normal text-muted-foreground/75">(in home currency)</span>
            </CardTitle>
          </div>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportToExcel(sortedUmc, "UMC_This_Month", columnMapping)}
            disabled={loading || sortedUmc.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E3EFE9] hover:bg-[#D3E5DC] text-[#246A4B] dark:bg-[#1f3a2c] dark:text-[#7ed3a6] font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
            title="Export to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Cari ref nbr / customer..."
              value={umcSearch}
              onChange={(e) => {
                setUmcSearch(e.target.value);
                setUmcPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
          </div>
        </div>
      </CardHeader>
      <div className="overflow-auto flex-1 text-foreground" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-secondary/70 dark:bg-secondary/40 border-b border-border text-[10px] uppercase font-semibold tracking-wider h-9 sticky top-0 z-10 backdrop-blur-xs">
              {renderSortableHeader("CUSTOMER", "customer", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
              {renderSortableHeader("REF NBR", "invoiceNo", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
              {renderSortableHeader("DOC DATE", "docDate", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
              {renderSortableHeader("CURRENCY", "currency", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "left")}
              {renderSortableHeader("AMOUNT IN CURRENCY", "amountInCurrency", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "right")}
              {renderSortableHeader("AMOUNT IN HOME CURRENCY", "amountInHomeCurrency", umcSortCol, umcSortDir, (c) => handleToggleSort(c, umcSortCol, umcSortDir, setUmcSortCol, setUmcSortDir), "right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-xs">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-11">
                  <td className="px-4 py-3"><div className="h-3 w-24 bg-secondary/80 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-secondary/80 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-14 bg-secondary/80 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-10 bg-secondary/80 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-secondary/80 rounded ml-auto"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-secondary/80 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : sortedUmc.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedUmc.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-secondary/40 transition-colors h-11"
                >
                  <td className="px-4 py-3 font-medium text-foreground truncate max-w-[200px]" title={item.customer}>
                    {item.customer}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{item.invoiceNo}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{formatDate(item.docDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{item.currency || "-"}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">{formatAmount(item.amountInCurrency)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-foreground">{formatAmount(item.amountInHomeCurrency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {!loading && sortedUmc.length > 0 && (
        <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-secondary/20 mt-auto">
          <div className="font-medium text-muted-foreground">
            Grand Total: <span className="text-primary font-semibold tabular-nums ml-1">{formatAmount(totalAmountHome)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground tabular-nums">
              {(umcPage - 1) * itemsPerPage + 1}-{Math.min(umcPage * itemsPerPage, sortedUmc.length)} / {sortedUmc.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setUmcPage(p => Math.max(1, p - 1))}
                disabled={umcPage === 1}
                className="w-7 h-7 rounded-md border border-border hover:bg-secondary disabled:opacity-30 transition-colors cursor-pointer flex items-center justify-center text-foreground"
              >
                &lt;
              </button>
              <button
                onClick={() => setUmcPage(p => Math.min(totalPages, p + 1))}
                disabled={umcPage === totalPages}
                className="w-7 h-7 rounded-md border border-border hover:bg-secondary disabled:opacity-30 transition-colors cursor-pointer flex items-center justify-center text-foreground"
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
