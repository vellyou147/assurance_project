import "server-only";
import { inflateRawSync } from "node:zlib";
import type { Company } from "@/types/company";

const CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cachedCompanies: Company[] | null = null;
let cacheExpiresAt = 0;
let loadingCompanies: Promise<Company[]> | null = null;

export class OpenDartCompanyError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function searchOpenDartCompanies(query: string): Promise<Company[]> {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];
  const companies = await getOpenDartCompanies();
  return companies.filter((company) => company.corpName.toLowerCase().includes(normalized) || company.stockCode?.includes(normalized)).sort((a, b) => companySearchScore(b, normalized) - companySearchScore(a, normalized) || a.corpName.localeCompare(b.corpName, "ko")).slice(0, 20);
}

async function getOpenDartCompanies(): Promise<Company[]> {
  if (cachedCompanies && Date.now() < cacheExpiresAt) return cachedCompanies;
  if (!loadingCompanies) loadingCompanies = downloadAndParseCompanies().finally(() => { loadingCompanies = null; });
  return loadingCompanies;
}

async function downloadAndParseCompanies(): Promise<Company[]> {
  const apiKey = process.env.OPEN_DART_API_KEY;
  if (!apiKey) throw new OpenDartCompanyError("OpenDART 인증키가 설정되지 않았습니다. 관리자에게 OPEN_DART_API_KEY 설정을 요청하세요.", 503);
  let response: Response;
  try { response = await fetch(`${CORP_CODE_URL}?crtfc_key=${encodeURIComponent(apiKey)}`, { cache: "no-store" }); }
  catch { throw new OpenDartCompanyError("OpenDART 서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요.", 502); }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!response.ok || !isZip(bytes)) throw new OpenDartCompanyError(openDartErrorMessage(new TextDecoder("utf-8").decode(bytes)), response.status === 429 ? 429 : 502);
  try {
    cachedCompanies = parseCorpCodeXml(unzipFirstXml(bytes));
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return cachedCompanies;
  } catch { throw new OpenDartCompanyError("OpenDART 기업 고유번호 데이터를 처리하지 못했습니다. 잠시 후 다시 시도하세요.", 502); }
}

function isZip(bytes: Uint8Array) { return bytes[0] === 0x50 && bytes[1] === 0x4b; }

function unzipFirstXml(bytes: Uint8Array): string {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const central = findSignature(view, 0x02014b50);
  if (central < 0) throw new Error("ZIP 중앙 디렉터리를 찾지 못했습니다.");
  const method = view.getUint16(central + 10, true);
  const compressedSize = view.getUint32(central + 20, true);
  const localOffset = view.getUint32(central + 42, true);
  if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error("ZIP 로컬 헤더가 올바르지 않습니다.");
  const fileNameLength = view.getUint16(localOffset + 26, true);
  const extraLength = view.getUint16(localOffset + 28, true);
  const dataStart = localOffset + 30 + fileNameLength + extraLength;
  const data = bytes.slice(dataStart, dataStart + compressedSize);
  const xmlBytes = method === 0 ? data : method === 8 ? inflateRawSync(data) : (() => { throw new Error("지원하지 않는 ZIP 압축 방식입니다."); })();
  return new TextDecoder("utf-8").decode(xmlBytes);
}

function findSignature(view: DataView, signature: number) { for (let index = 0; index <= view.byteLength - 4; index += 1) if (view.getUint32(index, true) === signature) return index; return -1; }

function parseCorpCodeXml(xml: string): Company[] {
  const matches = xml.match(/<list>[\s\S]*?<\/list>/g) ?? [];
  return matches.flatMap((entry) => {
    const corpCode = xmlValue(entry, "corp_code"); const corpName = xmlValue(entry, "corp_name"); const stockCode = xmlValue(entry, "stock_code").trim() || null;
    if (!corpCode || !corpName) return [];
    return [{ corpCode, corpName, stockCode, isListed: Boolean(stockCode), id: corpCode, name: corpName, code: stockCode ?? "" }];
  });
}

function xmlValue(entry: string, tag: string) { const value = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(entry)?.[1] ?? ""; return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim(); }

function openDartErrorMessage(body: string) {
  const message = xmlValue(body, "message");
  const status = xmlValue(body, "status");
  if (status === "020" || /limit|한도|제한/i.test(message)) return "OpenDART 일일 호출 한도를 초과했습니다. 잠시 후 또는 다음 날 다시 시도하세요.";
  if (status === "010" || status === "011" || status === "100" || /인증키|key/i.test(message)) return "OpenDART 인증키를 확인할 수 없습니다. 관리자에게 설정을 요청하세요.";
  return message ? `OpenDART 기업 정보를 불러오지 못했습니다: ${message}` : "OpenDART 기업 정보를 불러오지 못했습니다. 잠시 후 다시 시도하세요.";
}

function companySearchScore(company: Company, query: string) { const name = company.corpName.toLowerCase(); if (company.stockCode === query || name === query) return 100; if (name.startsWith(query)) return 70; if (company.isListed) return 30; return 10; }
