"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden relative transition-colors duration-300 mt-6 mb-4">
      <CardHeader className="px-6 py-4 flex flex-row items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#E3EFE9] dark:bg-[#1C2C24] text-[#246A4B] dark:text-[#86EFAC] border border-[#C5DFD2] dark:border-[#2D4D3D] flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <CardTitle className="text-base font-bold text-foreground flex items-center flex-wrap gap-x-2">
          <span>Paid vs Unpaid Invoices</span>
          <span className="text-xs font-normal text-muted-foreground tracking-normal">home currency</span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-6">
        {loading ? (
          <div className="h-80 w-full bg-secondary/30 rounded-xl animate-pulse flex items-end justify-between p-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-8 bg-muted" style={{ height: `${20 + i * 5}%` }}></div>
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
              <div className="text-center py-12 text-muted-foreground font-medium">
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
            <div className="space-y-6">
              {/* Legend */}
              <div className="flex items-center gap-6 text-xs font-medium text-foreground select-none pl-14">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#83BCA9]"></span>
                  <span className="text-muted-foreground">Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#E78B78]"></span>
                  <span className="text-muted-foreground">Unpaid</span>
                </div>
              </div>

              <div className="flex h-[320px] items-stretch gap-4 relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pl-14 pointer-events-none z-0 pb-7">
                  {yAxisTicks.map((_, i) => (
                    <div
                      key={i}
                      className={`w-full ${i === 4 ? "border-t border-border" : "border-t border-border/40"}`}
                    ></div>
                  ))}
                </div>

                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-[10px] font-medium text-muted-foreground pr-2 select-none w-14 z-10 pb-7 -mt-2 tabular-nums">
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
                        <div className="w-full max-w-[32px] sm:max-w-[48px] h-full flex flex-col justify-end relative mx-auto">
                          {total > 0 && (
                            <div
                              style={{ height: `${totalHeightPct}%` }}
                              className="w-full flex flex-col justify-end rounded-t-md overflow-hidden transition-all duration-300 hover:brightness-105 cursor-pointer shadow-2xs"
                            >
                              {item.unpaid > 0 && (
                                <div
                                  style={{ height: `${unpaidPct}%` }}
                                  className="w-full bg-[#E78B78] transition-all"
                                />
                              )}
                              {item.paid > 0 && (
                                <div
                                  style={{ height: `${paidPct}%` }}
                                  className="w-full bg-[#83BCA9] transition-all"
                                />
                              )}
                            </div>
                          )}

                          {/* Custom Tooltip on Hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-card text-foreground rounded-xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200 z-30 text-xs w-48 space-y-1.5 border border-border">
                            <div className="font-bold border-b border-border pb-1.5 mb-1.5 text-center text-foreground">
                              {formatPeriod(item.period)}
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-[#83BCA9] rounded-xs"></span>
                                <span className="text-muted-foreground">Paid:</span>
                              </div>
                              <span className="font-medium tabular-nums">{formatPaidAmount(item.paid)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-[#E78B78] rounded-xs"></span>
                                <span className="text-muted-foreground">Unpaid:</span>
                              </div>
                              <span className="font-medium tabular-nums">{formatPaidAmount(item.unpaid)}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-1.5 mt-1.5 font-bold text-foreground text-[11px]">
                              <span>Total:</span>
                              <span className="tabular-nums">{formatPaidAmount(total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* X-Axis Label */}
                        <div className="absolute top-[100%] pt-2 w-full text-center">
                          <span
                            className="text-[10px] font-medium text-muted-foreground whitespace-nowrap block truncate"
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
