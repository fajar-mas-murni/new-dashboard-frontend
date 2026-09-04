"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Search, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, CustomerInvoice, FilterCategory } from "@/types/ar";
import { formatAmount, formatDate, isCustomerInCategory } from "@/lib/formatters";
import { sortData, handleToggleSort, renderSortableHeader } from "@/lib/table-utils";
import { exportToExcel } from "@/lib/excel-export";

interface CustomerInvoicesCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  customer: string;
  category: FilterCategory;
}

export function CustomerInvoicesCard({
  data,
  loading,
  customer,
  category,
}: CustomerInvoicesCardProps) {
  const [custInvoicesSearch, setCustInvoicesSearch] = useState<string>("");
  const [custInvoicesSortCol, setCustInvoicesSortCol] = useState<keyof CustomerInvoice>("amountDueInHomeCurrency");
  const [custInvoicesSortDir, setCustInvoicesSortDir] = useState<"asc" | "desc">("desc");
  const [customerInvoicesPage, setCustomerInvoicesPage] = useState<number>(1);

  const allInvoices = data?.["customer-invoices"] || [];
  const filteredInvoices = allInvoices.filter(
    (item) =>
      (customer === "all" || item.customer === customer) &&
      isCustomerInCategory(item.customer, category) &&
      (!custInvoicesSearch ||
        item.customer.toLowerCase().includes(custInvoicesSearch.toLowerCase()) ||
        (item.invoiceNo && item.invoiceNo.toLowerCase().includes(custInvoicesSearch.toLowerCase())))
  );

  const sortedInvoices = sortData(filteredInvoices, custInvoicesSortCol, custInvoicesSortDir);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = sortedInvoices.slice(
    (customerInvoicesPage - 1) * itemsPerPage,
    customerInvoicesPage * itemsPerPage
  );
  const totalAmtHome = sortedInvoices.reduce((sum, item) => sum + (item.amountInHomeCurrency || 0), 0);

  const columnMapping = {
    customer: "Customer",
    invoiceNo: "Invoice No",
    date: "Date",
    dueDate: "Due Date",
    currency: "Currency",
    amountInCurrency: "Amount in Currency",
    amountInHomeCurrency: "Amount in Home Currency",
    amountDueInHomeCurrency: "Amount Due in Home Currency",
  };

  return (
    <Card className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col h-[500px] transition-colors mt-6 mb-4">
      <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FEF3D6] dark:bg-[#332A15] text-[#B47818] dark:text-[#FCD34D] border border-[#F9E5B5] dark:border-[#52411E] flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-bold text-foreground flex items-center flex-wrap gap-x-2">
            <span>Customer Invoices</span>
            <span className="text-xs font-normal text-muted-foreground tracking-normal">home currency</span>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportToExcel(sortedInvoices, "Customer_Invoices", columnMapping)}
            disabled={loading || sortedInvoices.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E3EFE9] hover:bg-[#D4E8DC] dark:bg-[#1C2C24] dark:hover:bg-[#23382D] text-[#246A4B] dark:text-[#86EFAC] border border-[#C5DFD2] dark:border-[#2D4D3D] font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
            title="Export to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari invoice / customer..."
              value={custInvoicesSearch}
              onChange={(e) => {
                setCustInvoicesSearch(e.target.value);
                setCustomerInvoicesPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <div className="overflow-auto flex-1 text-foreground" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-secondary/70 dark:bg-secondary/40 border-b border-border text-[10px] uppercase font-semibold tracking-wider h-9 sticky top-0 z-10 backdrop-blur-xs">
              {renderSortableHeader("CUSTOMER", "customer", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
              {renderSortableHeader("INVOICE NO.", "invoiceNo", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
              {renderSortableHeader("DATE", "date", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
              {renderSortableHeader("DUE DATE", "dueDate", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
              {renderSortableHeader("CURRENCY", "currency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "left")}
              {renderSortableHeader("AMOUNT IN CURRENCY", "amountInCurrency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "right")}
              {renderSortableHeader("AMOUNT IN HOME CURRENCY", "amountInHomeCurrency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "right")}
              {renderSortableHeader("AMOUNT DUE IN HOME CURRENCY", "amountDueInHomeCurrency", custInvoicesSortCol, custInvoicesSortDir, (c) => handleToggleSort(c, custInvoicesSortCol, custInvoicesSortDir, setCustInvoicesSortCol, setCustInvoicesSortDir), "right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-10">
                  <td className="px-4 py-2.5"><div className="h-3 w-24 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-14 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-14 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-10 bg-muted rounded"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded ml-auto"></div></td>
                  <td className="px-4 py-2.5"><div className="h-3 w-16 bg-muted rounded ml-auto"></div></td>
                </tr>
              ))
            ) : sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-secondary/60 transition-colors h-10"
                >
                  <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[150px]" title={item.customer}>
                    {item.customer}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-muted-foreground">{item.invoiceNo}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.date)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.dueDate)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{item.currency}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatAmount(item.amountInCurrency)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatAmount(item.amountInHomeCurrency)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">{formatAmount(item.amountDueInHomeCurrency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {!loading && sortedInvoices.length > 0 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs bg-muted/30 mt-auto">
          <div className="font-medium text-muted-foreground">
            Grand Total: <span className="font-bold text-foreground ml-1 tabular-nums">{formatAmount(totalAmtHome)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px]">
              {(customerInvoicesPage - 1) * itemsPerPage + 1}-{Math.min(customerInvoicesPage * itemsPerPage, sortedInvoices.length)} / {sortedInvoices.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCustomerInvoicesPage(p => Math.max(1, p - 1))}
                disabled={customerInvoicesPage === 1}
                className="px-2 py-0.5 rounded border border-border hover:bg-secondary disabled:opacity-40 transition-colors cursor-pointer"
              >
                &lt;
              </button>
              <button
                onClick={() => setCustomerInvoicesPage(p => Math.min(totalPages, p + 1))}
                disabled={customerInvoicesPage === totalPages}
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
