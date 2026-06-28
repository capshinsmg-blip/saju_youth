/* =====================================================================
   saju.js — 사주(만세력) 계산 + 해석 공용 엔진 (확장판)
   계산은 검증된 lunar-javascript(6tail)에 위임 — 입춘/24절기/대운/세운/월운.
   십신·길흉·성향 해석은 자체 로직.
   ⚠️ 길흉/운세는 참고용이며 용신·격국에 따라 달라질 수 있음(단정 금지).
===================================================================== */
(function(global){
  'use strict';

  const GAN_KO={甲:'갑',乙:'을',丙:'병',丁:'정',戊:'무',己:'기',庚:'경',辛:'신',壬:'임',癸:'계'};
  const ZHI_KO={子:'자',丑:'축',寅:'인',卯:'묘',辰:'진',巳:'사',午:'오',未:'미',申:'신',酉:'유',戌:'술',亥:'해'};
  const GAN_EL={甲:'목',乙:'목',丙:'화',丁:'화',戊:'토',己:'토',庚:'금',辛:'금',壬:'수',癸:'수'};
  const ZHI_EL={寅:'목',卯:'목',巳:'화',午:'화',辰:'토',戌:'토',丑:'토',未:'토',申:'금',酉:'금',亥:'수',子:'수'};
  const ZHI_MAIN={子:'癸',丑:'己',寅:'甲',卯:'乙',辰:'戊',巳:'丙',午:'丁',未:'己',申:'庚',酉:'辛',戌:'戊',亥:'壬'};
  const YY={甲:1,丙:1,戊:1,庚:1,壬:1,乙:0,丁:0,己:0,辛:0,癸:0}; // 1=양 0=음
  const SHENG={목:'화',화:'토',토:'금',금:'수',수:'목'};
  const KE   ={목:'토',토:'수',수:'화',화:'금',금:'목'};
  const REV_SHENG={화:'목',토:'화',금:'토',수:'금',목:'수'}; // 나를 생하는 오행
  const EL_HAN={목:'木',화:'火',토:'土',금:'金',수:'水'};
  const EL_COLOR={목:'#4faf7d',화:'#e0625c',토:'#d8b13f',금:'#dfe3ec',수:'#5b8fd6'};
  const EL_DESC={목:'성장과 추진',화:'열정과 표현',토:'안정과 신뢰',금:'결단과 정리',수:'지혜와 유연'};
  const CHUNG={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};

  /* 일간(천간) 상세 성향 */
  const ILGAN={
    甲:{nick:'큰 나무(陽木)', essence:'하늘로 곧게 뻗는 거목. 명예와 체면을 중시하고, 한번 방향을 정하면 굽히지 않는 우직한 리더입니다.', strength:'책임감·개척정신·추진력. 큰 그림을 그리고 사람들을 이끄는 힘이 있어요.', weakness:'자존심이 세고 융통성이 부족해 한번 꺾이면 크게 흔들립니다. 굽히는 법을 배우면 더 단단해져요.', work:'주도적으로 판을 짜는 일, 리더 포지션이 어울립니다.', love:'듬직하지만 표현이 서툴 수 있어요. 먼저 다가가는 연습이 필요.'},
    乙:{nick:'화초·덩굴(陰木)', essence:'바위 틈에서도 자라는 부드럽고 끈질긴 생명력. 환경 적응의 달인이며 현실감각이 뛰어납니다.', strength:'유연함·친화력·생활력. 어디서든 살아남고 사람들과 잘 어울려요.', weakness:'속내를 잘 안 드러내고 의존적이거나 우유부단할 때가 있어요. 결정에 자신감을 더하면 좋아요.', work:'사람을 상대하거나 섬세한 조율이 필요한 일에 강합니다.', love:'다정하고 잘 맞춰주지만, 혼자 참다 지칠 수 있어요.'},
    丙:{nick:'태양(陽火)', essence:'온 세상을 비추는 태양. 밝고 화끈하며 숨김이 없고, 가는 곳마다 분위기를 살립니다.', strength:'열정·표현력·추진력. 사람을 끌어모으고 분위기를 주도해요.', weakness:'감정 기복과 욱하는 면, 뒤끝은 없지만 말이 앞설 수 있어요. 차분함을 더하면 빛납니다.', work:'무대·홍보·영업 등 드러나는 일에서 빛나요.', love:'화끈하게 표현하지만 식는 것도 빠를 수 있어요.'},
    丁:{nick:'촛불·등불(陰火)', essence:'어둠을 밝히는 따뜻한 불꽃. 겉은 차분하나 속은 뜨겁고, 집중력과 헌신이 깊습니다.', strength:'섬세함·집중력·배려. 한 분야를 깊게 파고들고 사람을 따뜻하게 챙겨요.', weakness:'예민하고 생각이 많아 속앓이를 하기 쉬워요. 마음을 표현하면 가벼워집니다.', work:'전문성·기술·연구처럼 깊이가 필요한 일에 강합니다.', love:'은근하고 깊게 사랑하지만 서운함을 쌓아두는 편.'},
    戊:{nick:'큰 산·대지(陽土)', essence:'모든 것을 품는 넓은 대지. 묵직하고 신뢰감을 주며, 중심을 잡아주는 사람입니다.', strength:'포용력·안정감·신뢰. 흔들리지 않고 사람들을 받쳐줘요.', weakness:'고집과 느린 변화. 답답해 보일 수 있고 속마음을 잘 안 보여요. 유연함을 더하면 좋아요.', work:'중재·관리·부동산·신뢰가 핵심인 일에 어울립니다.', love:'한결같고 듬직하지만 표현이 적어요.'},
    己:{nick:'논밭·정원(陰土)', essence:'곡식을 키우는 기름진 흙. 실속 있고 자상하며, 현실감각과 끈기가 남다릅니다.', strength:'성실함·현실감각·포용. 묵묵히 일구고 사람을 잘 길러요.', weakness:'걱정이 많고 자기 것을 잘 못 챙겨요. 거절하는 힘을 기르면 좋아요.', work:'교육·기획·살림처럼 꾸준히 가꾸는 일에 강합니다.', love:'헌신적이고 챙겨주지만 속으로 서운함을 키워요.'},
    庚:{nick:'원석·도끼(陽金)', essence:'다듬어지지 않은 강철. 의리 있고 결단력이 강하며, 불의를 못 참는 강단형입니다.', strength:'결단력·추진력·의리. 한번 마음먹으면 끝까지 밀어붙여요.', weakness:'직설적이고 욱하는 면, 융통성 부족. 말을 다듬으면 신뢰가 커져요.', work:'개혁·영업·운동·군경처럼 강단이 필요한 일에 어울립니다.', love:'화끈하고 시원하지만 표현이 거칠 수 있어요.'},
    辛:{nick:'보석·칼(陰金)', essence:'세공된 보석. 예민하고 세련되었으며, 자존심과 완벽주의가 강한 디테일의 장인입니다.', strength:'섬세함·미적 감각·완벽주의. 깔끔하고 빈틈없이 마무리해요.', weakness:'상처를 잘 받고 까칠해질 수 있어요. 칭찬에 약하니 자기 인정을 키우면 좋아요.', work:'디자인·미용·정밀·금융처럼 디테일이 중요한 일에 강합니다.', love:'은근히 자존심이 세고, 인정받고 싶어 해요.'},
    壬:{nick:'바다·강(陽水)', essence:'쉼 없이 흐르는 큰 물. 스케일이 크고 지혜로우며, 자유롭고 유연한 사고를 합니다.', strength:'지혜·융통성·포용·추진. 큰 흐름을 읽고 유연하게 대처해요.', weakness:'변덕과 산만함, 한곳에 머물기 어려워요. 중심을 잡으면 큰일을 해냅니다.', work:'기획·무역·유통·콘텐츠처럼 흐름과 확장이 있는 일에 강합니다.', love:'자유롭고 매력적이지만 한 사람에 정착이 늦을 수 있어요.'},
    癸:{nick:'빗물·이슬(陰水)', essence:'만물을 적시는 맑은 물. 차분하고 직관적이며, 섬세한 감수성과 상상력이 풍부합니다.', strength:'직관·감수성·적응력. 분위기를 읽고 섬세하게 스며들어요.', weakness:'생각·걱정이 많고 우울에 잘 빠져요. 감정을 흘려보내는 법을 익히면 좋아요.', work:'기획·상담·예술·연구처럼 감성과 통찰이 필요한 일에 강합니다.', love:'깊고 섬세하게 사랑하지만 혼자 상상하고 상처받기 쉬워요.'}
  };

  const PILLAR_MEAN={
    년:{role:'뿌리·조상', age:'초년(0~20대)', life:'타고난 배경과 사회적 뿌리'},
    월:{role:'환경·부모', age:'청년(20~40대)', life:'사회성·직업·성장 환경'},
    일:{role:'나·배우자', age:'중년(40~50대)', life:'본질적인 나와 배우자 자리'},
    시:{role:'결실·자녀', age:'말년(50대~)', life:'미래·자녀·노년의 결실'}
  };
  const REC={
    목:{color:'청색·녹색', stone:'아벤츄린·페리도트', dir:'동쪽'},
    화:{color:'적색·분홍', stone:'가넷·카닐리언', dir:'남쪽'},
    토:{color:'황색·갈색', stone:'타이거아이·시트린', dir:'중앙'},
    금:{color:'백색·금색', stone:'하울라이트·문스톤', dir:'서쪽'},
    수:{color:'흑색·남색', stone:'블랙오닉스·라피스라줄리', dir:'북쪽'}
  };
  const TENGOD_MEAN={비겁:'자기 자신·경쟁·동료',식상:'표현·재능·활동',재성:'재물·금전(남성은 이성)',관성:'직업·명예(여성은 이성)',인성:'문서·공부·보호'};

  /* 10정 십신 */
  const SHISHEN_SHORT={
    비견:'독립심·동료·경쟁이 강해지는', 겁재:'경쟁·지출·재물 변동에 주의할',
    식신:'표현·여유·먹을 복이 좋은', 상관:'재능 발휘 이면에 구설·말조심이 필요한',
    편재:'활동적 재물·사업·인맥이 살아나는', 정재:'안정적 재물·성실함이 결실 맺는',
    편관:'압박·도전·과로·관재에 주의할', 정관:'명예·직장·책임이 올라가는',
    편인:'생각이 깊어지나 고립감·변덕에 주의할', 정인:'학문·문서·귀인의 도움이 드는'
  };
  const SHISHEN_MEAN={
    비견:'자립·경쟁·동료', 겁재:'경쟁·재물 변동', 식신:'여유·표현·식복', 상관:'재능·자유·구설',
    편재:'유동 재물·사업·사교', 정재:'고정 재물·성실', 편관:'압박·도전·권력', 정관:'명예·직장·규율',
    편인:'독창·눈치·고독', 정인:'보호·학문·문서'
  };
  const GOOD=new Set(['정관','정재','정인','식신','편재']);
  const CAUTION=new Set(['편관','상관','겁재','편인']);

  function ten5(D,E){ if(E===D)return'비겁'; if(SHENG[D]===E)return'식상'; if(KE[D]===E)return'재성'; if(KE[E]===D)return'관성'; if(SHENG[E]===D)return'인성'; }
  function ten10(Dgan, Tgan){
    const de=GAN_EL[Dgan], te=GAN_EL[Tgan], same=YY[Dgan]===YY[Tgan];
    if(te===de) return same?'비견':'겁재';
    if(SHENG[de]===te) return same?'식신':'상관';
    if(KE[de]===te) return same?'편재':'정재';
    if(KE[te]===de) return same?'편관':'정관';
    if(SHENG[te]===de) return same?'편인':'정인';
  }
  function toneOf(god){ return GOOD.has(god)?{l:'길',c:'good'}:CAUTION.has(god)?{l:'주의',c:'warn'}:{l:'평',c:'neu'}; }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function compute(inp){
    if(typeof global.Solar==='undefined'||typeof global.Lunar==='undefined') return {error:'lib'};
    const hourKnown = inp.hour!==null && inp.hour!==undefined && inp.hour!=='';
    const hour = hourKnown ? +inp.hour : 12;
    let lunarObj;
    try{
      if(inp.calendar==='lunar'){
        const m = inp.leap ? -Math.abs(+inp.mo) : +inp.mo;
        const l = global.Lunar.fromYmdHms(+inp.y, m, +inp.d, hour,0,0);
        if(l.getYear()!==+inp.y || Math.abs(l.getMonth())!==Math.abs(+inp.mo) || l.getDay()!==+inp.d || (l.getMonth()<0)!==!!inp.leap) return {error:'date'};
        lunarObj=l;
      } else {
        const dt=new Date(+inp.y,+inp.mo-1,+inp.d);
        if(dt.getFullYear()!==+inp.y||dt.getMonth()!==+inp.mo-1||dt.getDate()!==+inp.d) return {error:'date'};
        lunarObj=global.Solar.fromYmdHms(+inp.y,+inp.mo,+inp.d,hour,0,0).getLunar();
      }
    } catch(e){ return {error:'date'}; }
    if(!lunarObj) return {error:'date'};
    let ec; try{ ec=lunarObj.getEightChar(); }catch(e){ return {error:'date'}; }

    const pillars=[
      {lab:'시', gan:hourKnown?ec.getTimeGan():null, zhi:hourKnown?ec.getTimeZhi():null},
      {lab:'일', gan:ec.getDayGan(), zhi:ec.getDayZhi()},
      {lab:'월', gan:ec.getMonthGan(), zhi:ec.getMonthZhi()},
      {lab:'년', gan:ec.getYearGan(), zhi:ec.getYearZhi()}
    ];
    const dayGan=ec.getDayGan(), dayZhi=ec.getDayZhi(), dayEl=GAN_EL[dayGan];

    const chars=[]; pillars.forEach(p=>{ if(p.gan)chars.push(p.gan); if(p.zhi)chars.push(p.zhi); });
    const oh={목:0,화:0,토:0,금:0,수:0}, tg={비겁:0,식상:0,재성:0,관성:0,인성:0};
    chars.forEach(c=>{ const e=GAN_EL[c]||ZHI_EL[c]; oh[e]++; tg[ten5(dayEl,e)]++; });
    const total=chars.length;

    const money=clamp(Math.round(46+(tg.재성/total)*130+(tg.식상/total)*36),38,97);
    const loveStar=inp.sex==='female'?tg.관성:tg.재성;
    const love=clamp(Math.round(46+(loveStar/total)*130+(oh.화/total)*30),38,97);

    const order=['목','화','토','금','수']; let lack=order[0],strong=order[0];
    order.forEach(e=>{ if(oh[e]<oh[lack])lack=e; if(oh[e]>oh[strong])strong=e; });

    // 신강/신약: (비겁=일간오행) + (인성=나를 생하는 오행) 비중
    const inEl=REV_SHENG[dayEl];
    const support=oh[dayEl]+oh[inEl];
    const strengthRatio=support/total;
    const body = strengthRatio>=0.45?'신강':strengthRatio<=0.28?'신약':'중화';

    // 우세 십신(5)
    let domGod='비겁'; Object.keys(tg).forEach(k=>{ if(tg[k]>tg[domGod])domGod=k; });

    let solarStr=''; try{ const s=lunarObj.getSolar(); solarStr=`${s.getYear()}-${String(s.getMonth()).padStart(2,'0')}-${String(s.getDay()).padStart(2,'0')}`; }catch(e){}

    // ===== 대운·세운·월운 =====
    let luck=null;
    try{
      const gender = inp.sex==='male'?1:0;
      const nowY = inp.now || (new Date()).getFullYear();
      const yun = ec.getYun(gender);
      const dyArr = yun.getDaYun()||[];
      const daeun=[]; const yearMap={}; let curLN=null;
      dyArr.forEach(dn=>{
        const gz=dn.getGanZhi();
        if(gz) daeun.push({startAge:dn.getStartAge(), endAge:dn.getEndAge?dn.getEndAge():dn.getStartAge()+9, startYear:dn.getStartYear(), endYear:dn.getEndYear?dn.getEndYear():dn.getStartYear()+9, gz});
        const lns=dn.getLiuNian?dn.getLiuNian():[];
        lns.forEach(y=>{ const yr=y.getYear(); yearMap[yr]={gz:y.getGanZhi(), age:y.getAge?y.getAge():null, _ln:y}; if(yr===nowY)curLN=y; });
      });
      const saeun=[];
      for(let yr=nowY; yr<nowY+10; yr++){ if(yearMap[yr]) saeun.push({year:yr, gz:yearMap[yr].gz, age:yearMap[yr].age}); }
      let wolun=[];
      if(curLN && curLN.getLiuYue){ wolun=(curLN.getLiuYue()||[]).filter(m=>m.getGanZhi()).map((m,i)=>({idx:i+1, cn:m.getMonthInChinese?m.getMonthInChinese():'', gz:m.getGanZhi()})); }
      luck={ daeun, saeun, wolun, nowY, startInfo: (yun.getStartYear?yun.getStartYear():null) };
    } catch(e){ luck=null; }

    return {error:null, input:inp, pillars, dayGan, dayZhi, dayEl, oh, tg, total, money, love, lack, strong, hourKnown, solarStr, body, domGod, luck};
  }

  function grade(v){ return v>=80?'매우 좋음':v>=65?'좋음':v>=50?'보통':'보완 필요'; }

  /* ===== 기존 해석 ===== */
  function money(s){ const js=s.tg.재성,ss=s.tg.식상; let body;
    if(js>=2) body=`재물을 상징하는 <b>재성(財星)이 ${js}개</b>로 뚜렷해, 돈이 들어오는 길이 여러 갈래예요. 기회가 왔을 때 잡는 추진형.`;
    else if(js===1) body=`재성이 <b>1개</b> 있어 재물운의 씨앗은 있어요. 식상(재능·활동, ${ss}개)을 키우면 돈으로 잘 연결돼요.`;
    else body=`재성이 드러나 있지 않아 <b>한 방보다 꾸준한 관리형</b>이 어울려요. 식상(재능·활동, ${ss}개)을 수익으로 바꾸는 전략이 좋아요.`;
    return {grade:grade(s.money), body}; }
  function love(s){ const star=s.input.sex==='female'?s.tg.관성:s.tg.재성; const nm=s.input.sex==='female'?'관성(官星)':'재성(財星)'; const hwa=s.oh.화; let body;
    if(star>=2) body=`이성·인연을 상징하는 <b>${nm}이 ${star}개</b>로 뚜렷해, 인연의 기회가 자주 와요.`;
    else if(star===1) body=`${nm}이 <b>1개</b> 있어 인연의 기운은 있어요. 표현력을 더하면 매력이 살아나요.`;
    else body=`${nm}이 약해 인연이 늦거나 신중한 편일 수 있어요. 화(火)의 표현·활동을 늘리면 매력 발산에 도움돼요.`;
    body += hwa>=2?` 화(火)가 ${hwa}개로 표현력·끌림은 좋은 편이에요.`:` 화(火)가 ${hwa}개로 감정 표현을 의식적으로 더하면 좋아요.`;
    return {grade:grade(s.love), body}; }
  function ilgan(s){ const g=ILGAN[s.dayGan]; return `당신의 일간은 <b>${s.dayGan}(${GAN_KO[s.dayGan]}·${s.dayEl})</b> — '${g.nick}' 유형이에요. ${g.essence}`; }
  function balance(s){ if(s.strong===s.lack) return `오행이 비교적 고르게 분포해 균형형이에요.`;
    return `<b>${EL_HAN[s.strong]}(${s.strong})</b> 기운이 가장 강하고 <b>${EL_HAN[s.lack]}(${s.lack})</b> 기운이 부족해요. ${EL_HAN[s.lack]}(${s.lack}·${EL_DESC[s.lack]})을 채우면 균형이 좋아져요.`; }

  /* ===== 상세 성향 (메인) ===== */
  const DOM_TRAIT={
    비겁:'<b>자기 주관과 독립심</b>이 강합니다. 누구에게 기대기보다 스스로 헤쳐나가려 하고, 경쟁 상황에서 힘을 내요. 다만 고집과 자기중심이 강해질 수 있으니 협업에서 한 걸음 양보하면 더 큰 사람이 됩니다.',
    식상:'<b>표현력과 창의성</b>이 돋보입니다. 말·글·재능으로 자신을 드러내고 자유로운 걸 좋아해요. 끼와 아이디어가 많지만, 하고 싶은 말을 다 하다 구설에 오를 수 있으니 완급 조절이 핵심이에요.',
    재성:'<b>현실감각과 실리</b>가 뛰어납니다. 돈·결과·효율을 빠르게 계산하고 사람들과 두루 어울려요. 추진력이 좋지만 일을 너무 벌이면 지칠 수 있으니 선택과 집중이 필요해요.',
    관성:'<b>책임감과 자기관리</b>가 강합니다. 규칙·명예·체면을 중시하고 맡은 바를 끝까지 해내요. 신뢰를 주지만 스스로를 너무 몰아붙여 압박을 받기 쉬우니 쉼표가 필요해요.',
    인성:'<b>사색과 수용력</b>이 깊습니다. 배우고 받아들이는 힘이 좋고 정신적·내면적 가치를 중시해요. 신중하지만 생각이 많아 실행이 늦을 수 있으니, 작게라도 바로 시작하는 습관이 도움돼요.'
  };
  const BODY_TRAIT={
    신강:'사주의 기운이 <b>강(身强)</b>합니다. 주관이 뚜렷하고 추진력·자신감이 좋아 스스로 끌고 가는 힘이 있어요. 대신 고집·독선으로 비칠 수 있으니, 베풀고 비우는 방향(활동·나눔)으로 기운을 풀면 운이 트입니다.',
    신약:'사주의 기운이 <b>약(身弱)</b>한 편입니다. 섬세하고 배려심이 깊으며 주변과 조화를 잘 이뤄요. 대신 귀가 얇거나 결정을 미룰 수 있으니, 내 편(인맥·배움)을 곁에 두고 자신감을 채우면 크게 성장합니다.',
    중화:'사주의 기운이 <b>비교적 균형(中和)</b> 잡혀 있어요. 상황에 따라 강·약을 오가며 유연하게 대처하는 편이라, 극단보다 조율에 강합니다.'
  };
  function personality(s){
    const g=ILGAN[s.dayGan];
    return {
      head:`${s.dayGan}(${GAN_KO[s.dayGan]}·${s.dayEl}) — ${g.nick}`,
      essence:g.essence,
      blocks:[
        {t:'💪 강점', v:g.strength},
        {t:'⚠️ 약점·보완점', v:g.weakness},
        {t:'🧭 기운의 강약', v:BODY_TRAIT[s.body]},
        {t:`🔑 두드러진 기질 (${s.domGod})`, v:DOM_TRAIT[s.domGod]},
        {t:'🤝 대인관계', v:g.relation || ''},
        {t:'💼 일·진로 스타일', v:g.work},
        {t:'💕 연애 스타일', v:g.love}
      ].filter(b=>b.v),
      summary:`정리하면 ${GAN_KO[s.dayGan]}${s.dayEl} 일간의 ${s.body} 사주로, ${DOM_TRAIT[s.domGod].replace(/<[^>]+>/g,'').split('.')[0]} 기질이 핵심입니다. 부족한 ${EL_HAN[s.lack]}(${s.lack}) 기운을 보완하면 균형이 좋아져요.`
    };
  }

  /* ===== 대운·세운·월운 해석 ===== */
  function gz2ko(gz){ return GAN_KO[gz[0]]+ZHI_KO[gz[1]]; }
  function periodInfo(s, gz){
    const god=ten10(s.dayGan, gz[0]);
    const t=toneOf(god);
    const chung = CHUNG[gz[1]]===s.dayZhi;
    let text = `${god} 기운 — ${SHISHEN_SHORT[god]} 시기.`;
    if(chung) text += ' 일지와 충(沖)이 들어 이동·변동·관계 변화가 큰 해이니 신중하게.';
    const warn = t.c==='warn' || chung;
    return {god, tone:t, chung, text, warn};
  }
  function daeunList(s){ if(!s.luck) return []; return s.luck.daeun.map(d=>{ const i=periodInfo(s,d.gz);
    return {age:`${d.startAge}~${d.endAge}세`, years:`${d.startYear}~${d.endYear}`, gz:d.gz, ko:gz2ko(d.gz), ...i}; }); }
  function saeunList(s){ if(!s.luck) return []; return s.luck.saeun.map(y=>{ const i=periodInfo(s,y.gz);
    return {year:y.year, gz:y.gz, ko:gz2ko(y.gz), ...i}; }); }
  function wolunList(s){ if(!s.luck) return []; return s.luck.wolun.map(m=>{ const i=periodInfo(s,m.gz);
    return {idx:m.idx, gz:m.gz, ko:gz2ko(m.gz), god:i.god, tone:i.tone, text:`${i.god} — ${SHISHEN_SHORT[i.god]} 달.` }; }); }
  function cautions(s){ // 향후 10년 + 대운 중 조심 시기
    const out=[];
    saeunList(s).forEach(y=>{ if(y.warn) out.push(`${y.year}년(${y.ko}·${y.god})`+(y.chung?' ※일지 충':'')); });
    return out;
  }
  function curDaeun(s){ if(!s.luck) return null; const now=s.luck.nowY; const d=s.luck.daeun.find(x=>now>=x.startYear&&now<=x.endYear); if(!d) return null; const i=periodInfo(s,d.gz); return {age:`${d.startAge}~${d.endAge}세`, years:`${d.startYear}~${d.endYear}`, gz:d.gz, ko:gz2ko(d.gz), ...i}; }

  /* ===== 관심분야(고민) 맞춤 풀이 ===== */
  const CONCERN_HEALTH={
    목:'간·담(肝膽)·근육·눈. 스트레스로 기운이 뭉치기 쉬우니 산책·스트레칭으로 풀고, 신맛·녹색 채소가 도움돼요.',
    화:'심장·소장·혈관. 과로·흥분으로 열이 오르기 쉬워요. 규칙적인 수면과 카페인 절제, 쓴맛 나물·붉은 채소가 좋아요.',
    토:'비위·소화기. 생각이 많으면 소화부터 막혀요. 따뜻한 음식·규칙적 식사, 곡물·뿌리채소를 챙기세요.',
    금:'폐·대장·피부·기관지. 건조·환절기에 약하니 호흡기 보온, 생강·무 등 흰 음식이 도움돼요.',
    수:'신장·방광·뼈. 과로·한기에 약해요. 충분한 수분·휴식, 해조류·검은콩 등 검은 음식으로 보강하세요.'
  };
  function concern(s, key){
    if(!key) return null;
    const tg=s.tg, oh=s.oh, R=REC[s.lack];
    const tip = `부족한 <b>${EL_HAN[s.lack]}(${s.lack})</b> 기운을 ${R.color}·${R.stone}(${R.dir})으로 보완하면 흐름에 도움돼요.`;
    if(key==='연애'){
      const L=love(s);
      const extra = s.body==='신강' ? '기운이 강한 편이라 끌고 가려는 마음이 앞설 수 있어요. 상대의 속도에 한 박자 맞추면 인연이 오래갑니다.'
                  : s.body==='신약' ? '섬세하고 배려가 깊어 좋은 파트너가 되지만, 끌려가지 않도록 내 마음을 분명히 표현하세요.'
                  : '강약을 유연하게 오가 관계 조율에 강해요. 솔직한 대화가 인연을 키웁니다.';
      return {title:'💕 연애 맞춤 풀이', body:`${L.body}<br><br>${extra} ${tip}`};
    }
    if(key==='금전'){
      const M=money(s);
      const extra = tg.재성>=2 ? '재성이 강해 기회형이지만 욕심이 과하면 새기 쉬우니 분산·저축 습관이 핵심이에요.'
                  : tg.식상>=2 ? '식상(재능)이 강해 \u201c내 능력을 돈으로 바꾸는\u201d 구조가 잘 맞아요. 콘텐츠·기술·프리랜스가 유리해요.'
                  : '큰 한 방보다 꾸준한 관리·복리형이 어울려요. 고정 지출을 줄이고 종잣돈을 모으는 전략이 좋아요.';
      return {title:'💰 금전 맞춤 풀이', body:`${M.body}<br><br>${extra} ${tip}`};
    }
    if(key==='진로'){
      const style = tg.관성>=2 ? '관성(조직·명예)이 강해 <b>안정된 조직·전문직·공직</b>에서 신뢰를 쌓을 때 빛나요.'
                  : tg.식상>=2 ? '식상(표현·창작)이 강해 <b>창작·교육·기획·1인 사업</b> 등 자유롭게 표현하는 일이 맞아요.'
                  : tg.재성>=2 ? '재성(실리·영업)이 강해 <b>사업·영업·재무</b> 등 결과로 말하는 분야가 유리해요.'
                  : '특정 십신이 치우치지 않아 여러 분야에 적응해요. 관심 분야를 한 곳에 모으면 전문성이 빨리 쌓입니다.';
      const body2 = s.body==='신강' ? '추진력이 좋아 주도적 역할·창업에 강하고,' : s.body==='신약' ? '협업·서포트·전문 보좌 역할에서 안정적으로 성장하고,' : '주도와 협업을 오가며 균형 있게 성장하고,';
      return {title:'💼 진로 맞춤 풀이', body:`${style} ${body2} ${tip}`};
    }
    if(key==='대인관계'){
      const body1 = tg.비겁>=2 ? '비겁이 강해 동료·친구가 많고 의리파지만, 경쟁·고집으로 부딪힐 수 있어 한 발 양보가 관계를 지켜요.'
                  : tg.인성>=2 ? '인성이 강해 윗사람·조력자 복이 있고 잘 배워요. 받기만 하지 말고 먼저 베풀면 인덕이 커집니다.'
                  : '두루 무난하게 어울리는 편이에요. 마음 맞는 소수와 깊게 가는 쪽이 더 편할 수 있어요.';
      const tone = oh.화>=2 ? '표현이 따뜻해 사람을 잘 끌어요.' : '감정 표현을 조금 더 드러내면 오해가 줄어요.';
      return {title:'🤝 대인관계 맞춤 풀이', body:`${body1} ${tone} ${tip}`};
    }
    if(key==='건강'){
      const weak = CONCERN_HEALTH[s.lack]||'';
      const strongNote = oh[s.strong]>=3 ? ` 반대로 ${EL_HAN[s.strong]}(${s.strong}) 기운은 강해(${oh[s.strong]}개) 과열되기 쉬우니 과로·과식을 조심하세요.` : '';
      return {title:'🩺 건강 맞춤 풀이', body:`체질상 <b>${EL_HAN[s.lack]}(${s.lack})</b> 기운이 약해 관련 부위를 챙기면 좋아요 — ${weak}${strongNote}`};
    }
    return {title:'🔎 관심분야 풀이', body:`\u2018${key}\u2019 관심사예요. ${tip}`};
  }

  global.SAJU={
    GAN_KO,ZHI_KO,GAN_EL,ZHI_EL,EL_HAN,EL_COLOR,EL_DESC,ILGAN,PILLAR_MEAN,REC,TENGOD_MEAN,SHISHEN_MEAN,
    compute, grade, ten10,
    describe:{ money, love, ilgan, balance, personality, daeunList, saeunList, wolunList, cautions, curDaeun, concern }
  };
})(typeof window!=='undefined'?window:globalThis);
