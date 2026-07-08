/* =====================================================================
   db.js — 신청자/예약 데이터 저장·조회 추상화 레이어
   - Supabase 설정이 있으면 클라우드 DB 사용 (어디서나 조회·중복차단 가능)
   - 없으면 localStorage 폴백 (이 브라우저에서만 — 검토/개발용)
   index.html(신청 저장·예약일 조회)과 admin.html(목록·캘린더·담당자·인증)이 함께 사용.

   예약/일정 모델 (payload + 전용 컬럼):
   - reserve_date : 예약 날짜 (YYYY-MM-DD)
   - reserve_time : 예약 시간대 'HH:MM' (13:00~19:00, 1타임=1시간). 같은 날짜+시간 active 1건만 허용(중복 차단)
   - status       : 'active' | 'cancelled' | 'deleted'  (deleted = 보관함, 복구 가능)
   - staff        : 담당자 이름
   클라우드에선 전용 컬럼으로, 폴백에선 객체 필드로 저장.
===================================================================== */
(function(){
  const cfg = window.SUPABASE_CONFIG || {};
  const configured = cfg.url && cfg.anonKey && !/YOUR_/.test(String(cfg.url)+String(cfg.anonKey));
  let client = null;
  if(configured && window.supabase && window.supabase.createClient){
    try{ client = window.supabase.createClient(cfg.url, cfg.anonKey); }catch(e){ client = null; }
  }

  const LS = 'saju_applicants';
  const LS_STAFF = 'saju_staff';
  const LS_BLOCKED = 'saju_blocked';
  const lsGet = ()=>{ try{ return JSON.parse(localStorage.getItem(LS)||'[]'); }catch(e){ return []; } };
  const lsSet = a=> localStorage.setItem(LS, JSON.stringify(a));
  const lsAdd = o=>{ const a=lsGet(); a.unshift(o); lsSet(a); };
  const staffGet = ()=>{ try{ return JSON.parse(localStorage.getItem(LS_STAFF)||'[]'); }catch(e){ return []; } };
  const staffSet = a=> localStorage.setItem(LS_STAFF, JSON.stringify(a));
  const blockedGet = ()=>{ try{ return JSON.parse(localStorage.getItem(LS_BLOCKED)||'[]'); }catch(e){ return []; } };
  const blockedSet = a=> localStorage.setItem(LS_BLOCKED, JSON.stringify(a));

  // 컬럼 미존재(마이그레이션 전) 에러 판별
  const isMissingCol = e => e && (e.code==='42703' || e.code==='PGRST204' || /column .* does not exist/i.test(e.message||''));
  // 테이블/컬럼 미존재(마이그레이션 전) 통합 판별 — blocked_dates 등 신규 객체 대응
  const isMissingObj = e => e && (e.code==='42703' || e.code==='42P01' || e.code==='PGRST204' || e.code==='PGRST205'
                                  || /does not exist|schema cache|could not find/i.test(e.message||''));
  // 유니크 충돌(같은 날짜 중복 예약)
  const isConflict   = e => e && (e.code==='23505' || /duplicate key|unique/i.test(e.message||''));

  // 클라우드 row → 관리자 화면 형태로 정규화
  const norm = r => ({
    ...(r.payload||{}),
    id: r.id, name: r.name, phone: r.phone,
    createdAt: r.created_at || (r.payload&&r.payload.createdAt) || '',
    reserveDate: r.reserve_date || (r.payload&&r.payload.reserveDate) || '',
    reserveTime: r.reserve_time || (r.payload&&r.payload.reserveTime) || '',
    status: r.status || (r.payload&&r.payload.status) || 'active',
    staff: r.staff || (r.payload&&r.payload.staff) || ''
  });

  window.DB = {
    enabled: !!client,
    mode: client ? 'supabase' : 'local',

    /* ---------- 신청(예약) 저장 ----------
       app.reserveDate(YYYY-MM-DD)+app.reserveTime('HH:MM')가 있으면 예약 타임으로 저장.
       같은 날짜+시간에 active 예약이 이미 있으면 conflict 반환(중복 차단). */
    async submit(app){
      const payload = { ...app, status:'active' };
      if(client){
        const row = { name:app.name, phone:app.phone, payload,
                      reserve_date: app.reserveDate||null, reserve_time: app.reserveTime||null,
                      status:'active', staff:null };
        try{
          let { error } = await client.from('applicants').insert(row);
          if(error && isMissingCol(error)){
            // 마이그레이션 전: 전용 컬럼 없이 저장(중복차단은 비활성)
            ({ error } = await client.from('applicants')
              .insert({ name:app.name, phone:app.phone, payload }));
          }
          if(error){
            if(isConflict(error)) return { ok:false, conflict:true, error };
            throw error;
          }
          return { ok:true, mode:'supabase' };
        }catch(e){
          console.error('[DB] Supabase 저장 실패 → 로컬 백업:', e && (e.message||e));
          lsAdd({ ...payload, id:'local-'+Date.now(), _cloudFailed:true });
          return { ok:true, mode:'local-fallback', error:e };
        }
      }
      // 로컬 폴백: 같은 날짜+시간 active 중복 차단
      if(app.reserveDate && app.reserveTime){
        const taken = lsGet().some(a=>(a.status||'active')==='active'
          && a.reserveDate===app.reserveDate && a.reserveTime===app.reserveTime);
        if(taken) return { ok:false, conflict:true };
      }
      lsAdd({ ...payload, id:'local-'+Date.now() });
      return { ok:true, mode:'local' };
    },

    /* ---------- 예약된 타임 목록 (공개 조회) ----------
       active 상태의 예약 날짜+시간을 'YYYY-MM-DD HH:MM' 문자열로 반환.
       index.html에서 타임 차단에 사용. 클라우드는 RPC(booked_slots) — 개인정보 비노출. */
    async bookedSlots(){
      if(client){
        try{
          const { data, error } = await client.rpc('booked_slots');
          if(error) throw error;
          return (data||[]).map(r=>{
            const d=r.reserve_date||r.date||'', t=r.reserve_time||r.time||'';
            return d&&t ? (d+' '+t) : '';
          }).filter(Boolean);
        }catch(e){
          console.warn('[DB] booked_slots RPC 실패(마이그레이션 전?):', e && (e.message||e));
          return [];
        }
      }
      return lsGet().filter(a=>(a.status||'active')==='active' && a.reserveDate && a.reserveTime)
        .map(a=>a.reserveDate+' '+a.reserveTime);
    },

    /* 신청자 목록 (관리자 화면 형태로 정규화). 기본은 보관함(deleted) 제외 */
    async list({ includeDeleted=true }={}){
      let arr;
      if(client){
        const { data, error } = await client.from('applicants')
          .select('*').order('created_at', { ascending:false });
        if(error) throw error;
        arr = (data||[]).map(norm);
      } else {
        arr = lsGet().map(a=>({ ...a, status:a.status||'active' }));
      }
      return includeDeleted ? arr : arr.filter(a=>a.status!=='deleted');
    },

    /* ---------- 일정 상태/담당자/날짜·시간 변경 (관리자) ----------
       patch: { status?, staff?, reserveDate?, reserveTime? } */
    async update(id, patch){
      if(client){
        const upd = {};
        if('status' in patch) upd.status = patch.status;
        if('staff' in patch) upd.staff = patch.staff;
        if('reserveDate' in patch) upd.reserve_date = patch.reserveDate || null;
        if('reserveTime' in patch) upd.reserve_time = patch.reserveTime || null;
        try{
          let { error } = await client.from('applicants').update(upd).eq('id', id);
          if(error && isMissingCol(error)) return { ok:false, error, needMigration:true };
          if(error){ if(isConflict(error)) return { ok:false, conflict:true, error }; throw error; }
          return { ok:true };
        }catch(e){ return { ok:false, error:e }; }
      }
      const a=lsGet(); const i=a.findIndex(x=>x.id===id);
      if(i<0) return { ok:false, error:{message:'not found'} };
      const willStatus = ('status' in patch)?patch.status:(a[i].status||'active');
      const date = ('reserveDate' in patch)?patch.reserveDate:a[i].reserveDate;
      const time = ('reserveTime' in patch)?patch.reserveTime:a[i].reserveTime;
      if(willStatus==='active' && date && time){
        const taken=a.some((x,j)=>j!==i && (x.status||'active')==='active'
          && x.reserveDate===date && x.reserveTime===time);
        if(taken) return { ok:false, conflict:true };
      }
      Object.assign(a[i], patch); lsSet(a);
      return { ok:true };
    },

    /* ---------- 담당자(staff) 명단 ---------- */
    async staffList(){
      if(client){
        try{
          const { data, error } = await client.from('staff').select('*').order('created_at',{ascending:true});
          if(error) throw error;
          return (data||[]).map(r=>({ id:r.id, name:r.name }));
        }catch(e){ console.warn('[DB] staff 조회 실패(마이그레이션 전?) → 로컬:', e&&(e.message||e)); return staffGet(); }
      }
      return staffGet();
    },
    async staffAdd(name){
      name=(name||'').trim(); if(!name) return { ok:false };
      if(client){
        try{ const { error } = await client.from('staff').insert({ name }); if(error) throw error; return { ok:true }; }
        catch(e){ const a=staffGet(); a.push({ id:'local-'+Date.now(), name }); staffSet(a); return { ok:true, mode:'local-fallback', error:e }; }
      }
      const a=staffGet(); a.push({ id:'local-'+Date.now(), name }); staffSet(a); return { ok:true };
    },
    async staffRemove(id){
      if(client){
        try{ const { error } = await client.from('staff').delete().eq('id', id); if(error) throw error; return { ok:true }; }
        catch(e){ const a=staffGet().filter(x=>x.id!==id); staffSet(a); return { ok:true, mode:'local-fallback', error:e }; }
      }
      const a=staffGet().filter(x=>x.id!==id); staffSet(a); return { ok:true };
    },

    /* ---------- 휴무/차단 날짜 (예약 불가일) ----------
       오픈 전 기간·휴무일 등 예약을 받지 않을 날짜.
       관리자(authenticated)가 등록/해제, 공개 페이지(anon)는 조회만 → 예약 폼에서 차단.
       테이블 미생성(마이그레이션 전)이면 조회는 [] 로 안전 폴백. */
    async blockedList(){
      if(client){
        try{
          const { data, error } = await client.from('blocked_dates').select('block_date,reason').order('block_date',{ascending:true});
          if(error) throw error;
          return (data||[]).map(r=>({ date:r.block_date, reason:r.reason||'' }));
        }catch(e){ console.warn('[DB] blocked_dates 조회 실패(마이그레이션 전?) → 로컬:', e&&(e.message||e)); return blockedGet(); }
      }
      return blockedGet();
    },
    async blockDates(dates, reason){
      dates=(dates||[]).filter(Boolean);
      if(!dates.length) return { ok:true };
      if(client){
        try{
          const rows=dates.map(d=>({ block_date:d, reason:reason||null }));
          const { error } = await client.from('blocked_dates').upsert(rows, { onConflict:'block_date' });
          if(error){ if(isMissingObj(error)) return { ok:false, needMigration:true, error }; throw error; }
          return { ok:true };
        }catch(e){ return { ok:false, error:e }; }
      }
      const a=blockedGet(); dates.forEach(d=>{ const i=a.findIndex(x=>x.date===d); if(i<0) a.push({date:d,reason:reason||''}); else a[i].reason=reason||''; });
      blockedSet(a); return { ok:true };
    },
    async unblockDates(dates){
      dates=(dates||[]).filter(Boolean);
      if(!dates.length) return { ok:true };
      if(client){
        try{
          const { error } = await client.from('blocked_dates').delete().in('block_date', dates);
          if(error){ if(isMissingObj(error)) return { ok:false, needMigration:true, error }; throw error; }
          return { ok:true };
        }catch(e){ return { ok:false, error:e }; }
      }
      const a=blockedGet().filter(x=>!dates.includes(x.date)); blockedSet(a); return { ok:true };
    },

    /* 관리자 인증 (Supabase Auth — 이메일/비번) */
    async signIn(email, pw){
      if(!client) return { error:{ message:'백엔드 미설정' } };
      return await client.auth.signInWithPassword({ email, password: pw });
    },
    async signOut(){ if(client) await client.auth.signOut(); },
    async user(){ if(!client) return null; const { data } = await client.auth.getUser(); return (data && data.user) || null; }
  };
})();
