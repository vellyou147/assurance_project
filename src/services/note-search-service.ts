import "server-only";
import { buildSearchKeywords } from "@/lib/note-keywords";
import type { DisclosureSection } from "@/types/disclosure";
import type { ParsedDisclosureDocument } from "@/services/disclosure-parser";

const MAX_SECTION_LINES = 180;
const MAX_SECTION_CHARACTERS = 12000;

export function findRelevantSections(documents: ParsedDisclosureDocument[], topic: string): DisclosureSection[] {
  const keywords = buildSearchKeywords(topic);
  return deduplicateSections(documents.flatMap((document) => extractSectionContext(document, keywords)));
}

/**
 * Returns only a note whose title itself matches the requested topic.  We deliberately
 * do not fall back to arbitrary keyword paragraphs: that fallback could expose a large
 * part of the full filing when the document structure is inconsistent.
 */
export function extractSectionContext(document: ParsedDisclosureDocument, keywords: string[]): DisclosureSection[] {
  const matchingHeadingIndexes = document.lines
    .map((line, index) => (isMatchingNoteHeading(line, keywords) ? index : -1))
    .filter((index) => index >= 0);

  return matchingHeadingIndexes.map((headingIndex) => {
    const nextHeadingIndex = findNextNoteHeading(document.lines, headingIndex + 1);
    const end = Math.min(
      nextHeadingIndex < 0 ? document.lines.length : nextHeadingIndex,
      headingIndex + MAX_SECTION_LINES,
    );
    const sectionLines = limitCharacters(document.lines.slice(headingIndex, end));
    const plainText = sectionLines.join("\n");
    const matchedKeywords = keywords.filter((keyword) => normalize(plainText).includes(normalize(keyword)));
    const table = findRelatedTable(document.tables, matchedKeywords)?.table;

    return {
      id: `${document.fileName}-${headingIndex}`,
      title: document.lines[headingIndex],
      plainText,
      matchedKeywords,
      sourceFile: document.fileName,
      table,
    };
  });
}

export function deduplicateSections(sections: DisclosureSection[]): DisclosureSection[] {
  const seen = new Set<string>();
  return sections.filter((section) => {
    const key = `${normalize(section.title)}-${normalize(section.plainText).slice(0, 800)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

function isMatchingNoteHeading(line: string, keywords: string[]) {
  return isNoteHeading(line) && keywords.some((keyword) => normalize(line).includes(normalize(keyword)));
}

function isNoteHeading(line: string) {
  const compact = line.trim();
  if (compact.length < 3 || compact.length > 130) return false;
  return /^(?:주석\s*)?\d{1,2}\s*(?:[.)]|\s)\s*[가-힣A-Za-z]/.test(compact);
}

function findNextNoteHeading(lines: string[], from: number) {
  for (let index = from; index < lines.length; index += 1) {
    if (isNoteHeading(lines[index])) return index;
  }
  return -1;
}

function findRelatedTable<T extends { text: string }>(tables: T[], keywords: string[]) {
  return tables.find((table) => keywords.some((keyword) => normalize(table.text).includes(normalize(keyword))));
}

function limitCharacters(lines: string[]) {
  let length = 0;
  return lines.filter((line) => {
    length += line.length + 1;
    return length <= MAX_SECTION_CHARACTERS;
  });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/주석|회계정책|\d+[.)]/g, "").replace(/[\s()\[\]{}·ㆍ,:;\-]/g, "");
}
