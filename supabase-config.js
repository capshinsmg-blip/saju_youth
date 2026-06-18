/* =====================================================================
   Supabase 설정 — 아래 두 값을 본인 프로젝트 값으로 교체하세요.
   (Supabase 대시보드 → Project Settings → Data API / API Keys)
   - url     : Project URL (예: https://abcd1234.supabase.co)
   - anonKey : anon public key (공개용 키라 클라이언트 노출 OK)
   설정 방법은 docs/04_supabase_연동_가이드.md 참고.
   값이 비어있거나 YOUR_... 이면 자동으로 localStorage 임시저장(폴백)으로 동작합니다.
===================================================================== */
window.SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_URL",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};
