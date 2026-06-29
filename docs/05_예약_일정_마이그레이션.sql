-- =====================================================================
-- 05. 예약/일정 시스템 마이그레이션 (Supabase SQL Editor에 붙여넣고 실행)
-- =====================================================================
-- 기능: 예약 날짜+시간(타임) 지정 / 같은 시간대 중복 예약 자동 차단 /
--       담당자 배치 / 취소·삭제(보관함) 상태 / 공개 페이지의 예약가능 타임 조회
--
-- 운영: 13:00~20:00, 1타임 = 1시간 → 하루 7타임(13·14·15·16·17·18·19시)
--
-- ⚠️ 이미 applicants 테이블이 있는 상태에서 "추가"하는 마이그레이션입니다.
--    (docs/04 를 먼저 실행해 applicants 테이블이 있어야 합니다)
--    재실행해도 안전하도록 작성되어 있습니다.
-- =====================================================================

-- 1) applicants 에 예약 컬럼 추가 -------------------------------------
alter table public.applicants add column if not exists reserve_date date;
alter table public.applicants add column if not exists reserve_time text;                       -- 'HH:MM' (예: '13:00')
alter table public.applicants add column if not exists status text not null default 'active';   -- active | cancelled | deleted
alter table public.applicants add column if not exists staff  text;

-- 2) 같은 날짜+시간대에 active 예약은 1건만 (중복 예약 자동 차단) --------
--    (예전 날짜-단위 인덱스가 있으면 제거하고, 날짜+시간 단위로 다시 생성)
drop index if exists uniq_active_reserve_date;
create unique index if not exists uniq_active_reserve_slot
  on public.applicants (reserve_date, reserve_time)
  where status = 'active' and reserve_date is not null and reserve_time is not null;

-- 3) 관리자(authenticated)가 상태/담당자/날짜/시간을 수정할 수 있도록 UPDATE 정책 --
drop policy if exists "authenticated can update" on public.applicants;
create policy "authenticated can update" on public.applicants
  for update to authenticated using (true) with check (true);

-- 4) 공개 페이지가 "예약된 타임(날짜+시간)"만 볼 수 있는 함수 -------------
--    개인정보(이름·연락처)는 노출하지 않고 날짜·시간만 반환 (SECURITY DEFINER).
drop function if exists public.booked_dates();
create or replace function public.booked_slots()
returns table(reserve_date date, reserve_time text)
language sql
security definer
set search_path = public
as $$
  select reserve_date, reserve_time
  from public.applicants
  where status = 'active' and reserve_date is not null and reserve_time is not null;
$$;
grant execute on function public.booked_slots() to anon, authenticated;

-- 5) 담당자(staff) 명단 테이블 ----------------------------------------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

drop policy if exists "authenticated manage staff" on public.staff;
create policy "authenticated manage staff" on public.staff
  for all to authenticated using (true) with check (true);

-- =====================================================================
-- 끝. 실행 후:
--  · index.html 예약 폼에서 날짜 → 시간대(타임) 선택 → 이미 찬 타임은 자동 차단
--  · admin.html 캘린더/담당자/보관함 정상 동작 (캘린더에 시간 표시)
-- =====================================================================
