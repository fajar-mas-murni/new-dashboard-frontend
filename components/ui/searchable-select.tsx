"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string, label: string) => void;
  selectedLabel?: string;
  fetchUrl?: string;
  staticOptions?: SelectOption[];
  mapOption?: (item: any) => SelectOption;
  placeholder?: string;
  allLabel?: string;
  pageSize?: number;
  className?: string;
  icon?: React.ReactNode;
}

export function SearchableSelect({
  value,
  onValueChange,
  selectedLabel: externalLabel,
  fetchUrl,
  staticOptions,
  mapOption,
  placeholder = "Select...",
  allLabel = "All",
  pageSize = 10,
  className = "",
  icon,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [internalLabel, setInternalLabel] = useState(externalLabel || allLabel);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOptions = useCallback(async (searchTerm: string, pageNum: number) => {
    if (staticOptions) {
      const filtered = staticOptions.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
      const totalItems = filtered.length;
      setOptions(filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize));
      setTotal(totalItems);
      setTotalPages(Math.ceil(totalItems / pageSize) || 1);
      return;
    }

    if (!fetchUrl || !mapOption) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", String(pageNum));
      params.append("pageSize", String(pageSize));

      const separator = fetchUrl.includes("?") ? "&" : "?";
      const response = await fetch(`${fetchUrl}${separator}${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        const mapped = (result.data || []).map(mapOption);
        setOptions(mapped);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (err) {
      console.error("SearchableSelect fetch error:", err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, staticOptions, mapOption, pageSize]);

  // Fetch when popover opens or search/page changes
  useEffect(() => {
    if (open) {
      fetchOptions(search, page);
    }
  }, [open, page]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchOptions(search, 1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setPage(1);
    }
  }, [open]);

  // Resolve label for selected value
  useEffect(() => {
    if (value === "all") {
      setInternalLabel(allLabel);
    } else if (externalLabel) {
      setInternalLabel(externalLabel);
    }
  }, [value, allLabel, externalLabel]);

  const handleSelect = (option: SelectOption | null) => {
    if (option === null) {
      onValueChange("all", allLabel);
      setInternalLabel(allLabel);
    } else {
      onValueChange(option.value, option.label);
      setInternalLabel(option.label);
    }
    setOpen(false);
  };

  const displayLabel = value === "all" ? allLabel : internalLabel;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`flex flex-row items-center justify-between text-left font-semibold bg-[#f0f2f5] dark:bg-slate-800 border border-gray-300/80 dark:border-slate-700 hover:bg-gray-250 dark:hover:bg-slate-700 text-xs rounded-xl px-3 py-2 cursor-pointer text-[#2d2e30] dark:text-slate-100 h-9 transition-colors ring-0 outline-none gap-1.5 ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-500 dark:text-slate-400 flex-shrink-0">{icon}</span>}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400 flex-shrink-0 ml-2" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-0 border border-gray-200 dark:border-slate-800 shadow-xl rounded-xl bg-white dark:bg-slate-900 z-[100]"
        align="start"
        sideOffset={6}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-slate-800">
          <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 text-xs bg-transparent outline-none border-none placeholder:text-gray-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 font-medium"
          />
          {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />}
        </div>

        {/* Options List */}
        <div className="max-h-[220px] overflow-auto">
          {/* "All" option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left ${value === "all" ? "bg-slate-50 dark:bg-slate-800/30 text-theme-orange font-semibold" : "text-slate-700 dark:text-slate-300"}`}
          >
            <Check className={`w-3 h-3 flex-shrink-0 ${value === "all" ? "opacity-100 text-theme-orange" : "opacity-0"}`} />
            {allLabel}
          </button>

          {options.length === 0 && !loading ? (
            <div className="px-3 py-6 text-center text-xs text-gray-400 dark:text-slate-500 font-medium">
              No results found
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left ${value === opt.value ? "bg-slate-50 dark:bg-slate-800/30 text-theme-orange font-semibold" : "text-slate-700 dark:text-slate-300"}`}
              >
                <Check className={`w-3 h-3 flex-shrink-0 ${value === opt.value ? "opacity-100 text-theme-orange" : "opacity-0"}`} />
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-800 px-3 py-2 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 select-none">
            <span>{startItem}-{endItem} / {total}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1">{page}/{totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
