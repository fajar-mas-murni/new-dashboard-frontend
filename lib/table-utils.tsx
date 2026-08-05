import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export const sortData = <T,>(data: T[], col: keyof T, dir: "asc" | "desc"): T[] => {
  return [...data].sort((a, b) => {
    let valA = a[col];
    let valB = b[col];

    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === "number" && typeof valB === "number") {
      return dir === "asc" ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return dir === "asc" ? -1 : 1;
    if (strA > strB) return dir === "asc" ? 1 : -1;
    return 0;
  });
};

export const handleToggleSort = <T extends string>(
  col: T,
  currentCol: T,
  currentDir: "asc" | "desc",
  setCol: (c: T) => void,
  setDir: (d: "asc" | "desc") => void
) => {
  if (currentCol === col) {
    setDir(currentDir === "asc" ? "desc" : "asc");
  } else {
    setCol(col);
    setDir("desc");
  }
};

export const renderSortableHeader = (
  label: string,
  colKey: any,
  currentCol: any,
  currentDir: "asc" | "desc",
  onSort: (col: any) => void,
  align: "left" | "right" = "left"
) => {
  const isSorted = currentCol === colKey;
  return (
    <th
      onClick={() => onSort(colKey)}
      className={`px-4 py-2.5 font-bold cursor-pointer hover:bg-white/10 transition-colors select-none group/th ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
        <span>{label}</span>
        {isSorted ? (
          currentDir === "asc" ? (
            <ArrowUp className="w-3 h-3 text-theme-orange flex-shrink-0" />
          ) : (
            <ArrowDown className="w-3 h-3 text-theme-orange flex-shrink-0" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30 group-hover/th:opacity-100 flex-shrink-0 transition-opacity" />
        )}
      </div>
    </th>
  );
};
