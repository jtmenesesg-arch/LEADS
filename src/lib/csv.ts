type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  const line: string[] = [];

  const pushCell = () => {
    line.push(current);
    current = "";
  };

  const pushLine = () => {
    if (line.length > 0 || current.length > 0) {
      rows.push([...line]);
    }
    line.length = 0;
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "," || char === ";")) {
      pushCell();
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      pushCell();
      pushLine();
      continue;
    }

    current += char;
  }

  pushCell();
  pushLine();

  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const record: CsvRow = {};
      headers.forEach((header, index) => {
        record[header] = row[index]?.trim() ?? "";
      });
      return record;
    });
}

export function toCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string) => {
    if (value.includes("\"") || value.includes(",") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const line = headers
      .map((header) => {
        const raw = row[header];
        return escape(raw == null ? "" : String(raw));
      })
      .join(",");
    lines.push(line);
  });
  return lines.join("\n");
}
