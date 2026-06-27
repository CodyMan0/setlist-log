#!/usr/bin/env node
// 화양교회 ANOINTING 채널의 찬양 콘티를 유튜브에서 긁어 data/*.json 으로 저장한다.
// - data/setlists.json : 금요성령집회 찬양
// - data/intouch.json  : INTOUCH WORSHIP (워십팀 콘티)
//
// 날짜 출처:
//  1) 제목에 적힌 날짜(정확) 를 우선 사용한다.
//  2) 제목에 날짜가 없으면 영상의 업로드일(upload_date) 을 풀추출해 "추정" 날짜로 쓴다.
//     - 업로드일은 예배 실제일보다 보통 늦으므로 approx=true 로 표시한다.
//     - data/upload-dates.json 에 videoId→날짜 를 캐시해 매번 다시 받지 않는다.
//
// 기본 동작: yt-dlp 로 채널 업로드 전체를 한국어 로케일로 가져와 제목을 파싱한다.
// 로컬 시드: SETLIST_RAW_FILE=<path> 를 주면 그 파일("id ||| title")을 읽고 backfill 은 건너뛴다.
//
// 멱등성: 영상ID로 중복 제거 + 캐시 사용으로 몇 번을 돌려도 결과는 동일하다.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CHANNEL = "https://www.youtube.com/@anointing3545";
const CACHE_FILE = join(ROOT, "data", "upload-dates.json");

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
  const out = execFileSync(
    "yt-dlp",
    [
      "--flat-playlist",
      "--extractor-args", "youtube:lang=ko",
      "--print", "%(id)s ||| %(title)s",
      `${CHANNEL}/videos`,
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
  return {
    videoId,
    url: `https://youtu.be/${videoId}`,
    date,
    approx: false, // 제목 날짜면 false, 업로드일 추정이면 true
    songs,
    rawTitle: title,
  };
}

// 금요성령집회 찬양 — 예) "금요성령집회 찬양 | 곡A / 곡B (2026.6.5)"
const FRIDAY_PREFIX = "금요성령집회 찬양";
const fridayDateRe = /\((\d{4})\.(\d{1,2})\.(\d{1,2})\)/g;
function parseFriday(line) {
  const p = splitLine(line);
  if (!p || !p.title.startsWith(FRIDAY_PREFIX)) return null;
  const { videoId, title } = p;

  const bar = title.indexOf("|");
  if (bar === -1) return null;
  let body = title.slice(bar + 1);

  let m, last = null;
  fridayDateRe.lastIndex = 0;
  while ((m = fridayDateRe.exec(title)) !== null) last = m;
  let date = null;
  if (last) {
    date = makeDate(last[1], last[2], last[3]);
    body = body.slice(0, body.lastIndexOf(last[0]));
  }

  const songs = body.split("/").map((s) => s.trim()).filter(Boolean);
  if (songs.length === 0) return null;
  return toItem(videoId, date, songs, title);
}

// INTOUCH WORSHIP — 예) "INTOUCH WORSHIP│ 곡A, 곡B(후렴) 20260614" / "... 2026.05.17"
const INTOUCH_PREFIX = "INTOUCH WORSHIP";
const intouchDottedRe = /(\d{4})\.(\d{1,2})\.(\d{1,2})\s*$/;
const intouchCompactRe = /(\d{4})(\d{2})(\d{2})\s*$/;
function parseIntouch(line) {
  const p = splitLine(line);
  if (!p || !p.title.startsWith(INTOUCH_PREFIX)) return null;
  const { videoId, title } = p;

  const bar = title.indexOf("│");
  if (bar === -1) return null;
  let body = title.slice(bar + 1).trim();

  let date = null;
  const m = body.match(intouchDottedRe) || body.match(intouchCompactRe);
  if (m) {
    date = makeDate(m[1], m[2], m[3]);
    body = body.slice(0, m.index).trim(); // 날짜성 토큰은 곡목록에서 제거
  }

  const songs = body.split(",").map((s) => s.trim()).filter(Boolean);
  if (songs.length === 0) return null;
  return toItem(videoId, date, songs, title);
}

// 날짜 있는 콘티를 최신순으로 먼저, 날짜 없는 콘티는 뒤에.
function sortItems(items) {
  items.sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
  return items;
}

function collect(lines, parse) {
  const seen = new Set();
  const items = [];
  for (const line of lines) {
    const r = parse(line);
    if (!r || seen.has(r.videoId)) continue;
    seen.add(r.videoId);
    items.push(r);
  }
  return sortItems(items);
}

// 제목에 날짜가 없는 콘티에 업로드일(추정)을 채운다. videoId 캐시로 1회만 풀추출.
function backfillUploadDates(allItems) {
  if (process.env.SETLIST_RAW_FILE) return; // 시드 모드는 네트워크 없음

  let cache = {};
  try {
    cache = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
  } catch {}

  const missing = allItems.filter((it) => !it.date && !cache[it.videoId]);
  if (missing.length) {
    console.log(`[backfill] 업로드일 조회 ${missing.length}건 (풀추출, 최초 1회)`);
    // watch?v= 형식: videoId 가 '-' 로 시작해도 옵션으로 오인되지 않는다.
    const urls = missing.map((it) => `https://www.youtube.com/watch?v=${it.videoId}`);
    let out = "";
    try {
      out = execFileSync(
        "yt-dlp",
        [
          "--no-flat-playlist", "--no-warnings", "--ignore-errors",
          "--print", "%(id)s ||| %(upload_date)s",
          ...urls,
        ],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
      );
    } catch (e) {
      out = (e.stdout && e.stdout.toString()) || ""; // 일부 실패해도 받은 만큼 사용
    }
    for (const line of out.split("\n")) {
      const sep = line.indexOf(" ||| ");
      if (sep === -1) continue;
      const id = line.slice(0, sep).trim();
      const ud = line.slice(sep + 5).trim(); // YYYYMMDD 또는 NA
      if (/^\d{8}$/.test(ud)) {
        const date = makeDate(ud.slice(0, 4), ud.slice(4, 6), ud.slice(6, 8));
        if (date) cache[id] = date;
      }
    }
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n");
  }

  let filled = 0;
  for (const it of allItems) {
    if (!it.date && cache[it.videoId]) {
      it.date = cache[it.videoId];
      it.approx = true;
      filled++;
    }
  }
  if (filled) console.log(`[backfill] 추정 날짜 ${filled}건 적용`);
}

function writeFeed(file, items) {
  const out = join(ROOT, "data", file);
  mkdirSync(dirname(out), { recursive: true });
  const payload = { updatedAt: new Date().toISOString(), count: items.length, setlists: items };
  writeFileSync(out, JSON.stringify(payload, null, 2) + "\n");
  const approx = items.filter((s) => s.approx).length;
  const unknown = items.filter((s) => !s.date).length;
  console.log(`[done] ${file}: ${items.length}건 (추정 ${approx} · 날짜모름 ${unknown})`);
}

function main() {
  const lines = getRawLines();
  const friday = collect(lines, parseFriday);
  const intouch = collect(lines, parseIntouch);

  backfillUploadDates([...friday, ...intouch]);
  sortItems(friday);
  sortItems(intouch);

  writeFeed("setlists.json", friday);
  writeFeed("intouch.json", intouch);
}

main();
