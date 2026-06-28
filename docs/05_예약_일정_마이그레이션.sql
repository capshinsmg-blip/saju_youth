-- =====================================================================
-- 05. 예약/일정 시스템 마이그레이션 (Supabase SQL Editor에 붙여넣고 실행)
-- =====================================================================
-- 기능: 예약 날짜 지정 / 같은 날짜 중복 예약 자동 차단 / 담당자 배치 /
--       취소·삭제(보관함) 상태 / 공개 페이지의 예약가능일 조회
--
-- ⚠️ 이미 applicants 테이블이 있는 상태에서 "추가"하는 마이그레이션입니다.
--    (docs/04 를 먼저 실행해 applicants 테이블이 있어야 합니다)
-- =====================================================================

-- 1) applicants 에 예약 컬럼 추가 -------------------------------------
alter table public.applicants add column if not exists reserve_date date;
alter table public.applicants add column if not exists status text not null default 'active';   -- active | cancelled | deleted
alter table public.applicants add column if not exists staff  text;

-- 2) 같은 날짜에 active 예약은 1건만 (중복 예약 자동 차단) --------------
--    취소/삭제(cancelled/deleted)된 건은 날짜를 다시 비워줍니다.
create unique index if not exists uniq_active_reserve_date
  on public.applicants (reserve_date)
  where status = 'active' and reserve_date is not null;

-- 3) 관리자(authenticated)가 상태/담당자/날짜를 수정할 수 있도록 UPDATE 정책 --
drop policy if exists "authenticated can update" on public.applicants;
create policy "authenticated can update" on public.applicants
  for update to authenticated using (true) with check (true);

-- 4) 공개 페이지가 "예약된 날짜"만 볼 수 있는 함수 ----------------------
--    개인정보(이름·연락처)는 노출하지 않고 날짜만 반환 (SECURITY DEFINER).
create or replace function public.booked_dates()
returns setof date
language sql
security definer
set search_path = public
as $$
  select reserve_date
  from public.applicants
  where status = 'active' and reserve_date is not null;
$$;
grant execute on function public.booked_dates() to anon, authenticated;

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
--  · index.html 예약 폼에서 날짜 선택 → 이미 잡힌 날짜는 자동 차단
--  · admin.html 캘린더/담당자/보관함 정상 동작
-- =====================================================================
