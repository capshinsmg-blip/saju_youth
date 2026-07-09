/* =====================================================================
   saju-report.js — 풀이자용 12단계 리포트 + 고객용 명식표 HTML 생성
   (관리자 전용, DOM 없음. saju.js → saju-ext.js 다음에 로드)

   설계: 조합 폭발을 피하기 위해 사전은 전부 "단일 축"(일간10/십신10/
   운성12/오행5/격국10/신강약3)만 키로 갖고, 문장은 실제 카운트·연도·
   간지를 끼워 넣어 조립한다. 판단마다 근거(why)를 붙이고, 전문 용어는
   리포트 내 첫 등장에서 쉬운 말로 풀어쓴다(term).
   ⚠️ 격국·용신은 간이 판정 — 각 섹션에 고지.
===================================================================== */
(function(global){
  'use strict';
  const C=global.SAJU, X=global.SAJU_EXT;
  if(!C||!X){ if(typeof console!=='undefined') console.error('[saju-report] saju.js/saju-ext.js 먼저 로드'); return; }

  /* ================= 용어 사전 (첫 등장 시 자동 풀이) ================= */
  const GLOSS={
    일간:'사주의 주인공, 태어난 날의 천간 = 나 자신',
    십성:'여덟 글자가 나(일간)와 맺는 관계를 10가지로 분류한 것',
    십신:'여덟 글자가 나(일간)와 맺는 관계를 10가지로 분류한 것',
    지장간:'지지(땅의 글자) 속에 숨어 있는 하늘의 기운',
    '12운성':'기운이 태어나 자라고 저무는 12단계 생애 주기',
    신강:'일간의 힘이 강해 스스로 끌고 가는 사주',
    신약:'일간의 힘이 약해 도움을 받으며 크는 사주',
    격국:'사주의 큰 골격·직업적 그릇을 나타내는 틀',
    용신:'이 사주의 균형을 잡아주는 가장 요긴한 오행',
    희신:'용신을 도와주는 오행',
    기신:'용신을 방해해 흐름을 꼬이게 하는 오행',
    충:'지지끼리 정면으로 부딪혀 자리가 흔들리는 관계',
    합:'글자끼리 끌어안아 묶이는 관계',
    형:'마찰과 조정(수술·법·다툼)의 관계',
    공망:'비어 있는 자리 — 애써도 허전하기 쉬운 영역',
    대운:'10년마다 바뀌는 인생의 큰 계절',
    세운:'해마다 바뀌는 그 해의 기운',
    재성:'재물과 결과를 뜻하는 별(남성에겐 이성의 별)',
    관성:'직장·명예·규율의 별(여성에겐 이성의 별)',
    인성:'공부·문서·보호자의 별',
    식상:'표현·재능·활동의 별',
    비겁:'나와 같은 기운 — 자립심·동료·경쟁의 별',
    조후:'사주의 계절적 추위·더위를 맞추는 조절'
  };
  let TERMS=new Set();
  const term=(w)=>{ const k=String(w); if(GLOSS[k] && !TERMS.has(k)){ TERMS.add(k); return `<b>${k}</b><span class="rp-gl">(${GLOSS[k]})</span>`; } return `<b>${k}</b>`; };

  /* ================= 공용 헬퍼 ================= */
  const p=t=>`<p class="rp-p">${t}</p>`;
  const h4=t=>`<div class="rp-h4">${t}</div>`;
  const why=t=>`<div class="rp-why">근거 — ${t}</div>`;
  const note=t=>`<div class="rp-note">${t}</div>`;
  const chip=(t,cls)=>`<span class="rp-chip ${cls||''}">${t}</span>`;
  const ul=items=>`<ul class="rp-ul">${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
  const elko=el=>`${C.EL_HAN[el]}(${el})`;
  const gzko=gz=>gz?`${gz}(${C.GAN_KO[gz[0]]}${C.ZHI_KO[gz[1]]})`:'-';

  /* 십신 10분류 카운트 (천간 + 지지 정기 기준) */
  function count10(s){
    const out={비견:0,겁재:0,식신:0,상관:0,편재:0,정재:0,편관:0,정관:0,편인:0,정인:0};
    s.pillars.forEach(pp=>{
      if(!pp.gan) return;
      if(pp.lab!=='일') out[C.ten10(s.dayGan, pp.gan)]++;
      out[C.ten10(s.dayGan, X.mainGanOf(pp.zhi))]++;
    });
    return out;
  }

  /* 대운/세운에서 특정 십신 그룹이 오는 구간·연도 추출 */
  const GROUP={ 재성:['편재','정재'], 관성:['편관','정관'], 인성:['편인','정인'], 식상:['식신','상관'], 비겁:['비견','겁재'] };
  function daeunOf(x, gods){ return (x.daeunEx||[]).filter(d=>gods.includes(d.god)); }
  function saeunOf(x, gods){ return (x.saeunEx||[]).filter(y=>gods.includes(y.god)); }
  function fmtDaeun(d){ return `${d.startYear}~${d.endYear}년(${d.startAge}~${d.endAge}세, ${gzko(d.gz)} ${d.god} 대운)`; }
  function fmtSaeun(y){ return `${y.year}년(${gzko(y.gz)}·${y.god})`; }

  /* ================= 콘텐츠 사전 ================= */
  const UNSEONG_DESC={
    장생:{word:'새싹·시작', life:'새로 태어나 자라는 기운 — 배움·성장의 에너지가 깃든 자리', luck:'새 출발·배움·새 인연이 순조롭게 풀리는 흐름'},
    목욕:{word:'매력·시행착오', life:'멋을 알고 유혹도 많은 기운 — 감성과 매력, 구설이 함께하는 자리', luck:'매력·인기가 오르지만 유혹과 시행착오, 구설도 따라오는 흐름'},
    관대:{word:'패기·도전', life:'예복을 갖춰 입고 세상에 나서는 기운 — 패기와 자존심의 자리', luck:'자격·타이틀을 얻고 당당하게 나서기 좋은 흐름'},
    건록:{word:'자립·실력', life:'제 밥벌이를 스스로 하는 기운 — 실력으로 서는 자립의 자리', luck:'실력이 인정받고 밥그릇이 단단해지는 흐름'},
    제왕:{word:'정점·주도권', life:'기운의 정점 — 카리스마와 주도권, 독선 주의가 함께하는 자리', luck:'영향력이 정점으로 가되 독주와 과욕은 화를 부르는 흐름'},
    쇠:{word:'노련·수성', life:'정점을 지나 노련해진 기운 — 지키는 힘의 자리', luck:'확장보다 지키기 — 노련한 관리가 이득인 흐름'},
    병:{word:'감성·공감', life:'기운이 앓아 눕는 자리 — 대신 감수성과 공감력이 깊어짐', luck:'에너지가 떨어지기 쉬워 건강·페이스 관리가 우선인 흐름'},
    사:{word:'몰입·전문', life:'움직임이 멎는 자리 — 한 우물을 파는 몰입과 전문성', luck:'화려함보다 깊이 — 공부·전문화에 맞는 흐름'},
    묘:{word:'저장·수렴', life:'창고에 갈무리하는 기운 — 모으고 아끼는 힘의 자리', luck:'재물·지식을 차곡차곡 쌓되 답답함은 감수해야 하는 흐름'},
    절:{word:'단절·전환', life:'끊어지고 다시 이어지는 기운 — 극적인 전환의 자리', luck:'끊어짐과 새 연결이 교차하는 큰 전환의 흐름'},
    태:{word:'잉태·구상', life:'새 생명이 막 맺히는 기운 — 아이디어와 가능성의 자리', luck:'결과보다 씨앗을 심는 준비·구상이 맞는 흐름'},
    양:{word:'양육·준비', life:'뱃속에서 길러지는 기운 — 보호 속에서 크는 자리', luck:'실전보다 실력을 기르는 쪽이 남는 흐름'}
  };
  const GYEOK_DESC={
    식신격:{easy:'타고난 재능과 표현으로 먹고사는 그릇', theme:'즐기며 만들어 내놓는 것에서 결실이 나는 구조', work:'콘텐츠·요리·교육·서비스 등 무언가를 만들어 내놓는 일'},
    상관격:{easy:'끼와 언변이 무기인 그릇', theme:'틀을 깨는 재능 — 구설 관리가 평생 과제', work:'방송·마케팅·영업·예술 등 표현력이 곧 실력인 일'},
    편재격:{easy:'큰돈을 굴리고 도는 활동가 그릇', theme:'돈은 굴려야 붙는 유통 재물의 구조', work:'사업·영업·유통·투자 등 판을 굴리는 일'},
    정재격:{easy:'성실히 벌어 착실히 모으는 그릇', theme:'꾸준함과 신용이 최대 자산인 구조', work:'재무·관리·실무 등 신용이 쌓일수록 커지는 일'},
    편관격:{easy:'압박을 견디며 권한을 얻는 승부사 그릇', theme:'시련이 곧 승진 사다리인 구조', work:'군경·법·의료·현장 지휘 등 강단이 필요한 일'},
    정관격:{easy:'규칙과 명예를 지키는 모범 그릇', theme:'신뢰와 직위가 재산인 구조', work:'공직·대기업·전문직 등 제도권 안에서 크는 일'},
    편인격:{easy:'남다른 직관과 전문지식으로 사는 그릇', theme:'비주류의 깊이 — 고독 관리가 과제인 구조', work:'연구·기술·의술·심리·역술 등 전문 지식업'},
    정인격:{easy:'배움과 문서·자격이 밥이 되는 그릇', theme:'공부복·귀인복을 타고난 구조', work:'교육·행정·연구 등 자격 기반 전문직'},
    건록격:{easy:'맨손으로 서는 자수성가 그릇', theme:'스스로 서야 커지는 운명 구조', work:'자영업·전문 프리랜서 등 내 실력이 간판인 일'},
    양인격:{easy:'칼 같은 결단과 승부 기질의 그릇', theme:'강한 추진력 — 과격함 조절이 과제인 구조', work:'수술·정비·스포츠·구조 등 칼·기술·승부의 일'}
  };
  const MONEY_TYPE={
    월급축적형:{how:'정해진 수입을 착실히 쌓을 때 가장 안전하게 커지는 돈', max:'중년 이후 복리·부동산으로 정점을 만드는 그림', risk:'한탕 투자·보증이 최대 리스크', strategy:'선저축 후지출 원칙 + 장기 우량자산. 부업은 본업을 해치지 않는 선까지만'},
    사업유통형:{how:'돈을 굴리고 사람을 움직여 버는 돈 — 고여 있으면 오히려 마르는 구조', max:'판이 커지는 재성 대운에서 자산이 점프', risk:'확장 과속과 동업 지분 분쟁', strategy:'현금흐름 관리 철저 + 수익 일부는 반드시 손대기 어려운 자산으로 격리'},
    성과영업형:{how:'성과급·수수료·인센티브처럼 움직인 만큼 들어오는 돈', max:'네트워크가 무르익는 시기부터 수직 상승', risk:'수입 기복 — 좋은 달 기준으로 지출을 세팅하는 습관', strategy:'수입의 기준선을 낮게 잡고, 성과분은 전액 저축·투자로 돌리기'},
    전문직형:{how:'자격·전문성·신용 그 자체가 돈이 되는 구조', max:'경력·자격이 쌓일수록 늦지만 길게 우상향', risk:'전문성 밖 영역(투자·사업)에서의 손실', strategy:'몸값을 올리는 재투자(공부·자격)가 이 사주 최고의 재테크'},
    재능콘텐츠형:{how:'재능·콘텐츠·기술을 세상에 내놓아 버는 돈', max:'대표작·대표 기술이 터지는 시기가 곧 재물의 정점', risk:'수익화 전에 열정이 소진되는 것, 저작권·계약 손해', strategy:'재능을 상품으로 바꾸는 구조(플랫폼·계약·저작권)를 먼저 세팅'},
    기복관리형:{how:'벌 때는 크게 벌지만 나갈 때도 큰 파도형 재물', max:'파도의 고점 — 단, 고점에서 지킨 돈만이 진짜 자산', risk:'주변 사람(빌려줌·보증·동업)으로 새는 돈', strategy:'번 돈의 절반은 손 못 대는 곳에 격리하고, 금전 거래는 반드시 문서로'}
  };
  const CAREER_TYPE={
    조직형:{fit:'체계가 있는 조직에서 직위가 오를수록 강해지는 타입', style:'책임을 맡을 때 성과가 나는 스타일', tip:'승진·시험·임용 등 제도권 사다리를 적극 활용할 것'},
    전문기술형:{fit:'지식·기술·자격 기반의 전문 영역이 본진', style:'한 우물을 깊게 파는 몰입형', tip:'증명 가능한 전문성(자격·학위·포트폴리오) 축적이 최고의 무기'},
    창업형:{fit:'내 판을 직접 짜는 독립·창업이 맞는 타입', style:'지시받기보다 끌고 갈 때 능률이 나는 스타일', tip:'창업 자체보다 시스템과 파트너 리스크 관리가 성패를 가름'},
    프리랜서형:{fit:'자유로운 계약·프로젝트 기반이 맞는 타입', style:'틀에 묶이면 시드는 자유 노동형', tip:'포트폴리오와 단가 협상력이 곧 연봉'},
    영업사업형:{fit:'사람과 시장을 상대로 결과를 만드는 일이 본진', style:'숫자로 평가받을 때 오히려 강해지는 스타일', tip:'인맥의 자산화 — 관계가 곧 매출로 연결되는 구조'},
    균형실무형:{fit:'특정 축에 치우치지 않아 여러 직무에 적응하는 타입', style:'조율·중간 관리에 강한 멀티플레이어', tip:'전문 분야 하나를 정해 깊이를 더하면 몸값이 뛰는 구조'}
  };
  const SPOUSE_GONG={
    비견:{attract:'친구처럼 대등하고 편한 상대', spouse:'주관이 뚜렷하고 독립적인 배우자', issue:'서로 지지 않으려는 기싸움 — 역할 분담을 명확히 하면 오래갑니다'},
    겁재:{attract:'승부욕을 자극하는 매력적인 상대', spouse:'화끈하지만 소유욕·경쟁심이 강한 배우자', issue:'돈 관리 주도권 다툼 — 지갑 규칙을 문서처럼 정해두는 것이 답'},
    식신:{attract:'같이 있으면 편하고, 잘 먹고 잘 웃는 상대', spouse:'다정하고 생활력 있는 배우자', issue:'편안함이 늘어짐이 되지 않도록 함께 크는 목표가 필요'},
    상관:{attract:'재기발랄하고 대화가 통하는 상대', spouse:'센스 있지만 말로 이기려 드는 배우자', issue:'말끝의 상처가 누적 — 비판 대신 요청으로 바꿔 말하기'},
    편재:{attract:'스케일 크고 활동적인 상대', spouse:'사교적이고 씀씀이가 큰 배우자', issue:'소비·투자 스타일 차이 — 공동 예산 원칙이 필요'},
    정재:{attract:'착실하고 반듯한 상대', spouse:'알뜰하고 헌신적인 배우자', issue:'안정 지향이 답답함으로 느껴질 때 — 계획된 일탈로 환기'},
    편관:{attract:'강하고 카리스마 있는 상대', spouse:'박력 있지만 통제 성향이 있는 배우자', issue:'힘의 균형 문제 — 눌림이 쌓이기 전에 선을 그어야 함'},
    정관:{attract:'듬직하고 사회적으로 인정받는 상대', spouse:'책임감 강한 모범형 배우자', issue:'체면·규칙 중시가 낭만 부족으로 — 의식적인 이벤트가 약'},
    편인:{attract:'신비롭고 지적인 상대', spouse:'생각이 깊지만 속을 잘 안 보이는 배우자', issue:'침묵의 벽 — 감정을 말로 꺼내는 규칙을 함께 만들 것'},
    정인:{attract:'포근하게 품어주는 상대', spouse:'헌신적이고 어른스러운 배우자', issue:'받는 것에 익숙해져 표현을 잊는 것 — 고마움은 그 자리에서'}
  };
  const DOMAIN_LINE={
    비견:{돈:'내 몫은 스스로 벌지만 나눌 일(동업·경조·분담)도 함께 늘어나는 흐름', 직업:'독립·이직 욕구가 커지고 내 이름을 걸고 싶어지는 때', 연애:'친구 같은 인연 — 연인보다 동료처럼 흐르지 않게 표현이 필요', 건강:'과로형 부상·근골격 주의', 관계:'동료·친구가 늘지만 경쟁 구도도 함께 생김'},
    겁재:{돈:'지출·투자 유혹이 커져 방어가 최우선인 흐름', 직업:'승부수를 던지고 싶은 충동 — 검증된 판에서만', 연애:'경쟁이 섞인 인연(삼각관계·라이벌) 주의', 건강:'무리한 승부(음주·과로·격한 운동)로 몸이 상하기 쉬움', 관계:'돈이 얽힌 관계가 틀어지기 쉬움 — 빌려주면 잃는 시기'},
    식신:{돈:'재능·부업이 수입으로 연결되는 순풍', 직업:'실무 성과가 좋아지고 일이 즐거워지는 때', 연애:'자연스러운 만남·모임에서 인연이 드는 흐름', 건강:'식복이 붙는 만큼 체중·혈당 관리', 관계:'베푸는 만큼 돌아오는 순환이 잘 도는 때'},
    상관:{돈:'아이디어로 버는 돈과 말로 잃는 돈이 공존', 직업:'창작·기획엔 최고, 윗사람·규정과의 마찰은 조심', 연애:'표현은 화려하나 말실수 한 번이 화근', 건강:'신경성 — 예민함이 소화·수면으로 나타남', 관계:'구설 주의 — SNS·뒷말 자제가 상책'},
    편재:{돈:'돈의 파이프가 굵어지는 확장기 — 굴리되 반은 지킬 것', 직업:'영업·사업·대외 활동에서 성과가 나는 때', 연애:'화려한 만남 운 — 진지함은 따로 확인', 건강:'과로·과음 등 소모전 주의', 관계:'인맥이 크게 늘고 돈과 사람이 같이 움직임'},
    정재:{돈:'수입이 자리 잡고 저축이 쌓이는 안정기', 직업:'성실함이 평가로 돌아오는 때', 연애:'차분하고 진지한 인연이 드는 흐름', 건강:'규칙적인 생활로 컨디션이 안정되는 때', 관계:'약속을 지킨 만큼 신용이 자산이 되는 시기'},
    편관:{돈:'책임·부채의 압박이 커질 수 있어 보수적 운용', 직업:'시련과 승진이 함께 오는 승부처', 연애:'강렬하지만 소모적인 인연 조심', 건강:'과로·사고수 — 이 시기 최우선 관리 항목', 관계:'윗사람·권력과의 관계가 운명을 가르는 때'},
    정관:{돈:'직위 상승과 함께 수입이 계단식으로 오르는 흐름', 직업:'승진·합격·임명 등 제도권 상승 운', 연애:'책임질 줄 아는 반듯한 인연이 드는 흐름', 건강:'책임 스트레스 — 목·어깨 긴장 관리', 관계:'평판이 좋아지고 어른들의 인정을 받는 때'},
    편인:{돈:'수입보다 배움·자기계발에 돈이 나가는 때', 직업:'전문성·자격 취득에 최적 — 실행은 다소 더딤', 연애:'마음의 벽이 올라가 혼자가 편해지는 시기', 건강:'입맛·수면 리듬과 마음 건강을 우선 관리', 관계:'좁고 깊게 재편 — 고립까지 가지 않게 경계'},
    정인:{돈:'문서·계약·부동산에 길한 흐름', 직업:'배움·자격·귀인의 추천이 길을 여는 때', 연애:'어른의 소개·안정형 인연이 드는 흐름', 건강:'회복력이 좋아지는 보호받는 시기', 관계:'귀인·스승 운 — 받은 도움은 꼭 갚아 인덕으로'}
  };
  const SINSAL_DESC={
    겁살:'빼앗기기 쉬운 기운 — 소유·계약 관리가 포인트', 재살:'권력·시비와 얽히는 기운 — 법적 분쟁을 멀리', 천살:'불가항력의 벽을 만나는 기운 — 겸손이 보험',
    지살:'터전이 움직이는 기운 — 이사·전근·이동', 도화살:'사람을 끄는 매력 — 인기이자 구설의 씨앗', 월살:'메마른 고초의 기운 — 결실이 더딜 때 조급함 금물',
    망신살:'체면이 상할 일을 조심 — 노출·구설 관리', 장성살:'앞에서 이끄는 장군의 기운 — 리더십', 반안살:'말안장에 오르는 기운 — 승진·안정',
    역마살:'이동·여행·해외의 기운 — 움직여야 풀림', 육해살:'잔병·잔근심의 기운 — 건강 루틴이 답', 화개살:'예술·학문·정신세계로 파고드는 고독한 재능'
  };
  const REL_DESC={
    충:'정면으로 부딪혀 자리가 흔들리는 관계 — 이동·변동·재편의 신호', 육합:'서로 끌어안아 묶이는 관계 — 결속·협력',
    삼합:'세 글자의 뜻이 모여 큰 세력을 이루는 관계', 반합:'부분적으로 세력이 모이는 관계',
    형:'마찰을 통해 교정되는 관계 — 조정·수술·법적 문제와 인연', 파:'깨지는 관계 — 계획이 틀어지기 쉬움',
    해:'은근히 훼방 놓는 관계 — 뒤에서 새는 기운', 간합:'마음이 묶이는 천간의 합 — 관계·계약의 결속'
  };
  const EL_EXCESS_HEALTH={
    목:'간·담 계통의 과열 — 분노 조절과 눈 피로 관리', 화:'심혈관 계통의 과열 — 흥분·불면·혈압 관리',
    토:'소화기 정체 — 위장 부담과 생각 과다 관리', 금:'호흡기·피부 건조와 긴장성 통증 관리', 수:'신장·방광 계통과 냉증 — 몸을 차게 두지 말 것'
  };

  /* ================= 분류기 ================= */
  function moneyType(s, t10){
    const jae=t10.편재+t10.정재, sik=t10.식신+t10.상관, bi=t10.비견+t10.겁재;
    if(jae===0 || bi>=3) return '기복관리형';
    if(t10.편재>=t10.정재 && jae>=2) return '사업유통형';
    if(t10.정재>t10.편재 && (t10.정관+t10.편관)>=1) return '월급축적형';
    if(sik>=2 && jae<=1) return '재능콘텐츠형';
    if(sik>=2 && jae>=1) return '성과영업형';
    if((t10.편인+t10.정인)>=2) return '전문직형';
    return '월급축적형';
  }
  function careerType(s, t10){
    const gwan=t10.편관+t10.정관, inn=t10.편인+t10.정인, sik=t10.식신+t10.상관, jae=t10.편재+t10.정재, bi=t10.비견+t10.겁재;
    if(bi>=2 && sik>=1 && s.body==='신강') return '창업형';
    if(gwan>=2) return '조직형';
    if(inn>=2) return '전문기술형';
    if(sik>=2 && gwan<=1) return '프리랜서형';
    if(jae>=2) return '영업사업형';
    return '균형실무형';
  }

  /* 반복 테마 플래그 (성립분만 우선순위로 채택) */
  function themeFlags(s, x, t10){
    const F=[];
    const add=(cond,txt)=>{ if(cond) F.push(txt); };
    const chungCnt=x.rel.filter(r=>r.type==='충').length;
    add(t10.편재+t10.정재===0, '원국에 재성이 드러나지 않아, 돈·결과보다 과정과 의미를 좇게 되는 삶 — 돈 관리는 시스템(자동이체·전문가)에 맡기는 편이 유리');
    add(t10.편관+t10.정관===0, '관성이 없어 규율·조직과의 인연이 옅음 — 스스로 정한 규칙이 곧 커리어의 뼈대');
    add(t10.편인+t10.정인>=3, '인성 과다 — 생각이 실행을 앞질러 기회를 흘려보내는 패턴, "작게 바로 시작"이 평생 처방');
    add(t10.비견+t10.겁재>=3, '비겁 과다 — 사람은 모이지만 돈이 사람을 타고 새는 패턴, 금전 거래 문서화가 생존 규칙');
    add(t10.식신+t10.상관>=3, '식상 과다 — 재능과 표현은 넘치나 마무리와 꾸준함이 과제');
    add(chungCnt>=2, `원국 안에 충이 ${chungCnt}개 — 자리 이동(이사·이직·관계 재편)이 잦은 인생 구조, 변화를 두려워하지 않는 것이 오히려 무기`);
    add(x.rel.some(r=>r.type==='충' && r.a && r.b && (r.a.lab==='일'||r.b.lab==='일')), '일지(배우자·파트너 자리)에 충 — 가까운 관계의 흔들림이 반복 테마, 거리 조절이 지혜');
    add(x.pillars.some(pp=>pp.sinsal==='도화살'), '도화의 기운 — 사람을 끄는 매력이 기회이자 구설의 리스크');
    add(x.pillars.some(pp=>pp.sinsal==='역마살'), '역마의 기운 — 이동·변화 속에서 기회를 잡는 구조, 한곳에 고이면 답답해짐');
    add(x.pillars.some(pp=>pp.sinsal==='화개살'), '화개의 기운 — 혼자 파고드는 정신적 깊이, 예술·학문과 인연');
    add(x.pillars.some(pp=>pp.gwiin), '천을귀인 보유 — 위기의 순간마다 돕는 사람이 나타나는 복');
    add(x.pillars.some(pp=>pp.gongmang), '공망이 든 자리 — 그 영역은 채워도 허전하기 쉬워, 물질보다 의미로 채워야 만족');
    add(s.body==='신강'&&t10.비견+t10.겁재>=2, '자수성가 구조 — 스스로 벌고 스스로 지켜야 하는 운명, 기댈 곳을 찾기보다 판을 만드는 쪽');
    add(s.body==='신약'&&t10.편인+t10.정인>=1, '지원 속에서 크는 구조 — 좋은 스승·조직·귀인을 곁에 두는 것이 성장의 지름길');
    add(s.oh[s.lack]===0, `${elko(s.lack)} 기운이 0개 — ${C.EL_DESC[s.lack]}의 영역이 인생의 숙제로 반복 등장`);
    return F.slice(0,5);
  }

  /* ================= S1. 만세력 판독 요약 ================= */
  function sec1(s, x, a){
    const labs=['시','일','월','년'];
    const cols=labs.map(l=>x.pillars.find(pp=>pp.lab===l));
    const cal=a.calendar==='lunar'?('음력'+(a.leap?'(윤달)':'')):'양력';
    const hourTxt=a.hour===null||a.hour===undefined||a.hour===''?'시간 모름(시주 제외)':a.hour+'시경';

    const th=cols.map(c=>`<th>${c.lab}주</th>`).join('');
    const row=(label, fn)=>`<tr><td class="rp-rl">${label}</td>${cols.map(c=>`<td>${c.gan?fn(c):'<span class="rp-dim">-</span>'}</td>`).join('')}</tr>`;
    const elBg=g=>{ const el=C.GAN_EL[g]||C.ZHI_EL[g]; return `style="color:${ELP[el].fg}"`; };
    const msTable=`<div class="rp-scroll"><table class="rp-ms">
      <tr><td class="rp-rl"></td>${th}</tr>
      ${row('십성(간)', c=>c.lab==='일'?'<b class="rp-me">일간(나)</b>':c.ssGan)}
      ${row('천간', c=>`<span class="rp-big" ${elBg(c.gan)}>${c.gan}</span><small>${C.GAN_KO[c.gan]}·${elko(C.GAN_EL[c.gan])}</small>`)}
      ${row('지지', c=>`<span class="rp-big" ${elBg(c.zhi)}>${c.zhi}</span><small>${C.ZHI_KO[c.zhi]}·${elko(C.ZHI_EL[c.zhi])}</small>`)}
      ${row('십성(지)', c=>c.ssZhi)}
      ${row('지장간', c=>c.hide.map(hd=>`<div class="rp-hd">${hd.g} <small>${hd.r}·${hd.ss}</small></div>`).join(''))}
      ${row('12운성', c=>c.unseong)}
      ${row('신살', c=>{
        const tags=[];
        if(c.gwiin) tags.push('<span class="rp-tag gd">천을귀인</span>');
        if(c.gongmang) tags.push('<span class="rp-tag wr">공망</span>');
        if(c.sinsal) tags.push(`<span class="rp-tag">${c.sinsal}</span>`);
        return tags.join('')||'<span class="rp-dim">-</span>';
      })}
    </table></div>`;

    const ohRow=['목','화','토','금','수'].map(e=>`<span class="rp-oh" style="background:${ELP[e].bg};color:${ELP[e].fg}">${C.EL_HAN[e]} ${s.oh[e]}</span>`).join('');
    const su=x.daeunSu;
    const suTxt=su&&su.y!=null?`생후 ${su.y}년 ${su.m||0}개월 무렵(약 ${su.age}세)부터 10년 주기의 ${term('대운')}이 시작됩니다.`:'';
    const strip=(x.daeunEx||[]).map(d=>{ const cur=s.luck&&s.luck.nowY>=d.startYear&&s.luck.nowY<=d.endYear;
      return `<span class="rp-dstrip${cur?' cur':''}"><b>${d.startAge}</b><br>${d.gz}</span>`; }).join('');

    return h4('명식(命式) — 여덟 글자 한눈에 보기')
      + p(`${a.name||'-'} · ${a.sex==='female'?'여성':'남성'} · ${cal} ${a.y}.${a.mo}.${a.d} ${hourTxt} (양력 환산 ${s.solarStr||'-'}) 기준의 만세력입니다. ${term('십성')}·${term('지장간')}·${term('12운성')}까지 판독한 원본 표이니, 아래 해설을 읽는 내내 이 표를 기준 삼으세요.`)
      + msTable
      + h4('오행 분포')
      + `<div class="rp-ohrow">${ohRow}</div>`
      + p(`여덟 글자 ${s.total}자 중 가장 강한 기운은 ${elko(s.strong)}(${s.oh[s.strong]}개), 가장 약한 기운은 ${elko(s.lack)}(${s.oh[s.lack]}개)입니다.`)
      + h4('대운의 시작과 배열')
      + p(suTxt)
      + `<div class="rp-dstripwrap">${strip}</div>`
      + (x.mingGong?note(`참고 — 명궁(마음의 지향점) ${gzko(x.mingGong)}, 태원(잉태의 기운) ${gzko(x.taiYuan)}. 보조 지표로만 참고하세요.`):'');
  }

  /* ================= S2. 원국 핵심 구조 ================= */
  function sec2(s, x){
    const g=C.ILGAN[s.dayGan];
    const t10=count10(s);
    const de=s.dayEl;
    const support=s.oh[de]+s.oh[C.REV_SHENG[de]];
    const pct=Math.round(support/s.total*100);
    const wolju=s.pillars.find(pp=>pp.lab==='월');
    const wolEl=wolju&&wolju.zhi?C.ZHI_EL[wolju.zhi]:null;
    const deukryeong=wolEl&&(wolEl===de||C.SHENG[wolEl]===de);
    const gd=x.gyeok?GYEOK_DESC[x.gyeok.name]:null;
    const themes=themeFlags(s,x,t10);
    const relList=x.rel.length?ul(x.rel.map(r=>`${r.txt} — <span class="rp-dim">${REL_DESC[r.type]||''}</span>`)):p('원국 안에서 두드러진 합·충·형은 없습니다. 글자들끼리 크게 싸우지 않는, 비교적 정돈된 판입니다.');

    let html='';
    // 1) 일간
    html+=h4('일간 — 타고난 본질');
    html+=p(`${term('일간')}은 ${s.dayGan}(${C.GAN_KO[s.dayGan]}·${de}), '${g.nick}'입니다. ${g.essence}`);
    html+=p(`강점은 ${g.strength} 반대로 ${g.weakness}`);
    // 2) 신강약
    html+=h4('기운의 강약 — 신강/신약 판정');
    html+=p(`이 사주는 <b>${s.body}</b>으로 판정합니다. ${s.body==='신강'?term('신강'):s.body==='신약'?term('신약'):'<b>중화</b>(강약이 균형에 가까움)'} — ${C.BODY_TRAIT[s.body]}`);
    html+=why(`일간과 같은 편인 오행(비겁 ${elko(de)} ${s.oh[de]}개 + 인성 ${elko(C.REV_SHENG[de])} ${s.oh[C.REV_SHENG[de]]}개)이 전체 ${s.total}자 중 ${support}개(${pct}%)${deukryeong?', 게다가 계절(월지)의 힘까지 얻은 득령 상태':''}. 45% 이상이면 신강, 28% 이하면 신약으로 보는 간이 억부 기준입니다.`);
    // 3) 월지·조후
    if(x.climate){
      html+=h4('태어난 계절 — 월지와 조후');
      html+=p(`월지 ${wolju.zhi}(${C.ZHI_KO[wolju.zhi]}), ${x.climate.season}생입니다. ${x.climate.note}. ${term('조후')} 관점의 큰 방향으로 참고하세요.`);
    }
    // 4) 오행 과다/과소
    html+=h4('오행의 과다와 과소');
    html+=p(`가장 강한 ${elko(s.strong)}(${s.oh[s.strong]}개)은 ${C.EL_DESC[s.strong]}의 기운으로 이 사람의 기본 엔진이고, 가장 약한 ${elko(s.lack)}(${s.oh[s.lack]}개)은 ${C.EL_DESC[s.lack]}의 영역 — 평생 의식적으로 채워야 하는 숙제입니다.`);
    // 5) 격국
    if(x.gyeok&&gd){
      html+=h4('격국 — 사주의 큰 골격');
      html+=p(`${term('격국')}은 <b>${x.gyeok.name}</b>. 쉽게 말하면 '${gd.easy}'입니다. ${gd.theme}. 직업적으로는 ${gd.work} 쪽에서 그릇이 커집니다.`);
      html+=why(`월지 ${x.gyeok.monthZhi}의 정기(중심 기운) ${x.gyeok.mainGan}이 일간 기준 ${x.gyeok.god}에 해당 — 월지 정기 십성으로 격을 잡는 간이 판정이며, 전문 감정의 정밀 격국과 다를 수 있습니다.`);
    }
    // 6) 용신
    if(x.yong){
      const r=C.REC[x.yong.yong];
      html+=h4('용신 — 이 사주의 열쇠 오행');
      html+=p(`${term('용신')}은 ${elko(x.yong.yong)}, ${term('희신')}은 ${elko(x.yong.hee)}, ${term('기신')}은 ${elko(x.yong.gi)}으로 봅니다.`);
      html+=why(x.yong.reason+'. (간이 억부법 기준 — 조후·통관 등을 종합하는 전문 감정과는 차이가 있을 수 있습니다)');
      if(r) html+=p(`생활 개운은 용신 색인 <b>${r.color}</b>, 원석 <b>${r.stone}</b>, 방위 <b>${r.dir}</b>을 가까이 두는 것으로 안내하세요.`);
    }
    // 7) 원국 관계
    html+=h4('원국 안의 합·충·형 — 글자들의 관계');
    html+=relList;
    // 8) 반복 테마
    if(themes.length){
      html+=h4('인생에서 반복되는 핵심 테마');
      html+=ul(themes);
    }
    // 9) 감정·대인·스트레스
    html+=h4('감정 구조와 대인 방식');
    html+=p(C.DOM_TRAIT[s.domGod]);
    html+=p(`정리하면 — ${g.nick} 일간의 ${s.body} 사주로, 위 테마들이 삶의 국면마다 형태를 바꿔 되풀이됩니다. 상담에서는 "성격이 아니라 구조"라는 점을 짚어주세요. 구조를 알면 대응이 됩니다.`);
    return html;
  }

  /* ================= 오행 인쇄 팔레트 (흰 배경 보정) ================= */
  const ELP={
    목:{fg:'#2e7d4f', bg:'#e8f3ec'},
    화:{fg:'#c0392b', bg:'#faeae7'},
    토:{fg:'#c8901a', bg:'#faf3e2'},
    금:{fg:'#7d8798', bg:'#eef0f3'},
    수:{fg:'#1f3a5f', bg:'#e8edf5'}
  };

  /* ================= 조립 ================= */
  const SECS=[
    {id:'s1', icon:'📜', title:'1. 만세력 판독 요약', fn:sec1},
    {id:'s2', icon:'🧬', title:'2. 원국 핵심 구조', fn:sec2},
    {id:'s3', icon:'🌊', title:'3. 평생 총운 — 시기별 큰 흐름', fn:null},
    {id:'s4', icon:'💰', title:'4. 금전운', fn:null},
    {id:'s5', icon:'💼', title:'5. 직업운', fn:null},
    {id:'s6', icon:'💕', title:'6. 연애운', fn:null},
    {id:'s7', icon:'💍', title:'7. 결혼운', fn:null},
    {id:'s8', icon:'🩺', title:'8. 건강운', fn:null},
    {id:'s9', icon:'🤝', title:'9. 인간관계·가족운', fn:null},
    {id:'s10', icon:'🧭', title:'10. 대운 상세 해석', fn:null},
    {id:'s11', icon:'📈', title:'11. 세운 핵심 해석', fn:null},
    {id:'s12', icon:'🎯', title:'12. 현실 조언 및 총평', fn:null}
  ];
  function buildAll(s, x, a){
    TERMS=new Set();
    const t10=count10(s);
    const ctx={t10};
    return SECS.map(sc=>({
      id:sc.id, icon:sc.icon, title:sc.title,
      html: sc.fn ? sc.fn(s, x, a, ctx) : p('<span class="rp-dim">(다음 단계에서 작성됩니다)</span>')
    }));
  }

  function customerSheetHTML(s, x, a){ return ''; } // 5단계에서 구현

  global.SAJU_REPORT={ buildAll, customerSheetHTML, count10, moneyType, careerType,
    UNSEONG_DESC, GYEOK_DESC, MONEY_TYPE, CAREER_TYPE, SPOUSE_GONG, DOMAIN_LINE, SINSAL_DESC, REL_DESC, EL_EXCESS_HEALTH, ELP,
    _internal:{ term, p, h4, why, note, ul, chip, elko, gzko, themeFlags, daeunOf, saeunOf, fmtDaeun, fmtSaeun, GROUP, GLOSS, resetTerms:()=>{TERMS=new Set();} } };
})(typeof window!=='undefined'?window:globalThis);
