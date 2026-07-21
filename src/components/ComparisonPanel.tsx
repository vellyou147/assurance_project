"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Checklist } from "@/components/Checklist";
import { ResearchMemo } from "@/components/ResearchMemo";
import { buildComparisonSummary } from "@/lib/comparison-summary";
import { cn } from "@/lib/utils";
import type { DisclosureSearchResult } from "@/types/disclosure";

const tabs = ["공통사항", "차이점", "작성 체크리스트", "리서치 메모"] as const;
type Tab = (typeof tabs)[number];

export function ComparisonPanel({ results }: { results: DisclosureSearchResult[] }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("공통사항");
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = JSON.parse(localStorage.getItem("note-checklist") ?? "{}");
      return stored && typeof stored === "object" && !Array.isArray(stored) ? stored as Record<string, boolean> : {};
    } catch { return {}; }
  });
  const summary = useMemo(() => buildComparisonSummary(results), [results]);
  const updateChecklist = (next: Record<string, boolean>) => { setChecked(next); localStorage.setItem("note-checklist", JSON.stringify(next)); };

  if (!open) return <aside className="sticky top-0 flex h-screen w-11 shrink-0 items-start border-l border-slate-200 bg-white pt-4"><button onClick={() => setOpen(true)} aria-label="비교 정리 패널 펼치기" className="mx-auto rounded p-2 text-slate-500 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button></aside>;
  return <aside className="sticky top-0 h-screen w-[350px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white"><header className="flex items-center justify-between border-b border-slate-200 px-4 py-4"><div><h2 className="text-sm font-semibold text-slate-950">비교 정리</h2><p className="mt-0.5 text-[11px] text-slate-500">현재 추출 결과 기준</p></div><button onClick={() => setOpen(false)} aria-label="비교 정리 패널 접기" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button></header><div className="grid grid-cols-4 border-b border-slate-200" role="tablist">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={cn("min-w-0 break-keep border-b-2 px-1 py-3 text-[11px] font-medium leading-4 tracking-[-0.03em]", tab === item ? "border-blue-700 text-blue-800" : "border-transparent text-slate-500 hover:text-slate-800")}>{item}</button>)}</div><div className="p-4">{tab === "공통사항" && (summary.commonItems.length > 0 ? <ul className="space-y-3">{summary.commonItems.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-slate-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />{item}</li>)}</ul> : <EmptyComparison text="두 개 이상 기업에서 공통으로 추출된 키워드가 있으면 표시됩니다." />)}{tab === "차이점" && (summary.rows.length > 0 ? <div className="overflow-x-auto border border-slate-200"><table className="min-w-[500px] text-left text-xs"><thead className="bg-slate-50 text-slate-600"><tr>{summary.headers.map((header) => <th key={header} className="border-b border-slate-200 px-2 py-2 font-semibold">{header}</th>)}</tr></thead><tbody>{summary.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`} className="border-b border-slate-100 px-2 py-2 leading-4 text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div> : <EmptyComparison text="추출된 관련 주석이 있으면 실제 기업별 차이를 표시합니다." />)}{tab === "작성 체크리스트" && <Checklist items={summary.checklistItems} checked={checked} onChange={updateChecklist} />}{tab === "리서치 메모" && <ResearchMemo />}</div></aside>;
}

function EmptyComparison({ text }: { text: string }) { return <p className="py-5 text-center text-xs leading-5 text-slate-500">{text}</p>; }
