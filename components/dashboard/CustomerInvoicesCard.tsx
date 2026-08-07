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
    <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px] mt-8 mb-4">
      <CardHeader className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-theme-orange" />
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
            Customer Invoices{" "}
            <span className="text-sm font-normal italic text-slate-500 tracking-normal">in home currency</span>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportToExcel(sortedInvoices, "Customer_Invoices", columnMapping)}
            disabled={loading || sortedInvoices.length === 0}
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
              placeholder="Cari invoice / customer..."
              value={custInvoicesSearch}
              onChange={(e) => {
                setCustInvoicesSearch(e.target.value);
                setCustomerInvoicesPage(1);
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
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 text-xs">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse h-11">
                  <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 font-medium h-[352px]">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors even:bg-slate-50/30 dark:even:bg-slate-800/5 h-11"
                >
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={item.customer}>
                    {item.customer}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.invoiceNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{formatDate(item.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{formatDate(item.dueDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-650 dark:text-slate-350">{item.currency}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{formatAmount(item.amountInCurrency)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-650 dark:text-slate-350">{formatAmount(item.amountInHomeCurrency)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatAmount(item.amountDueInHomeCurrency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {!loading && sortedInvoices.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-850 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/30 mt-auto">
          <div className="font-bold text-slate-700 dark:text-slate-300">
            Grand Total: <span className="text-theme-orange ml-1">{formatAmount(totalAmtHome)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              {(customerInvoicesPage - 1) * itemsPerPage + 1}-{Math.min(customerInvoicesPage * itemsPerPage, sortedInvoices.length)} / {sortedInvoices.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCustomerInvoicesPage(p => Math.max(1, p - 1))}
                disabled={customerInvoicesPage === 1}
                className="p-1 rounded border border-gray-255 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                &lt;
              </button>
              <button
                onClick={() => setCustomerInvoicesPage(p => Math.min(totalPages, p + 1))}
                disabled={customerInvoicesPage === totalPages}
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
