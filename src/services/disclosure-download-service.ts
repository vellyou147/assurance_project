import "server-only";
import { fetchDartBinary } from "@/services/dart-client";
import type { DisclosureArchiveEntry } from "@/types/disclosure";
import { inflateRawSync } from "node:zlib";

const archiveCache = new Map<string, Uint8Array>();
const archiveLoading = new Map<string, Promise<Uint8Array>>();

export async function downloadDisclosureArchive(rceptNo: string): Promise<Uint8Array> {
  const cached = archiveCache.get(rceptNo); if (cached) return cached;
  const running = archiveLoading.get(rceptNo); if (running) return running;
  const task = fetchDartBinary("document.xml", { rcept_no: rceptNo }).then((archive) => { archiveCache.set(rceptNo, archive); return archive; }).finally(() => archiveLoading.delete(rceptNo));
  archiveLoading.set(rceptNo, task); return task;
}

export function listArchiveEntries(archive: Uint8Array): DisclosureArchiveEntry[] {
  return readArchiveRecords(archive).map((entry) => ({ fileName: entry.fileName, compressedSize: entry.compressedSize, uncompressedSize: entry.uncompressedSize, compressionMethod: entry.compressionMethod, isDocumentCandidate: entry.isDocumentCandidate }));
}

export function extractArchiveEntries(archive: Uint8Array) { const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength); return readArchiveRecords(archive).filter((entry) => entry.isDocumentCandidate).map((entry) => ({ fileName: entry.fileName, content: decodeEntry(archive, view, entry) })); }

function readArchiveRecords(archive: Uint8Array) { const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength); const eocd = findLastSignature(view, 0x06054b50); if (eocd < 0) throw new Error("ZIP 종료 정보를 찾지 못했습니다."); const count = view.getUint16(eocd + 10, true); let offset = view.getUint32(eocd + 16, true); const entries: Array<DisclosureArchiveEntry & { localOffset: number }> = []; for (let index = 0; index < count; index += 1) { if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("ZIP 중앙 디렉터리가 올바르지 않습니다."); const method = view.getUint16(offset + 10, true); const compressedSize = view.getUint32(offset + 20, true); const uncompressedSize = view.getUint32(offset + 24, true); const nameLength = view.getUint16(offset + 28, true); const extraLength = view.getUint16(offset + 30, true); const commentLength = view.getUint16(offset + 32, true); const fileName = new TextDecoder("utf-8").decode(archive.slice(offset + 46, offset + 46 + nameLength)); entries.push({ fileName, compressedSize, uncompressedSize, compressionMethod: method, localOffset: view.getUint32(offset + 42, true), isDocumentCandidate: /\.(xml|xhtml|html|htm)$/i.test(fileName) }); offset += 46 + nameLength + extraLength + commentLength; } return entries; }

function decodeEntry(archive: Uint8Array, view: DataView, entry: DisclosureArchiveEntry & { localOffset: number }) { if (view.getUint32(entry.localOffset, true) !== 0x04034b50) throw new Error(`${entry.fileName} 로컬 헤더가 올바르지 않습니다.`); const nameLength = view.getUint16(entry.localOffset + 26, true); const extraLength = view.getUint16(entry.localOffset + 28, true); const start = entry.localOffset + 30 + nameLength + extraLength; const bytes = archive.slice(start, start + entry.compressedSize); const content = entry.compressionMethod === 0 ? bytes : entry.compressionMethod === 8 ? inflateRawSync(bytes) : (() => { throw new Error(`${entry.fileName}의 압축 방식을 지원하지 않습니다.`); })(); const utf8 = new TextDecoder("utf-8").decode(content); return /encoding=["'](?:euc-kr|ks_c_5601-1987)["']/i.test(utf8.slice(0, 300)) ? new TextDecoder("euc-kr").decode(content) : utf8; }

function findLastSignature(view: DataView, signature: number) { for (let index = view.byteLength - 4; index >= Math.max(0, view.byteLength - 65557); index -= 1) if (view.getUint32(index, true) === signature) return index; return -1; }
// TODO(Vercel): 메모리 캐시는 인스턴스 간 공유·영속되지 않으므로 운영 환경에서는 Redis/KV 등으로 교체한다.
