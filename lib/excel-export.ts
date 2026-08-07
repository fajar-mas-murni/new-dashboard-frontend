import * as XLSX from "xlsx";

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columnMapping?: Record<string, string>
) {
  if (!data || data.length === 0) return;

  const formattedData = data.map((item) => {
    const newItem: Record<string, any> = {};
    const keys = columnMapping ? Object.keys(columnMapping) : Object.keys(item);

    keys.forEach((key) => {
      const label = columnMapping ? columnMapping[key] : key;
      let val = item[key];

      // Remove time component if val is an ISO date string (e.g. 2026-04-01T00:00:00.000Z -> 2026-04-01)
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
        val = val.split("T")[0];
      }

      newItem[label] = val !== undefined && val !== null ? val : "";
    });
    return newItem;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set automatic column widths
  const objectKeys = Object.keys(formattedData[0] || {});
  const colWidths = objectKeys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...formattedData.map((row) => String(row[key] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filename}_${today}.xlsx`);
}
