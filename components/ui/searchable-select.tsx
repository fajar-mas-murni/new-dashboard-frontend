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
        className={`flex flex-row items-center justify-between text-left font-mono font-medium bg-secondary/60 hover:bg-secondary border border-border/80 text-xs rounded-xl px-3 py-2 cursor-pointer text-foreground h-9 transition-colors ring-0 outline-none gap-1.5 ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-0 border border-border shadow-md rounded-xl bg-card text-card-foreground z-[100] font-mono"
        align="start"
        sideOffset={6}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 text-xs bg-transparent outline-none border-none placeholder:text-muted-foreground/60 text-foreground font-medium"
          />
          {loading && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />}
        </div>

        {/* Options List */}
        <div className="max-h-[220px] overflow-auto">
          {/* "All" option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-secondary/60 transition-colors cursor-pointer text-left ${value === "all" ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}
          >
            <Check className={`w-3 h-3 flex-shrink-0 ${value === "all" ? "opacity-100 text-primary" : "opacity-0"}`} />
            {allLabel}
          </button>

          {options.length === 0 && !loading ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground font-medium">
              No results found
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-secondary/60 transition-colors cursor-pointer text-left ${value === opt.value ? "bg-primary/10 text-primary font-semibold" : "text-foreground"}`}
              >
                <Check className={`w-3 h-3 flex-shrink-0 ${value === opt.value ? "opacity-100 text-primary" : "opacity-0"}`} />
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] font-medium text-muted-foreground select-none">
            <span className="tabular-nums">{startItem}-{endItem} / {total}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 tabular-nums">{page}/{totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-0.5 rounded hover:bg-secondary disabled:opacity-30 transition-colors cursor-pointer"
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
