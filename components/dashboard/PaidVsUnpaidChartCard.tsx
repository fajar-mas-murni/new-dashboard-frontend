"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { formatPaidAmount, formatPeriod, isCustomerInCategory, isGroupMatch } from "@/lib/formatters";

interface PaidVsUnpaidChartCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  group: string;
  customer: string;
  category: FilterCategory;
}

export function PaidVsUnpaidChartCard({
  data,
  loading,
  branch,
  group,
  customer,
  category,
}: PaidVsUnpaidChartCardProps) {
  return (
    <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden relative transition-colors duration-300 mt-8 mb-4">
      <CardHeader className="p-6 flex flex-row items-center gap-2.5">
        <BarChart3 className="w-6 h-6 text-theme-orange" />
        <h2 className="text-xl sm:text-2xl font-bold text-[#1a202c] dark:text-white">
          Paid vs unpaid invoices <span className="text-sm font-normal italic text-slate-500 ml-1 tracking-normal">in home currency</span>
        </h2>
      </CardHeader>
      <Separator />
      <CardContent className="p-6">
        {loading ? (
          <div className="h-80 w-full bg-slate-50 dark:bg-slate-800/20 rounded-xl animate-pulse flex items-end justify-between p-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-8 bg-slate-200 dark:bg-slate-700" style={{ height: `${20 + i * 5}%` }}></div>
            ))}
          </div>
        ) : (() => {
          const rawMonthlyData = data?.["paid-vs-unpaid-monthly"] || [];
          const branchFilteredMonthly = rawMonthlyData.filter(
            (item: any) =>
              (branch === "all" || String(item.branch) === String(branch)) &&
              isGroupMatch(item.group, group) &&
              (customer === "all" || item.customer === customer) &&
              isCustomerInCategory(item.customer, category)
          );
          const monthlyMap = new Map();
          branchFilteredMonthly.forEach((item: any) => {
            const period = item.period;
            if (!monthlyMap.has(period)) monthlyMap.set(period, { period, paid: 0, unpaid: 0 });
            monthlyMap.get(period).paid += item.paid;
            monthlyMap.get(period).unpaid += item.unpaid;
          });
          const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => a.period.localeCompare(b.period));

          if (monthlyData.length === 0) {
            return (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                No data found
              </div>
            );
          }

          const maxAmount = Math.max(...monthlyData.map(m => (m.paid || 0) + (m.unpaid || 0)), 10000);
          const yAxisTicks = [maxAmount, maxAmount * 0.75, maxAmount * 0.5, maxAmount * 0.25, 0];

          const formatYAxis = (val: number) => {
            if (val === 0) return "0";
            return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val);
          };

          return (
            <div className="space-y-8">
              {/* Legend */}
              <div className="flex items-center gap-5 text-[13px] font-medium text-[#1a202c] dark:text-slate-300 select-none pl-12">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-3 bg-[#067e9f] shadow-sm"></span>
                  <span>paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-3 bg-[#e15b49] shadow-sm"></span>
                  <span>unpaid</span>
                </div>
              </div>

              <div className="flex h-[320px] items-stretch gap-4 relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pl-14 pointer-events-none z-0 pb-7">
                  {yAxisTicks.map((_, i) => (
                    <div
                      key={i}
                      className={`w-full ${i === 4 ? "border-t-2 border-gray-300 dark:border-gray-500" : "border-t border-gray-100 dark:border-slate-800"
                        }`}
                    ></div>
                  ))}
                </div>

                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-[11px] font-medium text-[#4a5568] dark:text-slate-400 pr-2 select-none w-14 z-10 pb-7 -mt-2">
                  {yAxisTicks.map((val, i) => (
                    <span key={i} className="text-right leading-none">
                      {formatYAxis(val)}
                    </span>
                  ))}
                </div>

                {/* Bars Container */}
                <div className="flex-1 flex items-end justify-between z-10 relative pb-7">
                  {monthlyData.map((item, idx) => {
                    const total = (item.paid || 0) + (item.unpaid || 0);
                    const paidPct = total > 0 ? ((item.paid || 0) / total) * 100 : 0;
                    const unpaidPct = total > 0 ? ((item.unpaid || 0) / total) * 100 : 0;
                    const totalHeightPct = (total / maxAmount) * 100;

                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 group min-w-0 h-full relative">
                        <div className="w-full max-w-[36px] sm:max-w-[56px] h-full flex flex-col justify-end relative mx-auto">
                          {total > 0 && (
                            <div
                              style={{ height: `${totalHeightPct}%` }}
                              className="w-full flex flex-col justify-end overflow-hidden transition-all duration-300 hover:brightness-110 cursor-pointer"
                            >
                              {item.unpaid > 0 && (
                                <div
                                  style={{ height: `${unpaidPct}%` }}
                                  className="w-full bg-[#e15b49] border border-[#e15b49]/20"
                                />
                              )}
                              {item.paid > 0 && (
                                <div
                                  style={{ height: `${paidPct}%` }}
                                  className="w-full bg-[#067e9f] border border-[#067e9f]/20"
                                />
                              )}
                            </div>
                          )}

                          {/* Custom Tooltip on Hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-slate-900 text-white rounded p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200 z-30 text-xs w-44 space-y-1.5 border border-slate-700">
                            <div className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 text-center text-slate-200">
                              {formatPeriod(item.period)}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-[#067e9f] rounded-sm"></span>
                                <span className="text-slate-300">Paid:</span>
                              </div>
                              <span className="font-medium">{formatPaidAmount(item.paid)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-[#e15b49] rounded-sm"></span>
                                <span className="text-slate-300">Unpaid:</span>
                              </div>
                              <span className="font-medium">{formatPaidAmount(item.unpaid)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700 pt-1.5 mt-1.5 font-bold">
                              <span>Total:</span>
                              <span>{formatPaidAmount(total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* X-Axis Label */}
                        <div className="absolute top-[100%] pt-2 w-full text-center">
                          <span
                            className="text-[11px] font-medium text-[#4a5568] dark:text-slate-400 whitespace-nowrap block"
                            title={formatPeriod(item.period)}
                          >
                            {formatPeriod(item.period)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
