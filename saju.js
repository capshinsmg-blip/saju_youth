/* =====================================================================
   saju.js — 사주(만세력) 계산 + 해석 공용 엔진
   index.html(공개 진단)과 admin.html(관리자 풀이)이 함께 사용.
   계산은 검증된 lunar-javascript(6tail)에 위임 — 입춘/24절기 정확 적용.
===================================================================== */
(function(global){
  'use strict';

  /* ---- 매핑 ---- */
  const GAN_KO={甲:'갑',乙:'을',丙:'병',丁:'정',戊:'무',己:'기',庚:'경',辛:'신',壬:'임',癸:'계'};
  const ZHI_KO={子:'자',丑:'축',寅:'인',卯:'묘',辰:'진',巳:'사',午:'오',未:'미',申:'신',酉:'유',戌:'술',亥:'해'};
  const GAN_EL={甲:'목',乙:'목',丙:'화',丁:'화',戊:'토',己:'토',庚:'금',辛:'금',壬:'수',癸:'수'};
  const ZHI_EL={寅:'목',卯:'목',巳:'화',午:'화',辰:'토',戌:'토',丑:'토',未:'토',申:'금',酉:'금',亥:'수',子:'수'};
  const SHENG={목:'화',화:'토',토:'금',금:'수',수:'목'};
  const KE   ={목:'토',토:'수',수:'화',화:'금',금:'목'};
  const EL_HAN={목:'木',화:'火',토:'土',금:'金',수:'水'};
  const EL_COLOR={목:'#4faf7d',화:'#e0625c',토:'#d8b13f',금:'#dfe3ec',수:'#5b8fd6'};
  const EL_DESC={목:'성장과 추진',화:'열정과 표현',토:'안정과 신뢰',금:'결단과 정리',수:'지혜와 유연'};

  /* 일간(천간) 성향 */
  const ILGAN={
    甲:{nick:'큰 나무', txt:'곧고 진취적인 리더형. 자존심이 높고 시작하는 힘이 강해요.'},
    乙:{nick:'화초·덩굴', txt:'유연하고 섬세한 생활형. 적응력이 뛰어나고 끈질겨요.'},
    丙:{nick:'태양', txt:'밝고 열정적인 표현형. 활동적이고 사람을 끌어모아요.'},
    丁:{nick:'촛불·등불', txt:'따뜻하고 섬세한 헌신형. 집중력과 배려심이 깊어요.'},
    戊:{nick:'큰 산·대지', txt:'듬직하고 포용력 있는 중심형. 신뢰를 주는 사람이에요.'},
    己:{nick:'논밭·정원', txt:'실속 있고 자상한 현실형. 끈기와 생활감각이 좋아요.'},
    庚:{nick:'원석·도끼', txt:'결단력 있고 의리 있는 강단형. 추진력과 정의감이 강해요.'},
    辛:{nick:'보석·칼', txt:'예민하고 세련된 완벽형. 자존심과 디테일 감각이 뛰어나요.'},
    壬:{nick:'바다·강', txt:'스케일 크고 지혜로운 포용형. 융통성과 추진력이 있어요.'},
    癸:{nick:'빗물·이슬', txt:'차분하고 직관적인 감성형. 섬세함과 상상력이 풍부해요.'}
  };

  /* 4기둥 의미 */
  const PILLAR_MEAN={
    년:{role:'뿌리·조상', age:'초년(0~20대)', life:'타고난 배경과 사회적 뿌리'},
    월:{role:'환경·부모', age:'청년(20~40대)', life:'사회성·직업·성장 환경'},
    일:{role:'나·배우자', age:'중년(40~50대)', life:'본질적인 나와 배우자 자리'},
    시:{role:'결실·자녀', age:'말년(50대~)', life:'미래·자녀·노년의 결실'}
  };

  /* 부족 오행 → 추천 색/원석/방위 */
  const REC={
    목:{color:'청색·녹색', stone:'아벤츄린·페리도트', dir:'동쪽'},
    화:{color:'적색·분홍', stone:'가넷·카닐리언', dir:'남쪽'},
    토:{color:'황색·갈색', stone:'타이거아이·시트린', dir:'중앙'},
    금:{color:'백색·금색', stone:'하울라이트·문스톤', dir:'서쪽'},
    수:{color:'흑색·남색', stone:'블랙오닉스·라피스라줄리', dir:'북쪽'}
  };

  const TENGOD_MEAN={
    비겁:'자기 자신·경쟁·동료',
    식상:'표현·재능·활동',
    재성:'재물·금전(남성은 이성)',
    관성:'직업·명예(여성은 이성)',
    인성:'문서·공부·보호'
  };

  function tenGod(D,E){
    if(E===D) return '비겁';
    if(SHENG[D]===E) return '식상';
    if(KE[D]===E) return '재성';
    if(KE[E]===D) return '관성';
    if(SHENG[E]===D) return '인성';
  }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  /* ---- 핵심 계산 ----
     inp = {calendar:'solar'|'lunar', y, mo, d, leap:bool, hour:Number|null, sex:'female'|'male'} */
  function compute(inp){
    if(typeof global.Solar==='undefined'||typeof global.Lunar==='undefined') return {error:'lib'};
    const hourKnown = inp.hour!==null && inp.hour!==undefined && inp.hour!=='';
    const hour = hourKnown ? +inp.hour : 12;
    let lunarObj;
    try{
      if(inp.calendar==='lunar'){
        const m = inp.leap ? -Math.abs(+inp.mo) : +inp.mo;
        const l = global.Lunar.fromYmdHms(+inp.y, m, +inp.d, hour,0,0);
        // 왕복 검증: 라이브러리가 잘못된 음력일을 보정/롤오버하면 거부
        if(l.getYear()!==+inp.y || Math.abs(l.getMonth())!==Math.abs(+inp.mo)
           || l.getDay()!==+inp.d || (l.getMonth()<0)!==!!inp.leap){
          return {error:'date'};
        }
        lunarObj = l;
      } else {
        // 존재하지 않는 양력일(2/30, 4/31 등) 거부 — JS Date 왕복 검증
        const dt=new Date(+inp.y, +inp.mo-1, +inp.d);
        if(dt.getFullYear()!==+inp.y || dt.getMonth()!==+inp.mo-1 || dt.getDate()!==+inp.d){
          return {error:'date'};
        }
        lunarObj = global.Solar.fromYmdHms(+inp.y, +inp.mo, +inp.d, hour,0,0).getLunar();
      }
    } catch(e){ return {error:'date'}; }
    if(!lunarObj) return {error:'date'};

    let ec;
    try{ ec = lunarObj.getEightChar(); } catch(e){ return {error:'date'}; }

    const pillars=[
      {lab:'시', gan:hourKnown?ec.getTimeGan():null, zhi:hourKnown?ec.getTimeZhi():null},
      {lab:'일', gan:ec.getDayGan(), zhi:ec.getDayZhi()},
      {lab:'월', gan:ec.getMonthGan(), zhi:ec.getMonthZhi()},
      {lab:'년', gan:ec.getYearGan(), zhi:ec.getYearZhi()}
    ];
    const dayGan=ec.getDayGan();
    const dayEl=GAN_EL[dayGan];

    const chars=[];
    pillars.forEach(p=>{ if(p.gan)chars.push(p.gan); if(p.zhi)chars.push(p.zhi); });
    const oh={목:0,화:0,토:0,금:0,수:0};
    const tg={비겁:0,식상:0,재성:0,관성:0,인성:0};
    chars.forEach(c=>{ const e=GAN_EL[c]||ZHI_EL[c]; oh[e]++; tg[tenGod(dayEl,e)]++; });
    const total=chars.length;

    const money=clamp(Math.round(46 + (tg.재성/total)*130 + (tg.식상/total)*36), 38, 97);
    const loveStar = inp.sex==='female' ? tg.관성 : tg.재성;
    const love=clamp(Math.round(46 + (loveStar/total)*130 + (oh.화/total)*30), 38, 97);

    const order=['목','화','토','금','수'];
    let lack=order[0], strong=order[0];
    order.forEach(e=>{ if(oh[e]<oh[lack])lack=e; if(oh[e]>oh[strong])strong=e; });

    let solarStr='';
    try{ const s=lunarObj.getSolar(); solarStr=`${s.getYear()}-${String(s.getMonth()).padStart(2,'0')}-${String(s.getDay()).padStart(2,'0')}`; }catch(e){}

    return {error:null, input:inp, pillars, dayGan, dayEl, oh, tg, total, money, love, lack, strong, hourKnown, solarStr};
  }

  /* ---- 해석 텍스트 생성 ---- */
  function grade(v){ return v>=80?'매우 좋음':v>=65?'좋음':v>=50?'보통':'보완 필요'; }

  function money(s){
    const js=s.tg.재성, ss=s.tg.식상;
    let body;
    if(js>=2) body=`재물을 상징하는 <b>재성(財星)이 ${js}개</b>로 뚜렷해, 돈이 들어오는 길이 여러 갈래예요. 기회가 왔을 때 잡는 추진형.`;
    else if(js===1) body=`재성이 <b>1개</b> 있어 재물운의 씨앗은 있어요. 식상(재능·활동, ${ss}개)을 키우면 돈으로 잘 연결돼요.`;
    else body=`재성이 드러나 있지 않아 <b>한 방보다 꾸준한 관리형</b>이 어울려요. 식상(재능·활동, ${ss}개)을 수익으로 바꾸는 전략이 좋아요.`;
    return {grade:grade(s.money), body};
  }
  function love(s){
    const star = s.input.sex==='female' ? s.tg.관성 : s.tg.재성;
    const nm = s.input.sex==='female' ? '관성(官星)' : '재성(財星)';
    const hwa=s.oh.화;
    let body;
    if(star>=2) body=`이성·인연을 상징하는 <b>${nm}이 ${star}개</b>로 뚜렷해, 인연의 기회가 자주 와요.`;
    else if(star===1) body=`${nm}이 <b>1개</b> 있어 인연의 기운은 있어요. 표현력을 더하면 매력이 살아나요.`;
    else body=`${nm}이 약해 인연이 늦거나 신중한 편일 수 있어요. 화(火)의 표현·활동을 늘리면 매력 발산에 도움돼요.`;
    body += hwa>=2 ? ` 화(火)가 ${hwa}개로 표현력·끌림은 좋은 편이에요.` : ` 화(火)가 ${hwa}개로 감정 표현을 의식적으로 더하면 좋아요.`;
    return {grade:grade(s.love), body};
  }
  function ilgan(s){
    const g=ILGAN[s.dayGan];
    return `당신의 일간은 <b>${s.dayGan}(${GAN_KO[s.dayGan]}·${s.dayEl})</b> — '${g.nick}' 유형이에요. ${g.txt}`;
  }
  function balance(s){
    if(s.strong===s.lack) return `오행이 비교적 고르게 분포해 균형형이에요.`;
    return `<b>${EL_HAN[s.strong]}(${s.strong})</b> 기운이 가장 강하고 <b>${EL_HAN[s.lack]}(${s.lack})</b> 기운이 부족해요. ${EL_HAN[s.lack]}(${s.lack}·${EL_DESC[s.lack]})을 채우면 균형이 좋아져요.`;
  }

  global.SAJU={
    GAN_KO, ZHI_KO, GAN_EL, ZHI_EL, EL_HAN, EL_COLOR, EL_DESC,
    ILGAN, PILLAR_MEAN, REC, TENGOD_MEAN,
    compute, grade,
    describe:{ money, love, ilgan, balance }
  };
})(typeof window!=='undefined'?window:globalThis);
