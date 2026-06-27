#!/usr/bin/env node
// 화양교회 ANOINTING 채널의 찬양 콘티를 유튜브에서 긁어 data/*.json 으로 저장한다.
// - data/setlists.json : 금요성령집회 찬양
// - data/intouch.json  : INTOUCH WORSHIP (워십팀 콘티)
//
// 기본 동작: yt-dlp 로 채널 업로드 전체를 한국어 로케일로 가져와 제목을 파싱한다.
// 로컬 시드: SETLIST_RAW_FILE=<path> 를 주면 그 파일("id ||| title" 형식)을 대신 읽는다.
//
// 멱등성: 영상ID로 중복 제거하므로 몇 번을 돌려도 결과는 동일하다.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CHANNEL = "https://www.youtube.com/@anointing3545";

function getRawLines() {
  const seedFile = process.env.SETLIST_RAW_FILE;
  if (seedFile) {
    console.log(`[seed] ${seedFile} 에서 읽는 중`);
    return readFileSync(seedFile, "utf8").split("\n").filter(Boolean);
  }
  // 채널 업로드 전체를 한국어 로케일로 가져온다.
  // - /videos 탭: 검색(관련도순)과 달리 최신 영상이 누락되지 않는다.
  // - lang=ko: 이게 없으면 YouTube가 영어 자동번역 제목("Friday Holy Spirit...")을
  //   돌려줘 한글 접두사 필터에 전부 걸러진다(특히 해외 IP에서). 반드시 필요.
  console.log(`[yt-dlp] 채널 업로드 수집 중 (lang=ko): ${CHANNEL}/videos`);
  const url = `${CHANNEL}/videos`;
  const out = execFileSync(
    "yt-dlp",
    [
      "--flat-playlist",
      "--extractor-args", "youtube:lang=ko",
      "--print", "%(id)s ||| %(title)s",
      url,
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  return out.split("\n").filter(Boolean);
}

// "id ||| title" 한 줄을 { videoId, title } 로 분해한다.
function splitLine(line) {
  const sep = line.indexOf(" ||| ");
  if (sep === -1) return null;
  return { videoId: line.slice(0, sep), title: line.slice(sep + 5).trim() };
}

// 연/월/일을 검증해 YYYY-MM-DD 로 만든다. 범위를 벗어나면(원본 오타 등) null.
function makeDate(y, mo, d) {
  const Y = Number(y), M = Number(mo), D = Number(d);
  if (M < 1 || M > 12 || D < 1 || D > 31) return null;
  return `${Y}-${String(M).padStart(2, "0")}-${String(D).padStart(2, "0")}`;
}

function toItem(videoId, date, songs, title) {
  return { videoId, url: `https://youtu.be/${videoId}`, date, songs, rawTitle: title };
}

// 금요성령집회 찬양
// 예) "금요성령집회 찬양 | 곡A / 곡B / 곡C (2026.6.5)"
const FRIDAY_PREFIX = "금요성령집회 찬양";
const fridayDateRe = /\((\d{4})\.(\d{1,2})\.(\d{1,2})\)/g;
function parseFriday(line) {
  const p = splitLine(line);
  if (!p || !p.title.startsWith(FRIDAY_PREFIX)) return null;
  const { videoId, title } = p;

  const bar = title.indexOf("|");
  if (bar === -1) return null;
  let body = title.slice(bar + 1);

  // 제목 끝부분의 (YYYY.M.D) 중 마지막 것을 날짜로 사용. 없으면 date=null.
  let m, last = null;
  fridayDateRe.lastIndex = 0;
  while ((m = fridayDateRe.exec(title)) !== null) last = m;
  let date = null;
  if (last) {
    date = makeDate(last[1], last[2], last[3]);
    body = body.slice(0, body.lastIndexOf(last[0])); // 날짜 괄호는 곡목록에서 제거
  }

  const songs = body.split("/").map((s) => s.trim()).filter(Boolean);
  if (songs.length === 0) return null;

  return toItem(videoId, date, songs, title);
}

// INTOUCH WORSHIP (워십팀 콘티)
// 예) "INTOUCH WORSHIP│ 곡A, 곡B(후렴), 곡C 20260614"
//     "INTOUCH WORSHIP│ 곡A, 곡B 2026.05.17"
// - 접두사 뒤 전각 │ 로 곡 목록이 시작되고, 곡은 쉼표로 구분된다.
// - 날짜는 끝에 8자리(YYYYMMDD) 또는 점 표기(YYYY.MM.DD)로 붙는다(괄호 없음).
const INTOUCH_PREFIX = "INTOUCH WORSHIP";
const intouchDottedRe = /(\d{4})\.(\d{1,2})\.(\d{1,2})\s*$/;
const intouchCompactRe = /(\d{4})(\d{2})(\d{2})\s*$/;
function parseIntouch(line) {
  const p = splitLine(line);
  if (!p || !p.title.startsWith(INTOUCH_PREFIX)) return null;
  const { videoId, title } = p;

  // 접두사와 곡 목록을 나누는 전각 │ 위치
  const bar = title.indexOf("│");
  if (bar === -1) return null;
  let body = title.slice(bar + 1).trim();

  // 끝의 날짜를 떼어낸다 (점 표기 우선, 없으면 8자리). 날짜가 없거나
  // 오타(예: 20269125)면 date=null 이지만, 끝의 날짜성 토큰은 곡목록에서 제거한다.
  let date = null;
  const m = body.match(intouchDottedRe) || body.match(intouchCompactRe);
  if (m) {
    date = makeDate(m[1], m[2], m[3]);
    body = body.slice(0, m.index).trim();
  }

  const songs = body.split(",").map((s) => s.trim()).filter(Boolean);
  if (songs.length === 0) return null;

  return toItem(videoId, date, songs, title);
}

// 파싱기를 돌려 영상ID 기준 중복 제거 후 최신순 정렬한다.
function collect(lines, parse) {
  const seen = new Set();
  const items = [];
  for (const line of lines) {
    const r = parse(line);
    if (!r || seen.has(r.videoId)) continue;
    seen.add(r.videoId);
    items.push(r);
  }
  // 날짜 있는 콘티를 최신순으로 먼저, 날짜 없는 콘티는 업로드 순서대로 뒤에 둔다.
  items.sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
  return items;
}

function writeFeed(file, items) {
  const out = join(ROOT, "data", file);
  mkdirSync(dirname(out), { recursive: true });
  const payload = { updatedAt: new Date().toISOString(), count: items.length, setlists: items };
  writeFileSync(out, JSON.stringify(payload, null, 2) + "\n");
  console.log(`[done] ${file}: 콘티 ${items.length}건 저장`);
}

function main() {
  const lines = getRawLines();
  writeFeed("setlists.json", collect(lines, parseFriday));
  writeFeed("intouch.json", collect(lines, parseIntouch));
}

main();
