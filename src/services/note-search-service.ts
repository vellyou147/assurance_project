import "server-only";
import { buildSearchKeywords, getAllNoteHeadingTerms } from "@/lib/note-keywords";
import type { DisclosureSection } from "@/types/disclosure";
import type { ParsedDisclosureDocument } from "@/services/disclosure-parser";

const MAX_SECTION_LINES = 180;
const MAX_SECTION_CHARACTERS = 12000;

interface Heading { start: number; title: string; }

export function findRelevantSections(documents: ParsedDisclosureDocument[], topic: string): DisclosureSection[] {
  const keywords = buildSearchKeywords(topic);
  return deduplicateSections(documents.flatMap((document) => extractSectionContext(document, keywords)));
}

export function extractSectionContext(document: ParsedDisclosureDocument, keywords: string[]): DisclosureSection[] {
  const headings = findHeadings(document.lines);
  return headings.filter((heading) => matchesTopic(heading.title, keywords)).map((heading) => {
    const nextHeading = headings.find((candidate) => candidate.start > heading.start);
    const end = Math.min(nextHeading?.start ?? document.lines.length, heading.start + MAX_SECTION_LINES);
    const sectionLines = limitCharacters(document.lines.slice(heading.start, end));
    const plainText = sectionLines.join("\n");
    const matchedKeywords = keywords.filter((keyword) => normalize(plainText).includes(normalize(keyword)));
    const sectionTable = document.tables.find((table) => table.lineIndex < end && table.endLineIndex > heading.start);
    return { id: `${document.fileName}-${heading.start}`, title: heading.title, plainText, matchedKeywords, sourceFile: document.fileName, table: sectionTable?.table };
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

function findHeadings(lines: string[]): Heading[] {
  const headings: Heading[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isNumberOnly(line) && isTitleText(lines[index + 1] ?? "")) {
      headings.push({ start: index, title: `${line} ${lines[index + 1]}`.trim() });
      continue;
    }
    if (isNumberedHeading(line) || isUnnumberedTopicHeading(line)) headings.push({ start: index, title: line });
  }
  return headings;
}

function matchesTopic(title: string, keywords: string[]) { return keywords.some((keyword) => normalize(title).includes(normalize(keyword))); }
function isNumberOnly(line: string) { return /^(?:주석\s*)?(?:\(?\d+(?:[.-]\d+)*\)?|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+|[가-하])(?:[.)])?$/.test(line.trim()); }
function isNumberedHeading(line: string) { return /^(?:주석\s*)?(?:\(?\d+(?:[.-]\d+)*\)?|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+|[가-하])(?:[.)]|\s)+\s*[가-힣A-Za-z]/.test(line.trim()) && isTitleText(line); }
function isUnnumberedTopicHeading(line: string) { return isTitleText(line) && getAllNoteHeadingTerms().some((term) => normalize(line).includes(normalize(term))); }
function isTitleText(line: string) { const trimmed = line.trim(); return trimmed.length >= 2 && trimmed.length <= 100 && !/[。.!?]$/.test(trimmed) && !/[;:]/.test(trimmed) && !/(입니다|있습니다|있으며|합니다|같습니다|위한|대하여|대한|으로|하고)$/u.test(trimmed); }

function limitCharacters(lines: string[]) {
  let length = 0;
  return lines.filter((line) => { length += line.length + 1; return length <= MAX_SECTION_CHARACTERS; });
}
function normalize(value: string) { return value.toLowerCase().replace(/주석|회계정책|\d+(?:[.)-]\d*)?/g, "").replace(/[\s()\[\]{}·ㆍ,:;\-]/g, ""); }
