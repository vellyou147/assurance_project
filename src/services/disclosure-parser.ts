import "server-only";
import type { DisclosureTable } from "@/types/disclosure";

export interface ParsedDisclosureTable { text: string; table: DisclosureTable; lineIndex: number; endLineIndex: number; }
export interface ParsedDisclosureDocument { fileName: string; lines: string[]; tables: ParsedDisclosureTable[]; }

export function identifyMainDocuments(entries: Array<{ fileName: string; content: string }>) { return [...entries].sort((a, b) => scoreDocument(b) - scoreDocument(a)); }

export function parseDisclosureDocument(fileName: string, content: string): ParsedDisclosureDocument {
  const extractedTables = extractTables(content);
  let tableIndex = 0;
  const withMarkers = content.replace(/<table(?=[\s>])[^>]*>[\s\S]*?<\/table\s*>/gi, (tableHtml) => {
    const index = tableIndex++;
    return `\n__DART_TABLE_START_${index}__\n${normalizeDisclosureContent(tableHtml)}\n__DART_TABLE_END_${index}__\n`;
  });
  const sourceLines = normalizeDisclosureContent(withMarkers).split("\n").map((line) => line.trim()).filter((line) => line.length > 1);
  const tables = extractedTables.map((table, index) => {
    const startMarker = sourceLines.findIndex((line) => line === `__DART_TABLE_START_${index}__`);
    const endMarker = sourceLines.findIndex((line) => line === `__DART_TABLE_END_${index}__`);
    return { ...table, lineIndex: countContentLines(sourceLines, startMarker < 0 ? 0 : startMarker), endLineIndex: countContentLines(sourceLines, endMarker < 0 ? 0 : endMarker) };
  });
  return { fileName, lines: sourceLines.filter((line) => !isTableMarker(line)), tables };
}

export function normalizeDisclosureContent(content: string) { return decodeEntities(content.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|iframe|meta|link)[\s\S]*?<\/\1>/gi, "").replace(/<(br|p|div|tr|li|h[1-6]|title|section)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ")).replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim(); }
function scoreDocument(entry: { fileName: string; content: string }) { return (entry.content.length / 1000) + (/\.xml$/i.test(entry.fileName) ? 20 : 0) + (/_[0-9]{5}\.xml$/i.test(entry.fileName) ? 0 : 40); }
function decodeEntities(value: string) { return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/g, "'"); }
function isTableMarker(line: string) { return /^__DART_TABLE_(?:START|END)_\d+__$/.test(line); }
function countContentLines(lines: string[], until: number) { return lines.slice(0, until).filter((line) => !isTableMarker(line)).length; }

function extractTables(content: string): Array<Omit<ParsedDisclosureTable, "lineIndex" | "endLineIndex">> {
  return (content.match(/<table(?=[\s>])[^>]*>[\s\S]*?<\/table\s*>/gi) ?? []).flatMap((tableHtml) => {
    const rows = (tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? []).map((row) => (row.match(/<(?:th|td)\b[^>]*>[\s\S]*?<\/(?:th|td)>/gi) ?? []).map((cell) => normalizeDisclosureContent(cell).replace(/\n/g, " ").trim()).filter(Boolean)).filter((row) => row.length > 0);
    if (rows.length === 0) return [];
    const [headers, ...body] = rows;
    return [{ text: rows.flat().join(" "), table: { headers, rows: body.slice(0, 30) } }];
  }).slice(0, 2200);
}
