"use client";

import React, { useState } from "react";
import { Receipt, Search, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, UnpaidInvoice, FilterCategory } from "@/types/ar";
import { formatAmount, formatDate, isCustomerInCategory, isGroupMatch } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";
import { exportToExcel } from "@/lib/excel-export";

interface UnpaidInvoicesCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  group: string;
  customer: string;
  category: FilterCategory;
  setCustomer: (cust: string) => void;
}

export function UnpaidInvoicesCard({
  data,
  loading,
  branch,
  group,
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
      isGroupMatch(item.group, group) &&
      isCustomerInCategory(item.customer, category)
  );

  const sortedUnpaid = sortData(filteredUnpaidBase, unpaidSortCol, unpaidSortDir);
  const top10Unpaid = sortedUnpaid.slice(0, 10);
  const totalUnpaidAmountDue = filteredUnpaidBase.reduce((sum, item) => sum + (item.amountDue || 0), 0);

  const filteredUnpaidModal = filteredUnpaidBase.filter(
    (item) =>
      !unpaidSearch ||
      item.customer.toLowerCase().includes(unpaidSearch.toLowerCase()) ||
      (item.group && item.group.toLowerCase().includes(unpaidSearch.toLowerCase())) ||
      (item.branch && item.branch.toLowerCase().includes(unpaidSearch.toLowerCase())) ||
      (item.number && item.number.toLowerCase().includes(unpaidSearch.toLowerCase()))
  );
  const sortedUnpaidModal = sortData(filteredUnpaidModal, unpaidSortCol, unpaidSortDir);

  const itemsPerPageModal = 10;
  const totalUnpaidPagesModal = Math.ceil(sortedUnpaidModal.length / itemsPerPageModal) || 1;
  const paginatedUnpaidModal = sortedUnpaidModal.slice(
    (unpaidModalPage - 1) * itemsPerPageModal,
    unpaidModalPage * itemsPerPageModal
  );

  const columnMapping = {
    customer: "Customer",
    branch: "Branch",
    group: "Group",
    number: "Invoice Number",
    date: "Date",
    dueDate: "Due Date",
    amountDue: "Amount Due",
  };

  return (
    <Card className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col h-[500px] transition-colors">
      <CardHeader className="px-5 py-3.5 flex flex-row items-center justify-between gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FEF3D6] dark:bg-[#332A15] text-[#B47818] dark:text-[#FCD34D] border border-[#F9E5B5] dark:border-[#52411E] flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground flex items-center flex-wrap gap-x-2">
            <span>Unpaid Invoices (Top 10)</span>
            <span className="text-xs font-normal text-muted-foreground tracking-normal">home currency</span>
          </CardTitle>
        </div>
        <button
          onClick={() => exportToExcel(sortedUnpaid, "Unpaid_Invoices", columnMapping)}
          disabled={loading || sortedUnpaid.length === 0}
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
              {renderSortableHeader("Customer", "customer", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
              {renderSortableHeader("Branch", "branch", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
              {renderSortableHeader("Group", "group", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
              {renderSortableHeader("Number", "number", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
              {renderSortableHeader("Date", "date", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
              {renderSortableHeader("Due Date", "dueDate", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
              {renderSortableHeader("Amount Due", "amountDue", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-10">
                  <td className="px-4 py-2.5"><div className="h-3 w-24 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-14 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-14 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-14 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded ml-auto"></div></td>
                </tr>
              ))
            ) : top10Unpaid.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              top10Unpaid.map((item, idx) => (
                <tr
                  key={idx}
                  onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                  className={`hover:bg-secondary/60 cursor-pointer transition-colors h-10 ${
                    customer === item.customer ? "bg-primary/10 dark:bg-primary/15 font-semibold" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[150px]" title={item.customer}>
                    {item.customer}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[100px]" title={item.branch}>
                    {item.branch || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[100px]" title={item.group}>
                    {item.group || "-"}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-muted-foreground">{item.number}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.date)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.dueDate)}</td>
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
      {!loading && filteredUnpaidBase.length > 0 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs bg-muted/30 mt-auto">
          <Dialog>
            <DialogTrigger className="cursor-pointer group flex items-center gap-2 hover:text-primary transition-colors">
              <div className="font-medium text-muted-foreground">
                Grand Total: <span className="font-bold text-foreground ml-1 tabular-nums">{formatAmount(totalUnpaidAmountDue)}</span>
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                Lihat Detail
              </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] lg:max-w-6xl w-full max-h-[88vh] flex flex-col bg-card border border-border rounded-2xl p-0 overflow-hidden z-[70]">
              <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-14 sm:pr-16">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Detail Unpaid Invoices <span className="text-xs font-normal text-muted-foreground tracking-normal">home currency</span>
                </DialogTitle>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari invoice / customer / branch..."
                      value={unpaidSearch}
                      onChange={(e) => {
                        setUnpaidSearch(e.target.value);
                        setUnpaidModalPage(1);
                      }}
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <button
                    onClick={() => exportToExcel(filteredUnpaidModal, "Detail_Unpaid_Invoices", columnMapping)}
                    disabled={filteredUnpaidModal.length === 0}
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
                      {renderSortableHeader("Customer", "customer", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                      {renderSortableHeader("Branch", "branch", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                      {renderSortableHeader("Group", "group", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                      {renderSortableHeader("Number", "number", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                      {renderSortableHeader("Date", "date", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                      {renderSortableHeader("Due Date", "dueDate", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "left")}
                      {renderSortableHeader("Amount Due", "amountDue", unpaidSortCol, unpaidSortDir, (c) => handleToggleSort(c, unpaidSortCol, unpaidSortDir, setUnpaidSortCol, setUnpaidSortDir), "right")}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {paginatedUnpaidModal.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground font-medium">
                          No unpaid invoice data found
                        </td>
                      </tr>
                    ) : (
                      paginatedUnpaidModal.map((item, idx) => (
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
                          <td className="px-4 py-2.5 font-medium text-muted-foreground">{item.number}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.date)}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.dueDate)}</td>
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
                  Showing {(unpaidModalPage - 1) * itemsPerPageModal + 1} to{" "}
                  {Math.min(unpaidModalPage * itemsPerPageModal, filteredUnpaidModal.length)} of {filteredUnpaidModal.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUnpaidModalPage((p) => Math.max(1, p - 1))}
                    disabled={unpaidModalPage === 1}
                    className="px-2.5 py-1 rounded-md border border-border bg-secondary text-secondary-foreground text-xs disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="font-semibold text-foreground">
                    {unpaidModalPage} / {totalUnpaidPagesModal}
                  </span>
                  <button
                    onClick={() => setUnpaidModalPage((p) => Math.min(totalUnpaidPagesModal, p + 1))}
                    disabled={unpaidModalPage >= totalUnpaidPagesModal}
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
