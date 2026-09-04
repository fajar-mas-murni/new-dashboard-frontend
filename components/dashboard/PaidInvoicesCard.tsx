"use client";

import React, { useState } from "react";
import { FileText, Search, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { formatPaidAmount, isCustomerInCategory, isGroupMatch } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";
import { exportToExcel } from "@/lib/excel-export";

interface PaidInvoicesCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  group: string;
  customer: string;
  category: FilterCategory;
  setCustomer: (cust: string) => void;
}

export function PaidInvoicesCard({
  data,
  loading,
  branch,
  group,
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
      isGroupMatch(item.group, group) &&
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
    <Card className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col h-[500px] transition-colors">
      <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EAE9F8] dark:bg-[#25203A] text-[#6355A5] dark:text-[#C4B5FD] border border-[#D7D5F3] dark:border-[#3D345E] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground flex items-center flex-wrap gap-x-2">
            <span>Paid Invoices by Customer</span>
            <span className="text-xs font-normal text-muted-foreground tracking-normal">home currency</span>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportToExcel(sortedPaid, "Paid_Invoices_By_Customer", columnMapping)}
            disabled={loading || sortedPaid.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E3EFE9] hover:bg-[#D4E8DC] dark:bg-[#1C2C24] dark:hover:bg-[#23382D] text-[#246A4B] dark:text-[#86EFAC] border border-[#C5DFD2] dark:border-[#2D4D3D] font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
            title="Export to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari customer / group / branch..."
              value={paidSearch}
              onChange={(e) => {
                setPaidSearch(e.target.value);
                setPaidPage(1);
              }}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <div className="overflow-auto flex-1 text-foreground" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-secondary/70 dark:bg-secondary/40 border-b border-border text-[10px] uppercase font-semibold tracking-wider h-9 sticky top-0 z-10 backdrop-blur-xs">
              {renderSortableHeader("Customer", "customer", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "left")}
              {renderSortableHeader("Branch", "branch", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "left")}
              {renderSortableHeader("Group", "group", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "left")}
              {renderSortableHeader("Current Month", "currentMonth", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "right")}
              {renderSortableHeader("Last Month", "lastMonth", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "right")}
              {renderSortableHeader("Last 12 Month", "last12Month", paidSortCol, paidSortDir, (c) => handleToggleSort(c, paidSortCol, paidSortDir, setPaidSortCol, setPaidSortDir), "right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-10">
                  <td className="px-4 py-2.5"><div className="h-3 w-32 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-14 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-20 bg-muted rounded ml-auto"></div></td>
                </tr>
              ))
            ) : sortedPaid.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedPaid.map((item: any, idx: number) => {
                const isCurrentSelected = customer === item.customer;

                const currentBg = item.currentMonth > 0
                  ? `rgba(131, 188, 169, ${Math.min(0.35, Math.max(0.08, (item.currentMonth / maxCurrentMonth) * 0.35))})`
                  : "transparent";

                const lastBg = item.lastMonth > 0
                  ? `rgba(131, 188, 169, ${Math.min(0.35, Math.max(0.08, (item.lastMonth / maxLastMonth) * 0.35))})`
                  : "transparent";

                const last12Bg = item.last12Month > 0
                  ? `rgba(231, 139, 120, ${Math.min(0.35, Math.max(0.08, (item.last12Month / maxLast12Month) * 0.35))})`
                  : "transparent";

                return (
                  <tr
                    key={idx}
                    onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                    className={`hover:bg-secondary/60 cursor-pointer transition-colors h-10 ${
                      isCurrentSelected ? "bg-primary/10 dark:bg-primary/15 font-semibold" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[180px]" title={item.customer}>
                      {item.customer}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[100px]" title={item.branch}>
                      {item.branch || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[100px]" title={item.group}>
                      {item.group || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground/90 font-medium" style={{ backgroundColor: currentBg }}>
                      {item.currentMonth ? formatPaidAmount(item.currentMonth) : "0"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground/90 font-medium" style={{ backgroundColor: lastBg }}>
                      {item.lastMonth ? formatPaidAmount(item.lastMonth) : "0"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground" style={{ backgroundColor: last12Bg }}>
                      {item.last12Month ? formatPaidAmount(item.last12Month) : "0"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Pagination */}
      {!loading && sortedPaid.length > 0 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs bg-muted/30 mt-auto">
          <div className="font-medium text-muted-foreground">
            Grand Total: <span className="font-bold text-foreground ml-1 tabular-nums">{formatPaidAmount(totalPaidAmount)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px]">
              {(paidPage - 1) * itemsPerPage + 1}-{Math.min(paidPage * itemsPerPage, sortedPaid.length)} / {sortedPaid.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaidPage((p) => Math.max(1, p - 1))}
                disabled={paidPage === 1}
                className="px-2 py-0.5 rounded border border-border hover:bg-secondary disabled:opacity-40 transition-colors cursor-pointer"
              >
                &lt;
              </button>
              <button
                onClick={() => setPaidPage((p) => Math.min(totalPaidPages, p + 1))}
                disabled={paidPage === totalPaidPages}
                className="px-2 py-0.5 rounded border border-border hover:bg-secondary disabled:opacity-40 transition-colors cursor-pointer"
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
