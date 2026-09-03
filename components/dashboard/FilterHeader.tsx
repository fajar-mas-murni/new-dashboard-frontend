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
    <div className="bg-gradient-to-r from-theme-black via-theme-header-via to-theme-header-to text-white rounded-2xl px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between shadow-md border border-theme-orange/20 relative overflow-hidden gap-4">
      <div className="absolute top-0 right-0 w-64 h-64 bg-theme-yellow/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <h2 className="text-base sm:text-lg font-bold tracking-tight z-10 whitespace-nowrap">
        Accounts Receivable dashboard
      </h2>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 z-10">
        <Dialog>
          <DialogTrigger className="flex items-center gap-2 px-4 py-2 bg-[#f0f2f5] dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300/80 dark:border-slate-700 hover:border-theme-orange/20 hover:text-theme-orange text-gray-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors h-9 cursor-pointer">
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex items-center justify-center bg-theme-orange text-white w-4 h-4 rounded-full text-[9px] font-bold">
                !
              </span>
            )}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-[60]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Filter Data</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-5 py-4">
              {/* Branch Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Branch:</label>
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
                  icon={<Building2 className="w-4 h-4" />}
                />
              </div>

              {/* Group Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Group:</label>
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
                  icon={<Layers className="w-4 h-4" />}
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Category:</label>
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
                  allLabel="All Customers"
                  className="w-full"
                  icon={<Users className="w-4 h-4" />}
                />
              </div>

              {/* Customer Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Customer:</label>
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
                  icon={<Users className="w-4 h-4" />}
                />
              </div>

              {/* Start Date Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Start Date:</label>
                <Popover>
                  <PopoverTrigger className="w-full flex flex-row items-center justify-start text-left font-semibold bg-[#f0f2f5] dark:bg-slate-800 border border-gray-300/80 dark:border-slate-700 hover:bg-gray-250 dark:hover:bg-slate-700 text-xs rounded-xl px-3 py-2 cursor-pointer text-[#2d2e30] dark:text-slate-100 h-9 transition-colors ring-0 outline-none">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                    {formatDisplayDate(startDate)}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900 z-[100]">
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
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">End Date:</label>
                <Popover>
                  <PopoverTrigger className="w-full flex flex-row items-center justify-start text-left font-semibold bg-[#f0f2f5] dark:bg-slate-800 border border-gray-300/80 dark:border-slate-700 hover:bg-gray-250 dark:hover:bg-slate-700 text-xs rounded-xl px-3 py-2 cursor-pointer text-[#2d2e30] dark:text-slate-100 h-9 transition-colors ring-0 outline-none">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                    {formatDisplayDate(endDate)}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900 z-[100]">
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
            <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t border-gray-100 dark:border-slate-800 pt-4 mt-2">
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
                className="text-xs text-slate-500 hover:text-theme-orange font-semibold cursor-pointer transition-colors"
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
          className="p-2.5 bg-[#f0f2f5] dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl border border-gray-300/80 dark:border-slate-700 hover:border-theme-orange/20 hover:text-theme-orange transition-colors cursor-pointer h-9 w-9 flex items-center justify-center text-gray-600 dark:text-gray-300"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${mounted && loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
