# Supabase 연동 가이드 (관리자 실제 구축)

신청자가 폼을 작성하면 → 클라우드 DB에 저장되고 → 관리자가 어디서든 로그인해 조회.
핵심 보안 원칙: **공개 페이지는 INSERT만 가능, 조회(SELECT)는 로그인한 관리자만.**

> 키를 안 넣으면 앱은 자동으로 localStorage 폴백(이 브라우저에서만)으로 동작합니다. 아래 5단계를 마치면 클라우드로 전환됩니다.

## 1. 프로젝트 생성
1. https://supabase.com → 가입 → **New project** (무료 플랜 OK)
2. Region은 `Northeast Asia (Seoul)` 권장, DB 비밀번호 설정

## 2. 테이블 만들기
좌측 **SQL Editor** → 아래 붙여넣고 실행:

```sql
create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  phone text,
  payload jsonb            -- 사주정보·고민·동의여부 등 전체
);

-- RLS(행 수준 보안) 켜기
alter table public.applicants enable row level security;

-- 공개(anon)는 INSERT만 허용 (남의 데이터 읽기 불가)
create policy "anon can insert" on public.applicants
  for insert to anon with check (true);

-- 로그인한 사용자(관리자)만 조회 허용
create policy "authenticated can read" on public.applicants
  for select to authenticated using (true);
```

## 3. 관리자 계정 만들기
좌측 **Authentication → Users → Add user** → 관리자 이메일/비밀번호 생성.
(이메일 확인 끄려면 Authentication → Providers → Email에서 "Confirm email" off)

## 4. 키 복사
**Project Settings → API**
- `Project URL`
- `anon public` 키
→ `supabase-config.js` 의 `url`, `anonKey`에 붙여넣기.

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxx.supabase.co",
  anonKey: "eyJhbGci..."
};
```

## 5. 확인
- `index.html` 신청 → 완료되면 Supabase **Table Editor → applicants**에 행이 쌓임
- `admin.html` → 관리자 이메일/비번 로그인 → 신청자 목록·세부 풀이 조회

## 보안 메모
- `anon` 키는 클라이언트 노출용이라 공개돼도 괜찮음(RLS가 실제 보호막).
- RLS 정책 덕분에 anon 키로는 **삽입만** 되고 **타인 데이터 조회 불가**.
- 관리자 페이지는 로그인 세션이 있어야만 데이터를 읽음.
- 민감정보(생년월일시·연락처)는 수집 시 **동의 체크**가 폼에 포함되어 있어야 함(index에 반영됨).
