// 콘티 피드 공용 타입과 날짜 유틸. 금요예배/인터치가 같은 형태를 공유한다.

export type Setlist = {
  videoId: string;
  url: string;
  date: string | null; // YYYY-MM-DD, 제목/업로드일 모두 없으면 null
  approx?: boolean; // true 면 제목이 아닌 업로드일 기반 추정 날짜
  songs: string[];
  rawTitle: string;
};

export const NO_DATE = "날짜 모름";

// 콘티 한 건의 날짜를 화면용 문자열로. 추정이면 "(추정) 업로드일" 을 붙인다.
export function dateLabel(s: Pick<Setlist, "date" | "approx">) {
  if (!s.date) return NO_DATE;
  return s.approx ? `(추정) 업로드일 ${fmtDate(s.date)}` : fmtDate(s.date);
}

export type Feed = {
  updatedAt: string;
  count: number;
  setlists: Setlist[];
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 검색/정규화: 공백 제거 + 소문자.
export const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export function fmtDate(iso: string | null) {
  if (!iso) return NO_DATE;
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${wd})`;
}

export function fmtShort(iso: string | null) {
  if (!iso) return NO_DATE;
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

// 날짜가 있는 콘티만으로 수집 기간(가장 오래된 ~ 최신)을 구한다.
export function datedRange(setlists: Setlist[]) {
  const dates = setlists.map((s) => s.date).filter((d): d is string => !!d);
  return { oldest: dates[dates.length - 1], newest: dates[0] };
}

export function daysAgo(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const then = new Date(y, m - 1, d).getTime();
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  return Math.round((start - then) / 86_400_000);
}
