"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Search, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, CustomerSummary, FilterCategory } from "@/types/ar";
import { formatAmount, isCustomerInCategory, isGroupMatch } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";
import { exportToExcel } from "@/lib/excel-export";

interface SummaryCustomersCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  group: string;
  customer: string;
  category: FilterCategory;
  setCustomer: (cust: string) => void;
}

export function SummaryCustomersCard({
  data,
  loading,
  branch,
  group,
  customer,
  category,
  setCustomer,
}: SummaryCustomersCardProps) {
  const [summarySearch, setSummarySearch] = useState<string>("");
  const [summarySortCol, setSummarySortCol] = useState<keyof CustomerSummary>("amountDue");
  const [summarySortDir, setSummarySortDir] = useState<"asc" | "desc">("desc");
  const [summaryModalPage, setSummaryModalPage] = useState<number>(1);

  const summaryCustomers = data?.["summary-customer"] || [];
  const filteredSummaryBase = summaryCustomers.filter(
    (item) =>
      (customer === "all" || item.customer === customer) &&
      (branch === "all" || String(item.branch) === String(branch)) &&
      isGroupMatch(item.group, group) &&
      isCustomerInCategory(item.customer, category)
  );

  const sortedSummary = sortData(filteredSummaryBase, summarySortCol, summarySortDir);
  const top10Summary = sortedSummary.slice(0, 10);
  const totalSummaryAmountDue = filteredSummaryBase.reduce((sum, item) => sum + (item.amountDue || 0), 0);

  const filteredSummaryModal = filteredSummaryBase.filter(
    (item) =>
      !summarySearch ||
      item.customer.toLowerCase().includes(summarySearch.toLowerCase()) ||
      (item.group && item.group.toLowerCase().includes(summarySearch.toLowerCase())) ||
      (item.branch && item.branch.toLowerCase().includes(summarySearch.toLowerCase()))
  );
  const sortedSummaryModal = sortData(filteredSummaryModal, summarySortCol, summarySortDir);

  const itemsPerPageModal = 10;
  const totalSummaryPagesModal = Math.ceil(sortedSummaryModal.length / itemsPerPageModal) || 1;
  const paginatedSummaryModal = sortedSummaryModal.slice(
    (summaryModalPage - 1) * itemsPerPageModal,
    summaryModalPage * itemsPerPageModal
  );

  const columnMapping = {
    customer: "Customer",
    branch: "Branch",
    group: "Group",
    current: "Current",
    "1-30": "1-30",
    "31-60": "31-60",
    "61-90": "61-90",
    "91-180": "91-180",
    over180: "Over 180",
    amountDue: "Amount Due",
  };

  return (
    <Card className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col h-[500px] transition-colors">
      <CardHeader className="px-5 py-3.5 flex flex-row items-center justify-between gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E3EDF7] dark:bg-[#1E293B] text-[#2B6CB0] dark:text-[#93C5FD] border border-[#CBDCEE] dark:border-[#334155] flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground flex items-center flex-wrap gap-x-2">
            <span>Summary Customers (Top 10)</span>
            <span className="text-xs font-normal text-muted-foreground tracking-normal">home currency</span>
          </CardTitle>
        </div>
        <button
          onClick={() => exportToExcel(sortedSummary, "Summary_Customers", columnMapping)}
          disabled={loading || sortedSummary.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E3EFE9] hover:bg-[#D4E8DC] dark:bg-[#1C2C24] dark:hover:bg-[#23382D] text-[#246A4B] dark:text-[#86EFAC] border border-[#C5DFD2] dark:border-[#2D4D3D] font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
          title="Export to Excel"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Excel</span>
        </button>
      </CardHeader>
      <Separator />
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-secondary/70 dark:bg-secondary/40 border-b border-border text-[10px] uppercase font-semibold tracking-wider h-9 sticky top-0 z-10 backdrop-blur-xs">
              {renderSortableHeader("Customer", "customer", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
              {renderSortableHeader("Branch", "branch", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
              {renderSortableHeader("Group", "group", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
              {renderSortableHeader("Current", "current", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
              {renderSortableHeader("1-30", "1-30", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
              {renderSortableHeader("31-60", "31-60", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
              {renderSortableHeader("61-90", "61-90", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
              {renderSortableHeader("91-180", "91-180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
              {renderSortableHeader("Over 180", "over180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
              {renderSortableHeader("Amount Due", "amountDue", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-10">
                  <td className="px-4 py-2.5"><div className="h-3 w-24 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-14 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-12 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-12 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-12 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-12 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-12 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-12 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded ml-auto"></div></td>
                </tr>
              ))
            ) : top10Summary.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              top10Summary.map((item, idx) => (
                <tr
                  key={idx}
                  onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                  className={`hover:bg-secondary/60 cursor-pointer transition-colors h-10 ${
                    customer === item.customer ? "bg-primary/10 dark:bg-primary/15 font-semibold" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[120px]" title={item.customer}>
                    {item.customer}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[100px]" title={item.branch}>
                    {item.branch || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[100px]" title={item.group}>
                    {item.group || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {item.current ? formatAmount(item.current) : "0"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {item["1-30"] ? formatAmount(item["1-30"]) : "0"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {item["31-60"] ? formatAmount(item["31-60"]) : "0"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {item["61-90"] ? formatAmount(item["61-90"]) : "0"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {item["91-180"] ? formatAmount(item["91-180"]) : "0"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {item["over180"] ? formatAmount(item["over180"]) : "0"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">
                    {formatAmount(item.amountDue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Modal */}
      {!loading && filteredSummaryBase.length > 0 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs bg-muted/30 mt-auto">
          <Dialog>
            <DialogTrigger className="cursor-pointer group flex items-center gap-2 hover:text-primary transition-colors">
              <div className="font-medium text-muted-foreground">
                Grand Total: <span className="font-bold text-foreground ml-1 tabular-nums">{formatAmount(totalSummaryAmountDue)}</span>
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                Lihat Detail
              </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] lg:max-w-6xl w-full max-h-[88vh] flex flex-col bg-card border border-border rounded-2xl p-0 overflow-hidden z-[70]">
              <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-14 sm:pr-16">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  Detail Summary Customers <span className="text-xs font-normal text-muted-foreground tracking-normal">home currency</span>
                </DialogTitle>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari customer / group / branch..."
                      value={summarySearch}
                      onChange={(e) => {
                        setSummarySearch(e.target.value);
                        setSummaryModalPage(1);
                      }}
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <button
                    onClick={() => exportToExcel(filteredSummaryModal, "Detail_Summary_Customers", columnMapping)}
                    disabled={filteredSummaryModal.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E3EFE9] hover:bg-[#D4E8DC] dark:bg-[#1C2C24] dark:hover:bg-[#23382D] text-[#246A4B] dark:text-[#86EFAC] border border-[#C5DFD2] dark:border-[#2D4D3D] font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                    title="Export All to Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                </div>
              </DialogHeader>
              <div className="overflow-auto flex-1 p-0">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-secondary/70 dark:bg-secondary/40 border-b border-border text-[10px] uppercase font-semibold tracking-wider h-9 sticky top-0 z-10 backdrop-blur-xs">
                      {renderSortableHeader("Customer", "customer", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
                      {renderSortableHeader("Branch", "branch", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
                      {renderSortableHeader("Group", "group", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "left")}
                      {renderSortableHeader("Current", "current", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                      {renderSortableHeader("1-30", "1-30", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                      {renderSortableHeader("31-60", "31-60", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                      {renderSortableHeader("61-90", "61-90", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                      {renderSortableHeader("91-180", "91-180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                      {renderSortableHeader("Over 180", "over180", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                      {renderSortableHeader("Amount Due", "amountDue", summarySortCol, summarySortDir, (c) => handleToggleSort(c, summarySortCol, summarySortDir, setSummarySortCol, setSummarySortDir), "right")}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {paginatedSummaryModal.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground font-medium">
                          No customer data found
                        </td>
                      </tr>
                    ) : (
                      paginatedSummaryModal.map((item, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                          className={`hover:bg-secondary/60 cursor-pointer transition-colors h-10 ${
                            customer === item.customer ? "bg-primary/10 dark:bg-primary/15 font-semibold" : ""
                          }`}
                        >
                          <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[200px]" title={item.customer}>
                            {item.customer}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[120px]" title={item.branch}>
                            {item.branch || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[120px]" title={item.group}>
                            {item.group || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {item.current ? formatAmount(item.current) : "0"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {item["1-30"] ? formatAmount(item["1-30"]) : "0"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {item["31-60"] ? formatAmount(item["31-60"]) : "0"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {item["61-90"] ? formatAmount(item["61-90"]) : "0"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {item["91-180"] ? formatAmount(item["91-180"]) : "0"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {item["over180"] ? formatAmount(item["over180"]) : "0"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">
                            {formatAmount(item.amountDue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs bg-muted/30 flex-shrink-0">
                <span className="text-muted-foreground">
                  Showing {(summaryModalPage - 1) * itemsPerPageModal + 1} to{" "}
                  {Math.min(summaryModalPage * itemsPerPageModal, filteredSummaryModal.length)} of {filteredSummaryModal.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSummaryModalPage((p) => Math.max(1, p - 1))}
                    disabled={summaryModalPage === 1}
                    className="px-2.5 py-1 rounded-md border border-border bg-secondary text-secondary-foreground text-xs disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="font-semibold text-foreground">
                    {summaryModalPage} / {totalSummaryPagesModal}
                  </span>
                  <button
                    onClick={() => setSummaryModalPage((p) => Math.min(totalSummaryPagesModal, p + 1))}
                    disabled={summaryModalPage >= totalSummaryPagesModal}
                    className="px-2.5 py-1 rounded-md border border-border bg-secondary text-secondary-foreground text-xs disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <span className="text-muted-foreground text-[11px] font-medium">Top 10 Displayed</span>
        </div>
      )}
    </Card>
  );
}
