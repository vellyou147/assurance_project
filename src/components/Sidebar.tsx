"use client";

import { BookOpen, Clock3, FileSearch, Info, PanelLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "주석 검색", icon: FileSearch }, { label: "저장된 작업", icon: BookOpen }, { label: "최근 검색", icon: Clock3 }, { label: "즐겨찾기", icon: Star }, { label: "서비스 소개", icon: Info },
];

export function Sidebar({ active, onChange }: { active: string; onChange: (item: string) => void }) {
  return <aside className="sticky top-0 flex h-screen flex-col border-r border-slate-200 bg-white px-3 py-5">
    <div className="flex items-center gap-3 px-3 pb-6"><div className="grid h-8 w-8 place-items-center rounded bg-slate-900 text-xs font-bold text-white">NR</div><div><p className="text-sm font-semibold text-slate-950">주석 리서치 툴</p><p className="text-[11px] text-slate-500">감사팀 업무지원</p></div></div>
    <nav className="space-y-1" aria-label="주요 메뉴">{menuItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => onChange(label)} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors", active === label ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    <div className="mt-auto border-t border-slate-200 px-3 pt-4 text-xs leading-5 text-slate-500"><div className="flex items-center gap-2 font-medium text-slate-700"><PanelLeft className="h-3.5 w-3.5 text-blue-700" />OpenDART: 연동 준비</div><p className="mt-2">데이터 기준일: 목업 데이터</p><p>감사팀 사용자</p></div>
  </aside>;
}
