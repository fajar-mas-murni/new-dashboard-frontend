"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { isCustomerInCategory, isGroupMatch } from "@/lib/formatters";

interface UnpaidAmountByCustomerCardProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  group: string;
  customer: string;
  category: FilterCategory;
  setCustomer: (cust: string) => void;
}

export function UnpaidAmountByCustomerCard({
  data,
  loading,
  branch,
  group,
  customer,
  category,
  setCustomer,
}: UnpaidAmountByCustomerCardProps) {
  if (loading) {
    return (
      <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 p-6 shadow-sm relative overflow-hidden transition-colors duration-300 animate-pulse mt-8 mb-4">
        <CardHeader className="p-0 mb-6">
          <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </CardHeader>
        <Separator className="opacity-50" />
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            <div className="flex-1 space-y-4 pr-0 lg:pr-8 pb-6 lg:pb-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto flex-shrink-0"></div>
                  <div className="flex-1 h-5.5 bg-slate-100 dark:bg-slate-800/50 rounded-md"></div>
                </div>
              ))}
            </div>
            <div className="w-full lg:w-[540px] flex flex-row items-center justify-center gap-10 pl-0 lg:pl-8">
              <div className="w-[200px] h-[200px] rounded-full border-[18px] border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-3.5 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-6 w-8 bg-slate-300 dark:bg-slate-800 rounded mt-0.5"></div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 h-6">
                    <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md flex-1"></div>
                    <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rawTop = data?.["top-10-unpaid-customers"] || [];
  const branchFilteredTop = rawTop.filter(
    (item: any) =>
      (branch === "all" || String(item.branch) === String(branch)) &&
      isGroupMatch(item.group, group) &&
      isCustomerInCategory(item.customer, category)
  );

  const topMap = new Map();
  branchFilteredTop.forEach((item: any) => {
    const cust = item.customer;
    if (topMap.has(cust)) topMap.set(cust, topMap.get(cust) + item.amount);
    else topMap.set(cust, item.amount);
  });

  const aggregatedTop10 = Array.from(topMap.entries())
    .map(([cust, amount]) => ({ customer: cust, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const filteredTop10 = aggregatedTop10.filter(
    (item) => customer === "all" || item.customer === customer
  );

  if (filteredTop10.length === 0) return null;

  return (
    <Card className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-gray-200/80 dark:border-slate-800/40 shadow-sm overflow-hidden relative transition-colors duration-300">
      <CardHeader className="p-6 flex flex-row items-center gap-2.5">
        <CardTitle className="text-xl font-bold flex items-center gap-2.5">
          <BarChart3 className="w-5.5 h-5.5 text-theme-orange" />
          <span className="flex items-center flex-wrap gap-x-1">
            Unpaid invoices amount by customer (Top 10){" "}
            <span className="text-sm font-normal italic text-slate-500 tracking-normal">
              in home currency
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-8 items-stretch p-2 sm:p-6">
          {/* Left Column: Horizontal Bar Chart */}
          <div className="flex-1 flex flex-col justify-between pr-0 lg:pr-8 pb-6 lg:pb-0">
            <div className="space-y-3.5">
              {filteredTop10.map((item, idx) => {
                const maxVal = filteredTop10[0]?.amount || 1;
                const pct = (item.amount / maxVal) * 100;
                const isMuted = customer !== "all" && customer !== item.customer;

                return (
                  <div
                    key={idx}
                    onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                    className={`flex items-center gap-3 cursor-pointer group transition-all duration-300 ${isMuted ? "opacity-30 scale-[0.98]" : "opacity-100"
                      }`}
                  >
                    <div
                      className="w-28 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 truncate group-hover:text-theme-orange transition-colors"
                      title={item.customer}
                    >
                      {item.customer}
                    </div>
                    <div className="flex-1 h-5.5 bg-slate-100 dark:bg-slate-800/50 rounded-md overflow-hidden relative flex items-center shadow-inner">
                      <div
                        style={{
                          width: `${pct}%`,
                          backgroundColor: `var(--chart-${(idx % 10) + 1})`,
                        }}
                        className="h-full rounded-r-md transition-all duration-500 group-hover:brightness-110 shadow-sm"
                      ></div>
                      <span className="absolute left-2.5 text-[9px] font-bold text-white drop-shadow-sm">
                        {new Intl.NumberFormat("id-ID").format(item.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Donut Chart & Legend */}
          <div className="w-full lg:w-[540px] flex flex-row items-center justify-center gap-10 pl-0 lg:pl-8">
            {(() => {
              const totalUnpaidTop10 = filteredTop10.reduce((sum, item) => sum + item.amount, 0) || 1;
              const radius = 75;
              const circumference = 2 * Math.PI * radius;
              let accumulatedAngle = 0;

              return (
                <>
                  {/* SVG Donut Chart */}
                  <div className="relative w-[200px] h-[200px] flex-shrink-0 flex items-center justify-center">
                    <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                      {filteredTop10.map((item, idx) => {
                        const p = item.amount / totalUnpaidTop10;
                        const strokeOffset = circumference - p * circumference;
                        const angle = accumulatedAngle;
                        accumulatedAngle += p * 360;
                        const isSelected = customer === item.customer;
                        const isAnySelected = customer !== "all";
                        const isMuted = isAnySelected && !isSelected;

                        return (
                          <circle
                            key={idx}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="transparent"
                            stroke={`var(--chart-${(idx % 10) + 1})`}
                            strokeWidth={isSelected ? "22" : "18"}
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeOffset}
                            transform={`rotate(${angle} 100 100)`}
                            strokeLinecap="round"
                            className={`transition-all duration-300 cursor-pointer ${isMuted ? "opacity-30" : "opacity-100"
                              }`}
                            onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Top 10
                      </span>
                      <span className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-0.5">
                        AR
                      </span>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="flex-1 space-y-2 max-h-[250px] overflow-y-auto pr-1 select-none">
                    {filteredTop10.map((item, idx) => {
                      const p = (item.amount / totalUnpaidTop10) * 100;
                      const isSelected = customer === item.customer;
                      const isAnySelected = customer !== "all";
                      const isMuted = isAnySelected && !isSelected;

                      return (
                        <div
                          key={idx}
                          onClick={() => setCustomer(customer === item.customer ? "all" : item.customer)}
                          className={`flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 rounded-md ${isMuted ? "opacity-35" : "opacity-100"
                            } ${isSelected ? "bg-slate-100/80 dark:bg-slate-800/50" : ""}`}
                        >
                          <span
                            style={{ backgroundColor: `var(--chart-${(idx % 10) + 1})` }}
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                          ></span>
                          <span className="text-slate-700 dark:text-slate-300 truncate flex-1" title={item.customer}>
                            {item.customer}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 pl-1">{p.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
