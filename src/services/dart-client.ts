import "server-only";

const BASE_URL = "https://opendart.fss.or.kr/api";

export class DartApiError extends Error { constructor(message: string, readonly status = 502) { super(message); } }

export async function fetchDartJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const response = await fetchDart(path, params);
  let body: { status?: string; message?: string } & T;
  try { body = await response.json() as { status?: string; message?: string } & T; } catch { throw new DartApiError("OpenDART 응답 형식을 확인하지 못했습니다."); }
  if (!response.ok || (body.status && body.status !== "000")) throw new DartApiError(formatDartError(body.status, body.message), response.status === 429 ? 429 : 502);
  return body;
}

export async function fetchDartBinary(path: string, params: Record<string, string>): Promise<Uint8Array> {
  const response = await fetchDart(path, params);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!response.ok || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new DartApiError(formatDartErrorFromBinary(bytes), response.status === 429 ? 429 : 502);
  return bytes;
}

async function fetchDart(path: string, params: Record<string, string>) {
  const apiKey = process.env.OPEN_DART_API_KEY;
  if (!apiKey) throw new DartApiError("OpenDART 인증키가 설정되지 않았습니다. 관리자에게 문의하세요.", 503);
  const url = new URL(`${BASE_URL}/${path}`); url.search = new URLSearchParams({ ...params, crtfc_key: apiKey }).toString();
  try { return await fetch(url, { cache: "no-store" }); } catch { throw new DartApiError("OpenDART 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요."); }
}

function formatDartError(status?: string, message?: string) {
  if (status === "013") return "선택한 조건에 해당하는 공시보고서를 찾지 못했습니다.";
  if (status === "020" || /limit|한도|제한/i.test(message ?? "")) return "OpenDART API 사용 한도를 초과했습니다. 잠시 후 다시 시도하세요.";
  if (["010", "011", "100", "901"].includes(status ?? "")) return "OpenDART 인증키를 확인할 수 없습니다. 관리자에게 문의하세요.";
  return message ? `OpenDART 요청에 실패했습니다: ${message}` : "OpenDART 요청에 실패했습니다. 잠시 후 다시 시도하세요.";
}

function formatDartErrorFromBinary(bytes: Uint8Array) { const text = new TextDecoder("utf-8").decode(bytes); const status = /<status>(.*?)<\/status>/.exec(text)?.[1]; const message = /<message>(.*?)<\/message>/.exec(text)?.[1]; return formatDartError(status, message); }
