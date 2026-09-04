"use client";

import React, { useState } from "react";
import { Filter, Calendar, RefreshCw, Building2, Users, Layers } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DEFAULT_START_DATE } from "@/lib/constants";

interface FilterHeaderProps {
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  category: string;
  setCategory: (val: any) => void;
  customer: string;
  setCustomer: (val: string) => void;
  branch: string;
  setBranch: (val: string) => void;
  group: string;
  setGroup: (val: string) => void;
  groupList?: string[];
  loading: boolean;
  mounted: boolean;
  onRefresh: () => void;
}

export function FilterHeader({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  category,
  setCategory,
  customer,
  setCustomer,
  branch,
  setBranch,
  group,
  setGroup,
  groupList = [],
  loading,
  mounted,
  onRefresh,
}: FilterHeaderProps) {
  const [categoryLabel, setCategoryLabel] = useState<string>("All Categories");
  const [customerLabel, setCustomerLabel] = useState<string>("All Customers");
  const [branchLabel, setBranchLabel] = useState<string>("All Branches");
  const [groupLabel, setGroupLabel] = useState<string>("All Groups");

  const getDefaultStartDate = () => DEFAULT_START_DATE;

  const getDefaultEndDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const toDateString = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fromDateString = (str: string) => {
    if (!str) return undefined;
    const [year, month, day] = str.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Pilih tanggal";
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${day} ${months[month - 1] || ""} ${year}`;
  };

  const mapBranchOption = (item: any) => ({
    value: String(item.BranchName),
    label: item.BranchName || item.BranchCode,
  });

  const mapCustomerOption = (item: any) => ({
    value: item.CustomerName,
    label: item.CustomerName || item.CustomerCode,
  });

  const groupOptions = (groupList || []).map((g) => ({
    value: g,
    label: g === "Unknown" ? "Unknown" : g,
  }));

  const hasActiveFilters =
    category !== "all" ||
    customer !== "all" ||
    branch !== "all" ||
    group !== "all" ||
    startDate !== getDefaultStartDate() ||
    endDate !== getDefaultEndDate();

  return (
    <div className="bg-card text-foreground rounded-2xl p-5 border border-border/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
      <div className="flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground whitespace-nowrap">
            Accounts Receivable
          </h2>
          <span className="text-[11px] text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-secondary/70 border border-border/60">
            {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)}
          </span>
        </div>

        {/* Minimalist Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {branch !== "all" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#E3EDF7] dark:bg-[#1E293B] text-[#2B6CB0] dark:text-[#93C5FD] border border-[#CBDCEE] dark:border-[#334155]">
                Branch: {branchLabel}
              </span>
            )}
            {group !== "all" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EAE9F8] dark:bg-[#2A2640] text-[#5B56A0] dark:text-[#C4B5FD] border border-[#D5D3F2] dark:border-[#4338CA]/40">
                Group: {groupLabel}
              </span>
            )}
            {category !== "all" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FEF3D6] dark:bg-[#2E2818] text-[#B47818] dark:text-[#FDE68A] border border-[#F6E3B0] dark:border-[#785412]/40">
                Cat: {categoryLabel}
              </span>
            )}
            {customer !== "all" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FCE7EC] dark:bg-[#331C24] text-[#C84C6F] dark:text-[#F9A8D4] border border-[#F7CBD6] dark:border-[#9D174D]/40">
                Customer: {customerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 z-10 self-start md:self-auto">
        <Dialog>
          <DialogTrigger className="flex items-center gap-2 px-3.5 py-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border/80 hover:border-primary/40 rounded-xl text-xs font-semibold transition-all shadow-2xs h-9 cursor-pointer">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="flex items-center justify-center bg-primary text-white w-4 h-4 rounded-full text-[9px] font-bold">
                !
              </span>
            )}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border border-border rounded-2xl shadow-xl z-[60]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">Filter Data</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-3">
              {/* Branch Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">Branch:</label>
                <SearchableSelect
                  value={branch}
                  selectedLabel={branchLabel}
                  onValueChange={(val, label) => {
                    setBranch(val);
                    setBranchLabel(label);
                  }}
                  fetchUrl={`${process.env.NEXT_PUBLIC_API_URL}/master/branch`}
                  mapOption={mapBranchOption}
                  placeholder="Select branch"
                  allLabel="All Branches"
                  pageSize={10}
                  className="w-full"
                  icon={<Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
                />
              </div>

              {/* Group Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">Group:</label>
                <SearchableSelect
                  value={group}
                  selectedLabel={groupLabel}
                  onValueChange={(val, label) => {
                    setGroup(val);
                    setGroupLabel(label);
                  }}
                  staticOptions={groupOptions}
                  placeholder="Select group"
                  allLabel="All Groups"
                  pageSize={10}
                  className="w-full"
                  icon={<Layers className="w-3.5 h-3.5 text-muted-foreground" />}
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">Category:</label>
                <SearchableSelect
                  value={category}
                  selectedLabel={categoryLabel}
                  onValueChange={(val, label) => {
                    setCategory(val);
                    setCategoryLabel(label);
                    setCustomer("all");
                    setCustomerLabel("All Customers");
                  }}
                  staticOptions={[
                    { value: "anak_usaha", label: "Anak Usaha" },
                    { value: "non_anak_usaha", label: "Non Anak Usaha" },
                  ]}
                  placeholder="Select category"
                  allLabel="All Categories"
                  className="w-full"
                  icon={<Users className="w-3.5 h-3.5 text-muted-foreground" />}
                />
              </div>

              {/* Customer Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">Customer:</label>
                <SearchableSelect
                  value={customer}
                  selectedLabel={customerLabel}
                  onValueChange={(val, label) => {
                    setCustomer(val);
                    setCustomerLabel(label);
                  }}
                  fetchUrl={`${process.env.NEXT_PUBLIC_API_URL}/master/customer?category=${category}`}
                  mapOption={mapCustomerOption}
                  placeholder="Select customer"
                  allLabel="All Customers"
                  pageSize={10}
                  className="w-full"
                  icon={<Users className="w-3.5 h-3.5 text-muted-foreground" />}
                />
              </div>

              {/* Start Date Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">Start Date:</label>
                <Popover>
                  <PopoverTrigger className="w-full flex flex-row items-center justify-start text-left font-medium bg-secondary/60 hover:bg-secondary/90 border border-border text-xs rounded-xl px-3 py-2 cursor-pointer text-foreground h-9 transition-colors ring-0 outline-none">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {formatDisplayDate(startDate)}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border border-border shadow-xl rounded-2xl bg-card z-[100]">
                    <ShadcnCalendar
                      mode="single"
                      defaultMonth={fromDateString(startDate)}
                      selected={fromDateString(startDate)}
                      onSelect={(date) => {
                        if (date) setStartDate(toDateString(date));
                      }}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground font-medium">End Date:</label>
                <Popover>
                  <PopoverTrigger className="w-full flex flex-row items-center justify-start text-left font-medium bg-secondary/60 hover:bg-secondary/90 border border-border text-xs rounded-xl px-3 py-2 cursor-pointer text-foreground h-9 transition-colors ring-0 outline-none">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    {formatDisplayDate(endDate)}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border border-border shadow-xl rounded-2xl bg-card z-[100]">
                    <ShadcnCalendar
                      mode="single"
                      defaultMonth={fromDateString(endDate)}
                      selected={fromDateString(endDate)}
                      onSelect={(date) => {
                        if (date) setEndDate(toDateString(date));
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t border-border pt-4 mt-2">
              <button
                onClick={() => {
                  setStartDate(getDefaultStartDate());
                  setEndDate(getDefaultEndDate());
                  setCategory("all");
                  setCategoryLabel("All Categories");
                  setCustomer("all");
                  setCustomerLabel("All Customers");
                  setBranch("all");
                  setBranchLabel("All Branches");
                  setGroup("all");
                  setGroupLabel("All Groups");
                }}
                className="text-xs text-muted-foreground hover:text-primary font-semibold cursor-pointer transition-colors"
              >
                Reset Filters
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <button
          onClick={onRefresh}
          disabled={mounted ? loading : false}
          suppressHydrationWarning
          className="p-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-xl border border-border/80 hover:border-primary/40 transition-all cursor-pointer h-9 w-9 flex items-center justify-center shadow-2xs"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${mounted && loading ? "animate-spin text-primary" : ""}`} />
        </button>
      </div>
    </div>
  );
}
