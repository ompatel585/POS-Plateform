// Builds a CSV from an array of plain objects and downloads it.
// `columns` is [{ key, label }]; values are quoted so commas and quotes are safe.
export const downloadCsv = (filename, rows, columns) => {
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const text = String(value).replace(/"/g, '""');
    return /[",\n\r]/.test(text) ? `"${text}"` : text;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
  // BOM so Excel opens UTF-8 (₹, accents) correctly
  const blob = new Blob(["﻿" + [header, ...body].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const LOW_STOCK_LIMIT = 5;

// Products with sizes are tracked per size; others by overall quantity
export const lowStockRows = (products, limit = LOW_STOCK_LIMIT) => {
  const rows = [];
  (products || []).forEach((p) => {
    if (p.sizeStock?.length) {
      p.sizeStock.forEach((s) => {
        if ((s.quantity || 0) <= limit) {
          rows.push({ product: p, size: s.size, quantity: s.quantity || 0 });
        }
      });
    } else if ((p.quantity || 0) <= limit) {
      rows.push({ product: p, size: null, quantity: p.quantity || 0 });
    }
  });
  return rows.sort((a, b) => a.quantity - b.quantity);
};
