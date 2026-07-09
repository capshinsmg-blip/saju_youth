/* =====================================================================
   saju-ext.js — 명리 확장 계산 레이어 (관리자 전용, DOM 없음)
   saju.js 다음에 로드. window.SAJU_EXT 로 노출.

   제공: 지장간(월률분야 표준표) · 12운성(화토동법) · 천을귀인 · 공망 ·
        12신살(년지 삼합 기준) · 합충형파해·천간합 · 격국(간이) ·
        용신/희신/기신(간이 억부법) · 월지 조후 · 대운수 · 대운/세운 확장

   ⚠️ 격국·용신은 간이 판정(월지 정기 십신 / 억부법 단순 적용)이며,
      전문 감정의 정밀 판단과 다를 수 있음 — 리포트에 고지 문구 포함할 것.
===================================================================== */
(function(global){
  'use strict';
  const C = global.SAJU;
  if(!C){ if(typeof console!=='undefined') console.error('[saju-ext] saju.js를 먼저 로드하세요'); return; }

  const GAN=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const ZHI=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const gi=g=>GAN.indexOf(g), zi=z=>ZHI.indexOf(z);

  /* ---------- 지장간 (월률분야 표준표: 여기→중기→정기) ---------- */
  const ZHI_HIDE={
    子:[{g:'壬',r:'여기'},{g:'癸',r:'정기'}],
    丑:[{g:'癸',r:'여기'},{g:'辛',r:'중기'},{g:'己',r:'정기'}],
    寅:[{g:'戊',r:'여기'},{g:'丙',r:'중기'},{g:'甲',r:'정기'}],
    卯:[{g:'甲',r:'여기'},{g:'乙',r:'정기'}],
    辰:[{g:'乙',r:'여기'},{g:'癸',r:'중기'},{g:'戊',r:'정기'}],
    巳:[{g:'戊',r:'여기'},{g:'庚',r:'중기'},{g:'丙',r:'정기'}],
    午:[{g:'丙',r:'여기'},{g:'己',r:'중기'},{g:'丁',r:'정기'}],
    未:[{g:'丁',r:'여기'},{g:'乙',r:'중기'},{g:'己',r:'정기'}],
    申:[{g:'戊',r:'여기'},{g:'壬',r:'중기'},{g:'庚',r:'정기'}],
    酉:[{g:'庚',r:'여기'},{g:'辛',r:'정기'}],
    戌:[{g:'辛',r:'여기'},{g:'丁',r:'중기'},{g:'戊',r:'정기'}],
    亥:[{g:'戊',r:'여기'},{g:'甲',r:'중기'},{g:'壬',r:'정기'}]
  };
  const mainGanOf=zhi=>{ const h=ZHI_HIDE[zhi]; return h ? h[h.length-1].g : null; }; // 정기

  /* ---------- 12운성 (화토동법: 戊=丙·己=丁 기점, 양간 순행·음간 역행) ---------- */
  const UNSEONG=['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];
  const BIRTH_ZHI={甲:'亥',乙:'午',丙:'寅',丁:'酉',戊:'寅',己:'酉',庚:'巳',辛:'子',壬:'申',癸:'卯'};
  const isYang=g=>'甲丙戊庚壬'.includes(g);
  function unseong(dayGan, zhi){
    if(!dayGan||!zhi) return null;
    const d = isYang(dayGan) ? (zi(zhi)-zi(BIRTH_ZHI[dayGan])+12)%12
                             : (zi(BIRTH_ZHI[dayGan])-zi(zhi)+12)%12;
    return UNSEONG[d];
  }

  /* ---------- 천을귀인 (일간 기준) ---------- */
  const CHEON_EUL={甲:['丑','未'],戊:['丑','未'],庚:['丑','未'],乙:['子','申'],己:['子','申'],
                   丙:['亥','酉'],丁:['亥','酉'],壬:['巳','卯'],癸:['巳','卯'],辛:['午','寅']};

  /* ---------- 공망 (일주 기준 순중공망) ---------- */
  function gongmang(dayGan, dayZhi){
    const x=(zi(dayZhi)-gi(dayGan)+12)%12;
    return [ZHI[(x+10)%12], ZHI[(x+11)%12]];
  }

  /* ---------- 12신살 (년지 삼합국 기준 — 겁살=삼합 고지 다음 지지부터) ---------- */
  const SINSAL_SEQ=['겁살','재살','천살','지살','도화살','월살','망신살','장성살','반안살','역마살','육해살','화개살'];
  const SAMHAP_GROUP={申:'수',子:'수',辰:'수',巳:'금',酉:'금',丑:'금',寅:'화',午:'화',戌:'화',亥:'목',卯:'목',未:'목'};
  const GEOP_START={수:'巳',금:'寅',화:'亥',목:'申'};
  function sinsal(yearZhi, zhi){
    if(!yearZhi||!zhi) return null;
    const st=zi(GEOP_START[SAMHAP_GROUP[yearZhi]]);
    return SINSAL_SEQ[(zi(zhi)-st+12)%12];
  }

  /* ---------- 합충형파해 · 천간합 ---------- */
  const HAP6={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
  const SAMHAP=[['申','子','辰','수'],['巳','酉','丑','금'],['寅','午','戌','화'],['亥','卯','未','목']];
  const PA={子:'酉',酉:'子',丑:'辰',辰:'丑',寅:'亥',亥:'寅',卯:'午',午:'卯',巳:'申',申:'巳',戌:'未',未:'戌'};
  const HAE={子:'未',未:'子',丑:'午',午:'丑',寅:'巳',巳:'寅',卯:'辰',辰:'卯',申:'亥',亥:'申',酉:'戌',戌:'酉'};
  const HYEONG3=[['寅','巳','申'],['丑','戌','未']];
  const GAN_HAP={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
  const GAN_HAP_EL={甲己:'토',乙庚:'금',丙辛:'수',丁壬:'목',戊癸:'화'};

  /* 원국 내 관계: pillars=[{lab,gan,zhi}...] (시주 null 허용) → 성립 목록 */
  function relations(pillars){
    const ps=pillars.filter(p=>p.gan);
    const out=[];
    const seen=new Set(); const key=(t,a,b)=>t+[a,b].sort().join('');
    for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){
      const A=ps[i], B=ps[j];
      // 지지
      if(C.CHUNG[A.zhi]===B.zhi && !seen.has(key('충',A.lab,B.lab))){ seen.add(key('충',A.lab,B.lab));
        out.push({type:'충', kind:'지지', a:A, b:B, txt:`${A.lab}지 ${A.zhi} ↔ ${B.lab}지 ${B.zhi} 충(沖)`}); }
      if(HAP6[A.zhi]===B.zhi){ out.push({type:'육합', kind:'지지', a:A, b:B, txt:`${A.lab}지 ${A.zhi} · ${B.lab}지 ${B.zhi} 육합(六合)`}); }
      if(PA[A.zhi]===B.zhi){ out.push({type:'파', kind:'지지', a:A, b:B, txt:`${A.lab}지 ${A.zhi} · ${B.lab}지 ${B.zhi} 파(破)`}); }
      if(HAE[A.zhi]===B.zhi){ out.push({type:'해', kind:'지지', a:A, b:B, txt:`${A.lab}지 ${A.zhi} · ${B.lab}지 ${B.zhi} 해(害)`}); }
      if(A.zhi===B.zhi && '辰午酉亥'.includes(A.zhi)){ out.push({type:'형', kind:'지지', a:A, b:B, txt:`${A.lab}·${B.lab}지 ${A.zhi} 자형(自刑)`}); }
      if((A.zhi==='子'&&B.zhi==='卯')||(A.zhi==='卯'&&B.zhi==='子')){ out.push({type:'형', kind:'지지', a:A, b:B, txt:`${A.lab}지 ${A.zhi} · ${B.lab}지 ${B.zhi} 상형(相刑)`}); }
      // 천간합 (일간 포함 여부 표기)
      if(GAN_HAP[A.gan]===B.gan){ const el=GAN_HAP_EL[[A.gan,B.gan].sort((x,y)=>gi(x)-gi(y)).join('')];
        out.push({type:'간합', kind:'천간', a:A, b:B, txt:`${A.lab}간 ${A.gan} · ${B.lab}간 ${B.gan} 천간합(合${C.EL_HAN[el]||''})`}); }
    }
    // 삼형 (寅巳申·丑戌未 3자 모두)
    HYEONG3.forEach(tri=>{
      const hit=ps.filter(p=>tri.includes(p.zhi));
      const uniq=[...new Set(hit.map(p=>p.zhi))];
      if(uniq.length===3) out.push({type:'형', kind:'지지', txt:`${tri.join('·')} 삼형(三刑) 성립 (${hit.map(p=>p.lab).join('·')}지)`});
      else { // 2자 부분형도 표기 (寅巳, 巳申, 寅申 / 丑戌, 戌未, 丑未)
        if(uniq.length===2){ const labs=hit.map(p=>p.lab+'지').join('·');
          out.push({type:'형', kind:'지지', txt:`${uniq.join('·')} 형(刑) (${labs})`}); }
      }
    });
    // 삼합/반합
    SAMHAP.forEach(([a,b,c,el])=>{
      const have=[a,b,c].filter(z=>ps.some(p=>p.zhi===z));
      if(have.length===3) out.push({type:'삼합', kind:'지지', txt:`${a}·${b}·${c} 삼합(三合) → ${C.EL_HAN[el]}(${el}) 기운 강화`});
      else if(have.length===2 && have.includes(b)) // 왕지 포함 반합만 인정(통설)
        out.push({type:'반합', kind:'지지', txt:`${have.join('·')} 반합(半合) → ${C.EL_HAN[el]}(${el}) 기운 보강`});
    });
    return out;
  }

  /* 운(대운·세운) 간지 vs 원국: 충·합·형 여부 */
  function relVs(gz, pillars){
    const out=[];
    if(!gz) return out;
    const g=gz[0], z=gz[1];
    pillars.filter(p=>p.gan).forEach(p=>{
      if(C.CHUNG[z]===p.zhi) out.push({type:'충', with:p.lab, txt:`${p.lab}지 ${p.zhi}와 충`});
      if(HAP6[z]===p.zhi) out.push({type:'육합', with:p.lab, txt:`${p.lab}지 ${p.zhi}와 육합`});
      if(GAN_HAP[g]===p.gan) out.push({type:'간합', with:p.lab, txt:`${p.lab}간 ${p.gan}과 천간합`});
      if((z==='子'&&p.zhi==='卯')||(z==='卯'&&p.zhi==='子')) out.push({type:'형', with:p.lab, txt:`${p.lab}지 ${p.zhi}와 형`});
      HYEONG3.forEach(tri=>{ if(tri.includes(z)&&tri.includes(p.zhi)&&z!==p.zhi) out.push({type:'형', with:p.lab, txt:`${p.lab}지 ${p.zhi}와 형`}); });
    });
    // 중복 제거
    const seen=new Set();
    return out.filter(r=>{ const k=r.type+r.with; if(seen.has(k))return false; seen.add(k); return true; });
  }

  /* ---------- 격국 (간이: 월지 정기 십신 기준 8격 + 건록·양인) ---------- */
  function gyeokguk(s){
    const wolju=s.pillars.find(p=>p.lab==='월');
    if(!wolju||!wolju.zhi) return null;
    const main=mainGanOf(wolju.zhi);
    const god=C.ten10(s.dayGan, main);
    const name = god==='비견' ? '건록격' : god==='겁재' ? '양인격' : god+'격';
    return { name, god, monthZhi:wolju.zhi, mainGan:main };
  }

  /* ---------- 용신/희신/기신 (간이 억부법) ---------- */
  const REV_KE={목:'금',화:'수',토:'목',금:'화',수:'토'}; // 나를 극하는 오행(관성 방향)
  function yongsin(s){
    const de=s.dayEl;
    let yong, reason;
    if(s.body==='신약'){
      const inEl=C.REV_SHENG[de];
      if(s.oh[inEl]>0){ yong=inEl; reason=`일간(${de})의 힘이 약한 신약 사주라, 나를 낳아주는 인성 오행 ${C.EL_HAN[inEl]}(${inEl})으로 기운을 보태는 것이 우선입니다`; }
      else { yong=de; reason=`신약 사주인데 인성(${C.REV_SHENG[de]})이 원국에 없어, 같은 편인 비겁 오행 ${C.EL_HAN[de]}(${de})으로 직접 힘을 보탭니다`; }
    } else if(s.body==='신강'){
      const cands=[
        {el:C.SHENG[de], nm:'식상(내 기운을 표현으로 흘려보냄)'},
        {el:C.KE[de],    nm:'재성(기운을 재물 활동으로 소모)'},
        {el:REV_KE[de],  nm:'관성(기운을 규율로 제어)'}
      ].filter(c=>s.oh[c.el]>0).sort((a,b)=>s.oh[b.el]-s.oh[a.el]);
      const pick=cands[0]||{el:C.SHENG[de], nm:'식상(내 기운을 표현으로 흘려보냄)'};
      yong=pick.el;
      reason=`일간(${de})의 힘이 강한 신강 사주라, 넘치는 기운을 덜어내는 ${pick.nm} 오행 ${C.EL_HAN[yong]}(${yong})을 씁니다`;
    } else {
      yong=s.lack;
      reason=`강약이 균형(중화)에 가까워, 원국에서 가장 부족한 ${C.EL_HAN[s.lack]}(${s.lack}) 기운을 채우는 것을 용신으로 삼습니다`;
    }
    return { yong, hee:C.REV_SHENG[yong], gi:REV_KE[yong], reason };
  }

  /* ---------- 월지 조후 (계절·한난조습 간이) ---------- */
  const CLIMATE={
    寅:{season:'초봄', note:'아직 찬 기운이 남은 초봄생 — 따뜻한 화(火) 기운이 삶의 활력을 돕는 구조'},
    卯:{season:'한봄', note:'만물이 자라는 봄의 한가운데 태어나 성장·시작의 기운이 강함'},
    辰:{season:'늦봄', note:'봄에서 여름으로 넘어가는 환절기생 — 변화 적응력이 테마'},
    巳:{season:'초여름', note:'열기가 오르기 시작하는 초여름생 — 수(水)의 조절이 있으면 이상적'},
    午:{season:'한여름', note:'가장 뜨거운 한여름생 — 열기를 식히는 수(水) 기운이 귀한 구조'},
    未:{season:'늦여름', note:'덥고 건조한 늦여름생 — 수(水)·금(金)의 서늘함이 균형을 잡아줌'},
    申:{season:'초가을', note:'결실이 시작되는 초가을생 — 거두고 정리하는 기운을 타고남'},
    酉:{season:'한가을', note:'수확의 한가을생 — 결단·정리 기운이 강해 마무리에 능한 구조'},
    戌:{season:'늦가을', note:'가을에서 겨울로 가는 환절기생 — 건조한 토라 수(水) 보충이 반가움'},
    亥:{season:'초겨울', note:'물이 얼기 시작하는 초겨울생 — 따뜻한 화(火)가 조후를 살리는 구조'},
    子:{season:'한겨울', note:'가장 추운 한겨울생 — 화(火)의 온기가 인생의 난로 역할을 하는 구조'},
    丑:{season:'늦겨울', note:'얼어붙은 늦겨울생 — 화(火)의 해동 기운이 반가운 구조'}
  };

  /* ---------- 대운수 (생후 N년 M개월) ---------- */
  function daeunSu(s){
    try{
      const ec=s._raw && s._raw.ec; if(!ec) return null;
      const yun=ec.getYun(s.input.sex==='male'?1:0);
      const y=yun.getStartYear?yun.getStartYear():null;
      const m=yun.getStartMonth?yun.getStartMonth():null;
      const d=yun.getStartDay?yun.getStartDay():null;
      const first=(s.luck&&s.luck.daeun&&s.luck.daeun[0])?s.luck.daeun[0].startAge:null;
      return { y, m, d, age:first };
    }catch(e){ return null; }
  }

  /* ---------- 진입점 ---------- */
  function extend(s){
    if(!s || s.error) return null;
    const dayGan=s.dayGan, dayZhi=s.dayZhi;
    const yearZhi=(s.pillars.find(p=>p.lab==='년')||{}).zhi;
    const gm=gongmang(dayGan, dayZhi);
    const gwiin=CHEON_EUL[dayGan]||[];

    const pillars=s.pillars.map(p=>{
      if(!p.gan) return { lab:p.lab, gan:null, zhi:null };
      return {
        lab:p.lab, gan:p.gan, zhi:p.zhi,
        ssGan: p.lab==='일' ? '일간(나)' : C.ten10(dayGan, p.gan),
        ssZhi: C.ten10(dayGan, mainGanOf(p.zhi)),
        hide: ZHI_HIDE[p.zhi].map(h=>({ ...h, ss:C.ten10(dayGan, h.g) })),
        unseong: unseong(dayGan, p.zhi),
        sinsal: p.lab==='년' ? null : sinsal(yearZhi, p.zhi),
        gwiin: gwiin.includes(p.zhi),
        gongmang: gm.includes(p.zhi) && p.lab!=='일'
      };
    });

    const enrich=(gz)=>({
      god: C.ten10(dayGan, gz[0]),
      unseong: unseong(dayGan, gz[1]),
      rel: relVs(gz, s.pillars),
      gongmang: gm.includes(gz[1]),
      gwiin: gwiin.includes(gz[1]),
      sinsal: sinsal(yearZhi, gz[1])
    });
    const daeunEx=(s.luck?s.luck.daeun:[]).map(d=>({ ...d, ...enrich(d.gz) }));
    const saeunEx=(s.luck?s.luck.saeun:[]).map(y=>({ ...y, ...enrich(y.gz) }));

    let mingGong=null, taiYuan=null;
    try{ if(s._raw&&s._raw.ec){ mingGong=s._raw.ec.getMingGong(); taiYuan=s._raw.ec.getTaiYuan(); } }catch(e){}

    return {
      pillars, gongmangZhi:gm, gwiinZhi:gwiin,
      rel: relations(s.pillars),
      gyeok: gyeokguk(s),
      yong: yongsin(s),
      climate: (()=>{ const w=s.pillars.find(p=>p.lab==='월'); return w&&w.zhi ? {zhi:w.zhi, ...CLIMATE[w.zhi]} : null; })(),
      daeunSu: daeunSu(s),
      daeunEx, saeunEx,
      mingGong, taiYuan
    };
  }

  global.SAJU_EXT={
    ZHI_HIDE, UNSEONG, unseong, CHEON_EUL, gongmang, SINSAL_SEQ, sinsal,
    HAP6, SAMHAP, PA, HAE, GAN_HAP, relations, relVs,
    gyeokguk, yongsin, CLIMATE, daeunSu, mainGanOf, extend
  };
})(typeof window!=='undefined'?window:globalThis);
