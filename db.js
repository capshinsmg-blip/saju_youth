/* =====================================================================
   db.js — 신청자 데이터 저장/조회 추상화 레이어
   - Supabase 설정이 있으면 클라우드 DB 사용 (어디서나 조회 가능)
   - 없으면 localStorage 폴백 (이 브라우저에서만 — 검토/개발용)
   index.html(신청 저장)과 admin.html(목록/인증)이 함께 사용.
===================================================================== */
(function(){
  const cfg = window.SUPABASE_CONFIG || {};
  const configured = cfg.url && cfg.anonKey && !/YOUR_/.test(String(cfg.url)+String(cfg.anonKey));
  let client = null;
  if(configured && window.supabase && window.supabase.createClient){
    try{ client = window.supabase.createClient(cfg.url, cfg.anonKey); }catch(e){ client = null; }
  }

  const LS = 'saju_applicants';
  const lsGet = ()=>{ try{ return JSON.parse(localStorage.getItem(LS)||'[]'); }catch(e){ return []; } };
  const lsAdd = o=>{ const a=lsGet(); a.unshift(o); localStorage.setItem(LS, JSON.stringify(a)); };

  window.DB = {
    enabled: !!client,
    mode: client ? 'supabase' : 'local',

    /* 신청자 저장. app = 관리자 화면이 쓰는 형태의 객체 */
    async submit(app){
      if(client){
        const { error } = await client.from('applicants')
          .insert({ name: app.name, phone: app.phone, payload: app });
        if(error) throw error;
        return;
      }
      lsAdd({ ...app, id: 'local-'+Date.now() });
    },

    /* 신청자 목록 (관리자 화면 형태로 정규화해서 반환) */
    async list(){
      if(client){
        const { data, error } = await client.from('applicants')
          .select('*').order('created_at', { ascending:false });
        if(error) throw error;
        return (data||[]).map(r=>({ ...(r.payload||{}), id:r.id, name:r.name, phone:r.phone, createdAt:r.created_at }));
      }
      return lsGet();
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
