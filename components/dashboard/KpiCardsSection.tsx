"use client";

import React from "react";
import { FileText, Clock, Calendar, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArSummaryResponse, FilterCategory } from "@/types/ar";
import { formatAmount, isCustomerInCategory, isGroupMatch } from "@/lib/formatters";

interface KpiCardsSectionProps {
  data: ArSummaryResponse | null;
  loading: boolean;
  branch: string;
  group: string;
  customer: string;
  category: FilterCategory;
}

export function KpiCardsSection({
  data,
  loading,
  branch,
  group,
  customer,
  category,
}: KpiCardsSectionProps) {
  const rawSummary = data?.summary || [];
  const branchFilteredSummary = rawSummary.filter(
    (item: any) =>
      (branch === "all" || String(item.branch) === String(branch)) &&
      isGroupMatch(item.group, group) &&
      (customer === "all" || item.customer === customer) &&
      isCustomerInCategory(item.customer, category)
  );

  const currentSummary = branchFilteredSummary.reduce(
    (acc: any, curr: any) => ({
      "unpaid-invoice": acc["unpaid-invoice"] + (curr["unpaid-invoice"] || 0),
      "overdue-amount": acc["overdue-amount"] + (curr["overdue-amount"] || 0),
      "overdue-30-plus": acc["overdue-30-plus"] + (curr["overdue-30-plus"] || 0),
      "overdue-90-plus": acc["overdue-90-plus"] + (curr["overdue-90-plus"] || 0),
    }),
    { "unpaid-invoice": 0, "overdue-amount": 0, "overdue-30-plus": 0, "overdue-90-plus": 0 }
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Unpaid Invoices Amount */}
      <Card className="bg-card rounded-2xl border border-border/80 p-5 flex flex-row items-center gap-4 shadow-xs hover:border-primary/30 hover:shadow-sm transition-all duration-200 relative overflow-hidden">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FEF3D6] dark:bg-[#332A15] text-[#B47818] dark:text-[#FCD34D] border border-[#F9E5B5] dark:border-[#52411E] flex items-center justify-center">
          <FileText className="w-5 h-5" strokeWidth={2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Unpaid Invoices
          </p>
          <div
            className="text-sm sm:text-base 2xl:text-[17px] font-bold text-foreground mt-0.5 tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis"
            title={formatAmount(currentSummary["unpaid-invoice"] || 0)}
          >
            {loading ? (
              <div className="h-6 w-24 bg-muted rounded-md animate-pulse mt-1" />
            ) : (
              formatAmount(currentSummary["unpaid-invoice"] || 0)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Overdue Amount */}
      <Card className="bg-card rounded-2xl border border-border/80 p-5 flex flex-row items-center gap-4 shadow-xs hover:border-primary/30 hover:shadow-sm transition-all duration-200 relative overflow-hidden">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FDE8DF] dark:bg-[#361E17] text-[#D86A46] dark:text-[#FDBA74] border border-[#F8D2C3] dark:border-[#572B20] flex items-center justify-center">
          <Clock className="w-5 h-5" strokeWidth={2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Overdue Amount
          </p>
          <div
            className="text-sm sm:text-base 2xl:text-[17px] font-bold text-foreground mt-0.5 tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis"
            title={formatAmount(currentSummary["overdue-amount"] || 0)}
          >
            {loading ? (
              <div className="h-6 w-24 bg-muted rounded-md animate-pulse mt-1" />
            ) : (
              formatAmount(currentSummary["overdue-amount"] || 0)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Overdue 30+ Days */}
      <Card className="bg-card rounded-2xl border border-border/80 p-5 flex flex-row items-center gap-4 shadow-xs hover:border-primary/30 hover:shadow-sm transition-all duration-200 relative overflow-hidden">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FCE7EC] dark:bg-[#351720] text-[#C84C6F] dark:text-[#F472B6] border border-[#F7CFD9] dark:border-[#54212F] flex items-center justify-center">
          <Calendar className="w-5 h-5" strokeWidth={2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Overdue 30+ Days
          </p>
          <div
            className="text-sm sm:text-base 2xl:text-[17px] font-bold text-foreground mt-0.5 tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis"
            title={formatAmount(currentSummary["overdue-30-plus"] || 0)}
          >
            {loading ? (
              <div className="h-6 w-24 bg-muted rounded-md animate-pulse mt-1" />
            ) : (
              formatAmount(currentSummary["overdue-30-plus"] || 0)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Overdue 90+ Days */}
      <Card className="bg-card rounded-2xl border border-border/80 p-5 flex flex-row items-center gap-4 shadow-xs hover:border-primary/30 hover:shadow-sm transition-all duration-200 relative overflow-hidden">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#EAE9F8] dark:bg-[#25203A] text-[#6355A5] dark:text-[#C4B5FD] border border-[#D7D5F3] dark:border-[#3D345E] flex items-center justify-center">
          <CalendarDays className="w-5 h-5" strokeWidth={2} />
        </div>
        <CardContent className="p-0 min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Overdue 90+ Days
          </p>
          <div
            className="text-sm sm:text-base 2xl:text-[17px] font-bold text-foreground mt-0.5 tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis"
            title={formatAmount(currentSummary["overdue-90-plus"] || 0)}
          >
            {loading ? (
              <div className="h-6 w-24 bg-muted rounded-md animate-pulse mt-1" />
            ) : (
              formatAmount(currentSummary["overdue-90-plus"] || 0)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
