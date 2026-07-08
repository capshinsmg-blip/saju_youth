-- =====================================================================
-- 06. 휴무/차단 날짜 (예약 불가일) 마이그레이션
--     Supabase SQL Editor에 붙여넣고 [RUN] 실행하세요.
-- =====================================================================
-- 기능: 오픈 전 기간·휴무일 등 "예약을 받지 않을 날짜"를 관리자가 지정.
--       공개 예약 페이지(index.html)는 이 목록을 읽어 해당 날짜 예약을 막습니다.
--
-- ⚠️ docs/04·05 를 먼저 실행한 상태여야 합니다. 재실행해도 안전합니다.
-- =====================================================================

-- 1) 차단 날짜 테이블 -------------------------------------------------
create table if not exists public.blocked_dates (
  block_date date primary key,                      -- 예약 불가 날짜 (하루 = 1행)
  reason     text,                                  -- 사유(예: 오픈 전 / 휴무) — 선택
  created_at timestamptz not null default now()
);
alter table public.blocked_dates enable row level security;

-- 2) 관리자(authenticated): 등록·해제·조회 전체 허용 --------------------
drop policy if exists "authenticated manage blocked_dates" on public.blocked_dates;
create policy "authenticated manage blocked_dates" on public.blocked_dates
  for all to authenticated using (true) with check (true);

-- 3) 공개(anon): 조회만 허용 (예약 폼이 휴무일 차단에 사용, 개인정보 아님) --
drop policy if exists "anyone read blocked_dates" on public.blocked_dates;
create policy "anyone read blocked_dates" on public.blocked_dates
  for select to anon, authenticated using (true);

-- =====================================================================
-- 끝. 실행 후:
--  · admin.html [캘린더] 탭에서 날짜별 "휴무 지정/해제", 기간 일괄 휴무 가능
--  · index.html 예약 폼에서 휴무일 선택 시 "예약을 받지 않는 날"로 차단
-- =====================================================================
