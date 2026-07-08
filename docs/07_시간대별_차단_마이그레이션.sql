-- =====================================================================
-- 07. 시간대별(타임) 예약 차단 마이그레이션
--     Supabase SQL Editor에 붙여넣고 [RUN] 실행하세요.
-- =====================================================================
-- 기능: 기존 "하루 전체 휴무"에 더해, 특정 날짜의 특정 시간대(타임)만 차단.
--       blocked_dates 에 block_time 컬럼 추가 —
--         block_time = 'ALL'   → 그 날 전체 휴무
--         block_time = '14:00' → 그 날 14:00 타임만 차단
--
-- ⚠️ docs/06 을 실행했든 안 했든 안전하게 동작하도록 작성했습니다.
--    재실행해도 안전합니다.
-- =====================================================================

-- 1) 테이블이 없으면 최종 형태로 생성 (docs/06 미실행 대비) --------------
create table if not exists public.blocked_dates (
  block_date date not null,
  block_time text not null default 'ALL',   -- 'ALL' = 하루 전체, 'HH:MM' = 해당 타임
  reason     text,
  created_at timestamptz not null default now()
);

-- 2) docs/06 로 이미 만든 테이블이면 block_time 컬럼만 추가 --------------
alter table public.blocked_dates add column if not exists block_time text not null default 'ALL';

-- 3) 기본키를 (날짜) → (날짜+시간) 복합키로 재구성 ----------------------
alter table public.blocked_dates drop constraint if exists blocked_dates_pkey;
alter table public.blocked_dates add constraint blocked_dates_pkey primary key (block_date, block_time);

-- 4) RLS 재확인 (docs/06 과 동일 — 없으면 생성) -------------------------
alter table public.blocked_dates enable row level security;

drop policy if exists "authenticated manage blocked_dates" on public.blocked_dates;
create policy "authenticated manage blocked_dates" on public.blocked_dates
  for all to authenticated using (true) with check (true);

drop policy if exists "anyone read blocked_dates" on public.blocked_dates;
create policy "anyone read blocked_dates" on public.blocked_dates
  for select to anon, authenticated using (true);

-- =====================================================================
-- 끝. 실행 후:
--  · admin.html [캘린더]에서 날짜 칸의 "차단 설정" → 하루 전체 휴무 또는
--    시간대별(13~19시) 차단을 선택
--  · index.html 예약 폼에서 차단된 시간대는 선택이 막힘
-- =====================================================================
