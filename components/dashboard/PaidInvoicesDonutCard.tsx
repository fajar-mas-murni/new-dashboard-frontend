"use client";

import React from "react";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { formatPaidAmount, isCustomerInCategory } from "@/lib/formatters";

interface PaidInvoicesDonutCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  customer: string;
  category: FilterCategory;
  setCustomer: (cust: string) => void;
}

export function PaidInvoicesDonutCard({
  data,
  loading,
  branch,
  customer,
  category,
  setCustomer,
}: PaidInvoicesDonutCardProps) {
  return (
    <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <CardHeader className="px-5 py-3.5 flex flex-row items-center gap-2.5 flex-shrink-0">
        <Receipt className="w-5 h-5 text-theme-orange" />
        <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-x-1">
          Last 12 month paid invoices amount{" "}
          <span className="text-sm font-normal italic text-slate-500 tracking-normal">
            in home currency
          </span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-row items-center justify-center gap-10 p-6 animate-pulse w-full">
            <div className="w-[180px] h-[180px] rounded-full border-[18px] border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="flex-1 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 h-6">
                  <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (() => {
          const paidInvoices = data?.["paid-invoices-summary"] || [];
          const filteredPaid = paidInvoices.filter(
            (item) =>
              (customer === "all" || item.customer === customer) &&
              (branch === "all" || String(item.branch) === String(branch)) &&
              isCustomerInCategory(item.customer, category)
          );

          const groupedPaidMap = new Map();
          filteredPaid.forEach((item: any) => {
            if (!groupedPaidMap.has(item.customer)) {
              groupedPaidMap.set(item.customer, {
                customer: item.customer,
                currentMonth: 0,
                lastMonth: 0,
                last12Month: 0,
              });
            }
            const curr = groupedPaidMap.get(item.customer);
            curr.currentMonth += item.currentMonth || 0;
            curr.lastMonth += item.lastMonth || 0;
            curr.last12Month += item.last12Month || 0;
          });

          const groupedPaid = Array.from(groupedPaidMap.values());

          if (groupedPaid.length === 0) {
            return (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                No data found
              </div>
            );
          }

          const sorted = [...groupedPaid].sort((a, b) => b.last12Month - a.last12Month);
          let donutData = [];
          if (sorted.length > 7) {
            donutData = sorted.slice(0, 7);
            const otherSum = sorted.slice(7).reduce((sum, item) => sum + item.last12Month, 0);
            donutData.push({
              customer: "Lainnya",
              branch: "all",
              last12Month: otherSum,
              currentMonth: 0,
              lastMonth: 0,
            });
          } else {
            donutData = sorted;
          }

          const totalPaidLast12 = groupedPaid.reduce((sum, item) => sum + item.last12Month, 0) || 1;
          const radius = 70;
          const circumference = 2 * Math.PI * radius;
          let accumulatedAngle = 0;

          return (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 p-6 w-full">
              {/* SVG Donut Chart */}
              <div className="relative w-[180px] h-[180px] flex-shrink-0 flex items-center justify-center">
                <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                  {donutData.map((item, idx) => {
                    const p = item.last12Month / totalPaidLast12;
                    const strokeOffset = circumference - p * circumference;
                    const angle = accumulatedAngle;
                    accumulatedAngle += p * 360;
                    const isSelected = customer === item.customer;
                    const isAnySelected = customer !== "all";
                    const isMuted = isAnySelected && !isSelected && item.customer !== "Lainnya";

                    return (
                      <circle
                        key={idx}
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="transparent"
                        stroke={`var(--chart-${(idx % 10) + 1})`}
                        strokeWidth="18"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        transform={`rotate(${angle} 90 90)`}
                        className={`transition-all duration-300 ${
                          isMuted ? "opacity-35" : "opacity-100 hover:stroke-[22px] cursor-pointer"
                        }`}
                        onClick={() => {
                          if (item.customer !== "Lainnya") {
                            setCustomer(customer === item.customer ? "all" : item.customer);
                          }
                        }}
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent pointer-events-none">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Paid
                  </span>
                  <span
                    className="text-[14px] sm:text-[15px] font-black text-slate-800 dark:text-white mt-0.5"
                    title={formatPaidAmount(totalPaidLast12)}
                  >
                    {totalPaidLast12 >= 1e9
                      ? (totalPaidLast12 / 1e9).toFixed(1) + "B"
                      : totalPaidLast12 >= 1e6
                      ? (totalPaidLast12 / 1e6).toFixed(1) + "M"
                      : formatPaidAmount(totalPaidLast12)}
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-1.5 max-h-[220px] overflow-auto pr-1">
                {donutData.map((item, idx) => {
                  const p = (item.last12Month / totalPaidLast12) * 100;
                  const isSelected = customer === item.customer;
                  const isAnySelected = customer !== "all";
                  const isMuted = isAnySelected && !isSelected && item.customer !== "Lainnya";

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.customer !== "Lainnya") {
                          setCustomer(customer === item.customer ? "all" : item.customer);
                        }
                      }}
                      className={`flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 rounded-md ${
                        isMuted ? "opacity-35" : "opacity-100"
                      } ${isSelected ? "bg-slate-100/80 dark:bg-slate-800/50" : ""}`}
                    >
                      <span
                        style={{ backgroundColor: `var(--chart-${(idx % 10) + 1})` }}
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/20"
                      ></span>
                      <span className="text-slate-700 dark:text-slate-300 truncate flex-1" title={item.customer}>
                        {item.customer}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 pl-1 text-[10px]">
                        {p.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
