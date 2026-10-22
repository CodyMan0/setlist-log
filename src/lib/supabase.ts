import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 밴드 신호용 Realtime 클라이언트 (DB 테이블은 쓰지 않는다 — Broadcast + Presence 만).
// 브라우저에서만 만들고, 탭 하나에 하나만 둔다.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없습니다.");
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return client;
}
