#!/usr/bin/env node
// 화양교회 금요성령집회 찬양 콘티를 유튜브에서 긁어 data/setlists.json 으로 저장한다.
//
// 기본 동작: yt-dlp 로 채널을 검색해 영상 제목을 가져온다.
// 로컬 시드: SETLIST_RAW_FILE=<path> 를 주면 그 파일("id ||| title" 형식)을 대신 읽는다.
//
// 멱등성: 영상ID로 중복 제거하므로 몇 번을 돌려도 결과는 동일하다.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "data", "setlists.json");

const CHANNEL = "https://www.youtube.com/@anointing3545";
const SEARCH_QUERY = "금요성령집회 찬양";
const PREFIX = "금요성령집회 찬양"; // 이 접두사로 시작하는 제목만 채택 (설교/모음 제외)
const dateRe = /\((\d{4})\.(\d{1,2})\.(\d{1,2})\)/g;

function getRawLines() {
  const seedFile = process.env.SETLIST_RAW_FILE;
  if (seedFile) {
    console.log(`[seed] ${seedFile} 에서 읽는 중`);
    return readFileSync(seedFile, "utf8").split("\n").filter(Boolean);
  }
  console.log(`[yt-dlp] 채널 검색 중: "${SEARCH_QUERY}"`);
  const url = `${CHANNEL}/search?query=${encodeURIComponent(SEARCH_QUERY)}`;
  const out = execFileSync(
    "yt-dlp",
    ["--flat-playlist", "--print", "%(id)s ||| %(title)s", url],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  return out.split("\n").filter(Boolean);
}

function parseLine(line) {
  const sep = line.indexOf(" ||| ");
  if (sep === -1) return null;
  const videoId = line.slice(0, sep);
  const title = line.slice(sep + 5).trim();
  if (!title.startsWith(PREFIX)) return null;

  // 제목 끝부분의 (YYYY.M.D) 중 마지막 것을 날짜로 사용
  let m, last = null;
  dateRe.lastIndex = 0;
  while ((m = dateRe.exec(title)) !== null) last = m;
  if (!last) return null; // 날짜 없으면 신뢰할 수 없으므로 제외
  const [, y, mo, d] = last;
  const date = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // 곡목록: 첫 "|" 뒤 ~ 날짜 괄호 앞, " / " 로 분리
  const bar = title.indexOf("|");
  if (bar === -1) return null;
  let body = title.slice(bar + 1);
  body = body.slice(0, body.lastIndexOf(last[0]));
  const songs = body.split("/").map((s) => s.trim()).filter(Boolean);
  if (songs.length === 0) return null;

  return { videoId, url: `https://youtu.be/${videoId}`, date, songs, rawTitle: title };
}

function main() {
  const lines = getRawLines();
  const seen = new Set();
  const items = [];
  for (const line of lines) {
    const r = parseLine(line);
    if (!r || seen.has(r.videoId)) continue;
    seen.add(r.videoId);
    items.push(r);
  }
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  mkdirSync(dirname(OUT), { recursive: true });
  const payload = { updatedAt: new Date().toISOString(), count: items.length, setlists: items };
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`[done] 콘티 ${items.length}건 저장 → ${OUT}`);
}

main();
