import type { DisclosureAnalysisItem, DisclosureSection, DisclosureTopicAnalysis } from "@/types/disclosure";

interface AnalysisRule { id: string; label: string; patterns: string[]; requiresTable?: boolean; }

const rulesByTopic: Record<string, AnalysisRule[]> = {
  "무형자산 및 개발비": [
    { id: "capitalization", label: "자산화 기준", patterns: ["자산화", "무형자산으로 인식", "인식요건", "기술적 실현가능성"] },
    { id: "research-expense", label: "연구단계 비용처리", patterns: ["연구단계", "발생시 비용", "발생 시 비용", "연구활동"] },
    { id: "amortization-method", label: "상각방법", patterns: ["상각방법", "정액법", "상각"] },
    { id: "useful-life", label: "내용연수", patterns: ["내용연수", "내용 연수", "년"] },
    { id: "impairment", label: "손상검사", patterns: ["손상검사", "손상 징후", "손상차손", "회수가능액"] },
    { id: "rollforward-table", label: "변동표 포함 여부", patterns: ["기초", "취득", "상각", "기말"], requiresTable: true },
  ],
  "리스": [
    { id: "right-of-use", label: "사용권자산 인식", patterns: ["사용권자산", "사용권 자산"] },
    { id: "lease-liability", label: "리스부채 인식", patterns: ["리스부채", "리스 부채"] },
    { id: "short-term-exemption", label: "단기·소액 리스 면제", patterns: ["단기리스", "소액자산리스", "단기 리스", "소액 자산 리스"] },
    { id: "discount-rate", label: "할인율 또는 이자율", patterns: ["할인율", "증분차입이자율", "이자율"] },
    { id: "maturity-analysis", label: "리스부채 만기 또는 변동표", patterns: ["만기", "기초", "증가", "감소", "기말"], requiresTable: true },
  ],
};

export function analyzeDisclosureTopic(topic: string, sections: DisclosureSection[]): DisclosureTopicAnalysis | undefined {
  const rules = rulesByTopic[topic];
  if (!rules || sections.length === 0) return undefined;
  return { topic, items: rules.map((rule) => analyzeRule(rule, sections)) };
}

function analyzeRule(rule: AnalysisRule, sections: DisclosureSection[]): DisclosureAnalysisItem {
  const matchedSection = sections.find((section) => {
    const source = `${section.plainText}\n${section.table ? tableText(section) : ""}`.toLowerCase();
    const includesPattern = rule.patterns.some((pattern) => source.includes(pattern.toLowerCase()));
    return includesPattern && (!rule.requiresTable || Boolean(section.table));
  });
  if (!matchedSection) return { id: rule.id, label: rule.label, detected: false };
  return { id: rule.id, label: rule.label, detected: true, evidence: evidenceFor(matchedSection, rule.patterns) };
}

function tableText(section: DisclosureSection) { return [section.table?.headers.join(" "), ...(section.table?.rows.map((row) => row.join(" ")) ?? [])].join(" "); }
function evidenceFor(section: DisclosureSection, patterns: string[]) {
  const sourceLines = [...section.plainText.split("\n"), ...(section.table ? [tableText(section)] : [])];
  const line = sourceLines.find((value) => patterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()))) ?? section.title;
  return line.replace(/\s+/g, " ").trim().slice(0, 180);
}
