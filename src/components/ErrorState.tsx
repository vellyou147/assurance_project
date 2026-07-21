export function ErrorState({ message = "문서를 불러오지 못했습니다." }: { message?: string }) { return <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</div>; }
