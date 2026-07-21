"use client";

export function Checklist({ items, checked, onChange }: { items: string[]; checked: Record<string, boolean>; onChange: (next: Record<string, boolean>) => void }) {
  if (items.length === 0) return <p className="py-5 text-center text-xs leading-5 text-slate-500">추출된 관련 주석이 있으면 확인 항목이 생성됩니다.</p>;
  return <div><ul className="space-y-3">{items.map((item) => <li key={item} className="flex items-start gap-2.5"><input id={`check-${item}`} type="checkbox" checked={checked[item] ?? false} onChange={() => onChange({ ...checked, [item]: !checked[item] })} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-700" /><label htmlFor={`check-${item}`} className="cursor-pointer text-sm leading-5 text-slate-700">{item}</label></li>)}</ul><p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">이 항목은 현재 추출된 기업별 주석의 제목·표·공통 키워드에서 생성됩니다. 실제 주석 작성과 검토에는 회사의 사실관계 및 관련 회계기준에 대한 전문가의 판단이 필요합니다.</p></div>;
}
