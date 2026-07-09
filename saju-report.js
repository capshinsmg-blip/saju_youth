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

  /* ================= S3. 평생 총운 ================= */
  function sec3(s, x){
    if(!x.daeunEx||!x.daeunEx.length) return p('대운 정보를 계산할 수 없습니다.');
    const now=s.luck?s.luck.nowY:0;
    let html=p(`${term('대운')}의 배열을 따라 인생의 큰 계절을 시기별로 읽습니다. 좋고 나쁨의 문제가 아니라 "이 시기에 어떤 기운이 들어오는가"의 문제입니다 — 계절에 맞는 옷을 입으면 어느 대운이든 살 만해집니다.`);
    const su=x.daeunSu;
    if(su&&su.age!=null){
      const yearP=s.pillars.find(pp=>pp.lab==='년');
      const yu=yearP&&yearP.zhi?X.unseong(s.dayGan,yearP.zhi):null;
      html+=h4(`어린 시절 (0~${su.age}세) — 대운 이전`);
      html+=p(`아직 대운이 들어오기 전, 원국 그대로의 기운으로 사는 시기입니다. 년주는 뿌리·가정환경의 자리${yu?` — 12운성 '${yu}'(${UNSEONG_DESC[yu].word})의 기운 위에서 출발했습니다`:''}. 이 시기의 환경이 아래 대운들을 받아들이는 그릇이 됩니다.`);
    }
    x.daeunEx.forEach(d=>{
      const cur=now>=d.startYear&&now<=d.endYear;
      const det=C.SHISHEN_DETAIL[d.god]||{};
      const firstSent=(det.period||'').split('. ')[0].replace(/\.?$/,'.');
      const u=UNSEONG_DESC[d.unseong]||{};
      const chung=d.rel.some(r=>r.type==='충');
      html+=h4(`${d.startAge}~${d.endAge}세 (${d.startYear}~${d.endYear}) — ${gzko(d.gz)} ${d.god} 대운${cur?' <span class="rp-tag gd">현재</span>':''}`);
      html+=p(`${firstSent} 이 시기의 체력은 12운성 '<b>${d.unseong}</b>'(${u.word}) — ${u.luck}.`
        + (chung?` 여기에 원국과 ${term('충')}이 걸려 있어 이사·이직·관계 재편처럼 <b>자리가 바뀌는 전환점</b>이 되기 쉬운 대운입니다.`:'')
        + (d.gongmang?` 지지가 ${term('공망')}에 해당해, 이 시기의 성취는 겉보다 속(의미·실력)으로 채워야 허무하지 않습니다.`:'')
        + (d.gwiin?' 천을귀인이 드는 시기 — 힘들 때 도와주는 사람이 나타납니다.':''));
    });
    html+=note('시기별 세부 전략(돈·직업·연애·건강·관계)은 10단계 대운 상세 해석에서 이어집니다.');
    return html;
  }

  /* ================= S4. 금전운 ================= */
  function sec4(s, x, a, ctx){
    const t10=ctx.t10;
    const mt=moneyType(s,t10), M=MONEY_TYPE[mt];
    const jaeD=daeunOf(x,GROUP.재성), jaeS=saeunOf(x,GROUP.재성), biD=daeunOf(x,GROUP.비겁), geopS=saeunOf(x,['겁재']);
    let html=`<div class="rp-scorebar">💰 금전운 ${s.money}% · ${C.grade(s.money)}</div>`;
    html+=h4('이 사주가 돈을 버는 방식');
    html+=p(`<b>${mt}</b> — ${M.how}.`);
    html+=why(`${term('재성')} ${t10.편재+t10.정재}개(편재 ${t10.편재}·정재 ${t10.정재}), ${term('식상')} ${t10.식신+t10.상관}개, ${term('비겁')} ${t10.비견+t10.겁재}개의 구성이 이 유형을 가리킵니다.`);
    html+=h4('재물이 커지는 구간');
    html+=p(jaeD.length
      ? `재성 대운 — ${jaeD.map(fmtDaeun).join(', ')} 구간이 재물의 파이프가 가장 굵어지는 때입니다. ${M.max}.`
      : `향후 대운 배열에 재성 대운이 뚜렷하지 않아 10년 단위의 대박 구간보다는, 해 단위의 기회를 잡는 그림입니다. ${M.max}.`);
    if(jaeS.length) html+=p(`가까운 세운 기준으로는 ${jaeS.map(fmtSaeun).join(', ')}에 돈의 기회가 들어옵니다. 이 해에는 저축·투자 비중을 미리 늘려 그릇을 준비하세요.`);
    html+=h4('돈이 새기 쉬운 시기와 이유');
    let leak=[];
    if(biD.length) leak.push(`${biD.map(fmtDaeun).join(', ')} — 비겁 대운은 내 돈에 숟가락이 늘어나는 시기(동업·보증·부탁)`);
    if(geopS.length) leak.push(`${geopS.map(fmtSaeun).join(', ')} — 겁재 세운은 충동 지출·투자 손실·금전 다툼의 해`);
    html+= leak.length?ul(leak):p('대운·세운 배열상 크게 새는 구간은 두드러지지 않습니다. 다만 아래 리스크 패턴은 상시 유효합니다.');
    html+=p(`이 유형의 최대 리스크 — ${M.risk}.`);
    html+=h4('현실적인 축재 전략');
    html+=p(`${M.strategy}.`+(x.yong?` 개운 관점으로는 ${term('용신')} ${elko(x.yong.yong)} 기운의 활동·색(${(C.REC[x.yong.yong]||{}).color||''})을 금전 습관에 붙이면 흐름이 부드러워집니다.`:''));
    return html;
  }

  /* ================= S5. 직업운 ================= */
  function sec5(s, x, a, ctx){
    const t10=ctx.t10;
    const ct=careerType(s,t10), K=CAREER_TYPE[ct];
    const gd=x.gyeok?GYEOK_DESC[x.gyeok.name]:null;
    const sikS=saeunOf(x,GROUP.식상), gwanS=saeunOf(x,['정관']), pgwanS=saeunOf(x,['편관']);
    const yeokS=(x.saeunEx||[]).filter(y=>y.sinsal==='역마살');
    let html=h4('타고난 직업 적성');
    html+=p(`<b>${ct}</b> — ${K.fit}. ${K.style}입니다.`);
    html+=why(`${term('관성')} ${t10.편관+t10.정관}개, ${term('인성')} ${t10.편인+t10.정인}개, 식상 ${t10.식신+t10.상관}개, 비겁 ${t10.비견+t10.겁재}개 + ${s.body} 판정의 조합.`);
    if(gd) html+=p(`${term('격국')}(${x.gyeok.name}) 관점에서도 ${gd.work} 쪽에서 그릇이 커지는 구조라, 두 판정이 같은 방향을 가리킵니다.`);
    html+=h4('이동·독립이 잘 맞는 시기');
    const moves=[];
    if(sikS.length) moves.push(`${sikS.map(fmtSaeun).join(', ')} — 식상 세운: 내 실력을 밖으로 내놓기 좋은 해(이직 포트폴리오·창업 준비)`);
    if(yeokS.length) moves.push(`${yeokS.map(fmtSaeun).join(', ')} — 역마 세운: 자리 이동(이직·전근·이사)이 자연스럽게 풀리는 해`);
    (x.daeunEx||[]).forEach((d,i)=>{ const nx=x.daeunEx[i+1];
      if(nx && s.luck && nx.startYear>s.luck.nowY && nx.startYear<=s.luck.nowY+10) moves.push(`${nx.startYear}년 전후 — 대운이 ${gzko(nx.gz)}(${nx.god})으로 바뀌는 경계: 인생 챕터가 넘어가는 이동 적기`); });
    html+= moves.length?ul(moves):p('가까운 10년 안에 두드러진 이동 신호는 없습니다 — 지금 자리에서 깊이를 쌓는 것이 유리합니다.');
    html+=h4('도약기와 조심할 시기');
    html+=p((gwanS.length?`${gwanS.map(fmtSaeun).join(', ')}는 승진·합격·임명 등 제도권 상승 운이 드는 해입니다. `:'')
      +(pgwanS.length?`${pgwanS.map(fmtSaeun).join(', ')}는 압박과 기회가 함께 오는 승부처 — 과로와 관재(법·규정 문제)만 관리하면 오히려 도약의 해가 됩니다.`:'관성 세운이 뚜렷하지 않은 구간은 직위보다 실력을 쌓는 데 쓰세요.'));
    html+=p(`한 줄 전략 — ${K.tip}.`);
    return html;
  }

  /* ================= S6. 연애운 ================= */
  function sec6(s, x, a, ctx){
    const t10=ctx.t10;
    const female=s.input.sex==='female';
    const starNm=female?'관성':'재성';
    const starCnt=female?(t10.편관+t10.정관):(t10.편재+t10.정재);
    const g=C.ILGAN[s.dayGan];
    const iljuZhi=x.pillars.find(pp=>pp.lab==='일');
    const sg=iljuZhi&&iljuZhi.ssZhi?SPOUSE_GONG[iljuZhi.ssZhi]:null;
    const starS=saeunOf(x,GROUP[starNm]);
    const dohwaS=(x.saeunEx||[]).filter(y=>y.sinsal==='도화살');
    let html=`<div class="rp-scorebar">💕 연애운 ${s.love}% · ${C.grade(s.love)}</div>`;
    html+=h4('인연의 그릇 — 배우자성의 세기');
    html+=p(starCnt>=2?`이성·인연을 뜻하는 ${term(starNm)}이 ${starCnt}개로 뚜렷합니다. 인연의 기회 자체는 자주 오는 사주 — 문제는 고르는 눈이지 만남의 수가 아닙니다.`
      : starCnt===1?`${term(starNm)}이 1개 — 인연의 씨앗은 분명히 있습니다. 폭넓게 만나기보다 한 인연을 깊게 키우는 쪽이 맞는 구조입니다.`
      : `${term(starNm)}이 원국에 드러나지 않았습니다. 인연이 늦거나 연애의 우선순위가 낮은 편 — 나쁜 게 아니라 "일과 자기 세계가 먼저 차는" 구조입니다. 인연은 운(대운·세운)에서 별이 들어올 때 집중적으로 옵니다.`);
    html+=h4('사랑을 시작하는 방식');
    html+=p(`${g.love} — 일간 ${s.dayGan}(${g.nick})의 연애 문법입니다.`);
    if(sg){
      html+=h4('끌리는 상대와 반복 패턴 — 배우자궁');
      html+=p(`일지(배우자 자리)의 중심 기운이 <b>${iljuZhi.ssZhi}</b>이라, 본능적으로 <b>${sg.attract}</b>에게 끌립니다. 다만 같은 이유로 "${sg.issue.split(' — ')[0]}"가 반복 패턴이 되기 쉽습니다 — ${sg.issue.split(' — ')[1]||''}`);
    }
    const fails=[];
    if(t10.상관>=2&&female) fails.push('상관이 강해 상대의 허점이 먼저 보이는 타입 — 말로 이기면 관계에선 지는 패턴 주의');
    if(t10.비견+t10.겁재>=3) fails.push('비겁 과다 — 친구에서 연인이 되거나, 경쟁자가 끼어드는 삼각 구도가 반복되기 쉬움');
    if(t10.편인+t10.정인>=3) fails.push('인성 과다 — 머리로 연애하는 타입, 재는 사이 타이밍을 놓치는 패턴');
    if(x.pillars.some(pp=>pp.sinsal==='도화살')) fails.push('도화 보유 — 인기가 많아 시작은 쉽지만 구설이 따르기 쉬움, 정리는 깔끔하게');
    if(fails.length){ html+=h4('조심해야 할 연애 패턴'); html+=ul(fails); }
    html+=h4('잘 맞는 사람, 피해야 할 사람');
    html+=p((x.yong?`${term('용신')} 관점으로 ${elko(x.yong.yong)} 기운(${C.EL_DESC[x.yong.yong]})을 가진 사람이 내 균형을 잡아주는 짝입니다. 반대로 ${term('기신')}인 ${elko(x.yong.gi)} 기운이 강한 사람과는 처음엔 강렬해도 갈수록 소모됩니다. `:'')
      +(sg?`구체적으로는 ${sg.attract} 중에서도 생활의 합(돈 쓰는 법·쉬는 법)이 맞는 사람을 고르세요.`:''));
    html+=h4('인연이 들어오는 시기');
    const loveTimes=[];
    if(starS.length) loveTimes.push(`${starS.map(fmtSaeun).join(', ')} — ${starNm} 세운: 배우자감 인연이 드는 대표적인 해`);
    if(dohwaS.length) loveTimes.push(`${dohwaS.map(fmtSaeun).join(', ')} — 도화 세운: 이성의 관심이 몰리는 해(가벼운 인연과 구별할 것)`);
    html+= loveTimes.length?ul(loveTimes):p('가까운 10년 세운에 배우자성이 뚜렷하지 않아, 인연은 소개·모임 등 의식적인 노력으로 만들어야 하는 구간입니다.');
    return html;
  }

  /* ================= S7. 결혼운 ================= */
  function sec7(s, x, a, ctx){
    const t10=ctx.t10;
    const female=s.input.sex==='female';
    const starNm=female?'관성':'재성';
    const ilju=x.pillars.find(pp=>pp.lab==='일');
    const sg=ilju&&ilju.ssZhi?SPOUSE_GONG[ilju.ssZhi]:null;
    const iljuUn=ilju?ilju.unseong:null;
    const starD=daeunOf(x,GROUP[starNm]), starS=saeunOf(x,GROUP[starNm]);
    const hapS=(x.saeunEx||[]).filter(y=>y.rel.some(r=>r.type==='육합'&&r.with==='일'));
    const iljuChung=x.rel.some(r=>r.type==='충'&&r.a&&r.b&&(r.a.lab==='일'||r.b.lab==='일'));
    const iljuGongmang=ilju&&ilju.gongmang;
    // 배우자성 위치로 이른/늦은 인연 판단
    const earlyStar=x.pillars.some(pp=>(pp.lab==='년'||pp.lab==='월')&&pp.gan&&(GROUP[starNm].includes(pp.ssGan)||GROUP[starNm].includes(pp.ssZhi)));
    let html=h4('결혼의 시계 — 이른 인연인가 늦은 인연인가');
    html+=p(earlyStar
      ? `배우자성(${starNm})이 년·월주(인생의 앞 시기)에 자리해 <b>인연이 이른 편</b>입니다. 다만 이른 인연일수록 상대를 검증할 시간이 짧으니, 결혼 전 함께 겪는 경험(여행·갈등·돈 문제)을 의도적으로 만들어보길 권합니다.`
      : `배우자성(${starNm})이 인생의 앞 시기(년·월주)에 드러나지 않아 <b>늦을수록 안정되는 인연</b>입니다. 조급함이 최대의 적 — 사회적 기반이 잡힌 뒤의 결혼이 이 사주에겐 더 단단합니다.`);
    html+=h4('가장 유력한 결혼 시기');
    const times=[];
    if(starD.length) times.push(`${starD.map(fmtDaeun).join(', ')} — 배우자성 대운: 결혼이 성사되기 가장 쉬운 10년 구간`);
    if(starS.length) times.push(`${starS.map(fmtSaeun).join(', ')} — 배우자성 세운: 그중에서도 구체적 혼담이 들어오는 해`);
    if(hapS.length) times.push(`${hapS.map(fmtSaeun).join(', ')} — 일지(배우자궁)와 합이 드는 해: 마음이 묶이는 인연의 해`);
    html+= times.length?ul(times):p('가까운 대운·세운에 결혼 신호가 강하게 잡히지 않습니다. 시기를 기다리기보다 "준비된 사람"이 되는 쪽이 이 구간의 정답입니다.');
    if(sg){
      html+=h4('배우자의 성향과 결혼생활의 그림');
      html+=p(`배우자궁(일지)의 기운으로 보면 배우자는 <b>${sg.spouse}</b>일 가능성이 높습니다.`
        +(iljuUn?` 배우자궁의 12운성은 '${iljuUn}'(${(UNSEONG_DESC[iljuUn]||{}).word}) — ${(UNSEONG_DESC[iljuUn]||{}).life}.`:''));
      html+=h4('갈등 포인트와 관리법');
      const issues=[`${sg.issue}`];
      if(iljuChung) issues.push(`일지에 ${term('충')} — 배우자 자리가 흔들리기 쉬운 구조입니다. 각자의 공간·시간을 존중하는 "따로 또 같이"가 이 부부의 생존 전략입니다`);
      if(iljuGongmang) issues.push(`배우자궁이 ${term('공망')} — 결혼 자체보다 "함께 사는 의미"를 계속 채워야 허전하지 않은 구조. 공동의 취미·목표가 약입니다`);
      html+=ul(issues);
    }
    return html;
  }

  /* ================= S8. 건강운 ================= */
  function sec8(s, x, a, ctx){
    const excess=s.oh[s.strong]>=3?s.strong:null;
    const pgwanS=saeunOf(x,['편관']);
    const chungS=(x.saeunEx||[]).filter(y=>y.rel.some(r=>r.type==='충'));
    const yukae=x.pillars.some(pp=>pp.sinsal==='육해살');
    const EL_HABIT={목:'스트레칭·산책 등 몸을 펴고 걷는 운동, 신맛·녹색 채소',화:'수영·명상 등 열을 식히는 활동, 카페인 절제',토:'규칙적인 식사와 가벼운 소식(小食), 단맛 절제',금:'호흡 운동·건조 관리, 매운맛 절제',수:'보온과 충분한 수면, 짠맛 절제'};
    let html=h4('타고난 체질의 약점');
    html+=p(`가장 부족한 ${elko(s.lack)} 기운의 계통이 이 사주의 약한 고리입니다 — ${C.CONCERN_HEALTH[s.lack]}`);
    if(excess) html+=p(`반대로 ${elko(excess)} 기운은 ${s.oh[excess]}개로 과다 — 넘치는 것도 병이 됩니다. ${EL_EXCESS_HEALTH[excess]}가 두 번째 관리 포인트입니다.`);
    html+=why(`오행 분포 ${['목','화','토','금','수'].map(e=>`${e} ${s.oh[e]}`).join(' · ')} — 0~1개 오행은 그 계통의 저항력이 낮고, 3개 이상은 과열로 나타난다고 봅니다.`);
    html+=h4('스트레스가 몸으로 나타나는 방식');
    html+=p(s.body==='신강'
      ? '기운이 강한 체질이라 아파도 밀어붙이다 한 번에 크게 꺾이는 유형입니다. "버틸 만한데?"가 이 사주의 가장 위험한 신호입니다.'
      : s.body==='신약'
      ? '기운이 섬세한 체질이라 스트레스가 바로 몸(소화·수면·컨디션)으로 옵니다. 몸의 신호가 빠른 만큼, 초기에 쉬면 회복도 빠릅니다.'
      : '강약이 균형인 체질이라 큰 파도는 적지만, 그만큼 이상 신호를 무심코 넘기기 쉽습니다. 정기 검진이 보험입니다.');
    html+=h4('건강을 조심할 시기');
    const risks=[];
    if(pgwanS.length) risks.push(`${pgwanS.map(fmtSaeun).join(', ')} — 편관 세운: 과로·사고수가 겹치기 쉬운 해, 이 해의 건강검진은 선택이 아니라 필수`);
    if(chungS.length) risks.push(`${chungS.map(fmtSaeun).join(', ')} — 충이 드는 해: 생활 리듬이 흔들리며 몸이 따라 흔들리는 해`);
    if(yukae) risks.push('원국에 육해살 — 큰 병보다 잔병·잔근심형. 꾸준한 루틴(수면·식사 시간 고정)이 최고의 약');
    html+= risks.length?ul(risks):p('가까운 세운에 두드러진 건강 위험 신호는 없습니다. 다만 아래 습관은 체질상 평생 유효합니다.');
    html+=h4('평생 관리 습관');
    html+=p(`부족한 ${elko(s.lack)}을 채우는 생활 — ${EL_HABIT[s.lack]}. 사주는 병을 진단하지 않습니다. 여기 짚은 것은 "구조적으로 무리가 가기 쉬운 곳"이니, 이상 신호는 반드시 병원에서 확인하세요.`);
    return html;
  }

  /* ================= S9. 인간관계·가족운 ================= */
  function sec9(s, x, a, ctx){
    const t10=ctx.t10;
    const bi=t10.비견+t10.겁재, inn=t10.편인+t10.정인, sik=t10.식신+t10.상관, gwan=t10.편관+t10.정관, jae=t10.편재+t10.정재;
    const gwiin=x.pillars.some(pp=>pp.gwiin);
    let html=h4('관계의 지형도 — 십신 분포로 본 사람 운');
    html+=ul([
      `부모·윗사람(인성 ${inn}개) — ${inn>=2?'어른의 지원과 가르침을 받는 복이 있습니다. 받은 만큼 갚으면 인덕이 평생 갑니다':inn===1?'필요한 순간의 지원은 있으나, 기본적으로 스스로 크는 구조입니다':'윗사람 운이 옅어 조언자·멘토를 의식적으로 만들어야 합니다'}`,
      `형제·동료(비겁 ${bi}개) — ${bi>=3?'사람은 늘 곁에 많지만 돈과 경쟁이 함께 얽힙니다. 관계와 금전의 분리가 철칙':bi>=1?'필요한 만큼의 동료 운 — 깊고 좁게 가는 것이 맞습니다':'혼자가 익숙한 구조 — 외로움이 아니라 독립성으로 읽으세요'}`,
      `아랫사람·표현(식상 ${sik}개) — ${sik>=2?'후배·아랫사람을 잘 키우고 베푸는 기운이 강합니다':'표현이 아끼는 편이라, 마음을 말로 꺼내는 연습이 관계를 살립니다'}`,
      `조직·사회(관성 ${gwan}개) — ${gwan>=2?'조직 안에서 신뢰를 얻는 유형':'조직보다 개인 대 개인의 관계에서 힘이 나는 유형'}`,
      `실리 관계(재성 ${jae}개) — ${jae>=2?'폭넓은 사교와 실리적 네트워크에 강합니다':'좁아도 진심인 관계를 지향합니다'}`
    ]);
    html+=h4('귀인운');
    html+=p(gwiin
      ? '원국에 <b>천을귀인</b>이 있습니다 — 위기의 순간마다 돕는 사람이 나타나는 최고 길신입니다. 단, 귀인은 "먼저 신의를 지키는 사람"에게 옵니다.'
      : '원국에 천을귀인은 없지만, 귀인은 만드는 것이기도 합니다. 신세를 지면 반드시 갚는 습관 하나가 이 사주의 귀인운을 대신합니다.');
    html+=h4('관계에서 반복되는 갈등 구조');
    html+=p(`${s.domGod} 기운이 우세한 사주입니다 — ${C.DOM_TRAIT[s.domGod]}`);
    html+=p(`정리 — 이 사주의 사람 복은 "${gwiin?'귀인이 오는 복':'스스로 만드는 복'}"이고, 관계의 급소는 위 갈등 구조입니다. 급소를 아는 사람은 같은 싸움을 두 번 하지 않습니다.`);
    return html;
  }

  /* ================= S10. 대운 상세 해석 ================= */
  function sec10(s, x){
    if(!x.daeunEx||!x.daeunEx.length) return p('대운 정보를 계산할 수 없습니다.');
    const now=s.luck?s.luck.nowY:0;
    let html=p(`${term('대운')} 하나하나를 분야별로 해석합니다. 각 대운의 키워드 세 개만 기억해도 그 10년의 지도가 됩니다.`);
    x.daeunEx.forEach(d=>{
      const cur=now>=d.startYear&&now<=d.endYear;
      const det=C.SHISHEN_DETAIL[d.god]||{};
      const u=UNSEONG_DESC[d.unseong]||{};
      const dl=DOMAIN_LINE[d.god]||{};
      const chungRel=d.rel.filter(r=>r.type==='충');
      const kw=[C.SHISHEN_MEAN[d.god]?C.SHISHEN_MEAN[d.god].split('·')[0]:d.god, u.word, chungRel.length?'변동':(d.gwiin?'귀인':'안정')];
      const cautions=[];
      if(C.CAUTION.has(d.god)) cautions.push((det.period||'').split('. ').slice(-1)[0]);
      chungRel.forEach(r=>cautions.push(`${r.txt} — 이동·재편 이슈가 표면화되기 쉬움`));
      if(d.gongmang) cautions.push('지지 공망 — 겉 성취보다 내실을 채워야 허무하지 않은 대운');
      html+=`<div class="rp-du${cur?' cur':''}">
        <div class="rp-duh"><b>${d.startAge}~${d.endAge}세</b> · ${d.startYear}~${d.endYear} · ${gzko(d.gz)} <b>${d.god}</b> 대운 · 12운성 ${d.unseong}${cur?' <span class="rp-tag gd">현재</span>':''}</div>
        <div class="rp-dukw">${kw.filter(Boolean).map(k=>chip('#'+k)).join('')}</div>
        ${ul([
          `💰 돈 — ${dl.돈||'-'}`,
          `💼 직업 — ${dl.직업||'-'}`,
          `💕 연애·결혼 — ${dl.연애||'-'}`,
          `🩺 건강 — ${dl.건강||'-'}`,
          `🤝 관계 — ${dl.관계||'-'}`
        ])}
        ${cautions.length?`<div class="rp-why">⚠️ 주의 — ${cautions.join(' / ')}</div>`:''}
        <div class="rp-lvl">🔑 레벨업 포인트 — ${det.advice||''}</div>
      </div>`;
    });
    return html;
  }

  /* ================= S11. 세운 핵심 해석 ================= */
  function sec11(s, x){
    if(!x.saeunEx||!x.saeunEx.length) return p('세운 정보를 계산할 수 없습니다.');
    const now=s.luck?s.luck.nowY:0;
    const tagOf=y=>{
      const t=[];
      if(GROUP.재성.includes(y.god)) t.push(chip('💰 돈','gd2'));
      if(GROUP.관성.includes(y.god)) t.push(chip('🏛 직장·시험','gd2'));
      if((s.input.sex==='female'?GROUP.관성:GROUP.재성).includes(y.god)) t.push(chip('💕 인연','gd2'));
      if(GROUP.식상.includes(y.god)) t.push(chip('🎨 표현·확장','gd2'));
      if(GROUP.인성.includes(y.god)) t.push(chip('📜 문서·공부','gd2'));
      if(y.rel.some(r=>r.type==='충')||y.sinsal==='역마살') t.push(chip('🚚 이동·변동','wr2'));
      if(y.god==='편관'||y.god==='겁재') t.push(chip('⚠️ 관리 필요','wr2'));
      if(y.gwiin) t.push(chip('🙏 귀인','gd2'));
      return t.join('');
    };
    let html=p(`${term('세운')}은 그 해의 날씨입니다. 아래 태그가 붙은 해는 해당 분야의 사건이 실제로 "형태를 갖춰" 나타나기 쉬운 해입니다.`);
    x.saeunEx.forEach(y=>{
      const det=C.SHISHEN_DETAIL[y.god]||{};
      const first=(det.period||'').split('. ')[0]+'.';
      const chungTxt=y.rel.filter(r=>r.type==='충').map(r=>r.txt).join(', ');
      html+=`<div class="rp-yr${y.year===now?' cur':''}">
        <div class="rp-yrh"><b>${y.year}년</b> ${gzko(y.gz)} · <b>${y.god}</b>${y.year===now?' <span class="rp-tag gd">올해</span>':''} <span class="rp-yrtags">${tagOf(y)}</span></div>
        <div class="rp-yrb">${first}${chungTxt?` <b>${chungTxt}</b> — 이 해는 자리(집·직장·관계)가 움직이기 쉬운 해입니다.`:''}${y.sinsal==='도화살'?' 도화가 드는 해 — 이성의 관심·인기운이 함께 옵니다.':''}</div>
      </div>`;
    });
    html+=note('연도별 판단 근거: 그 해 천간의 십성(일간 대비) + 지지와 원국의 충·합 + 신살. 같은 해라도 대운의 큰 계절 안에서 읽어야 정확합니다(10단계 참조).');
    return html;
  }

  /* ================= S12. 현실 조언 및 총평 ================= */
  function sec12(s, x, a, ctx){
    const t10=ctx.t10;
    const g=C.ILGAN[s.dayGan];
    const mt=moneyType(s,t10), ct=careerType(s,t10);
    const gd=x.gyeok?GYEOK_DESC[x.gyeok.name]:null;
    // 고칠 것 3 — 기신·약점·과다 플래그에서 우선순위 채택
    const fixes=[];
    if(x.yong) fixes.push(`${term('기신')}인 ${elko(x.yong.gi)} 기운에 해당하는 환경·습관(${C.EL_DESC[x.yong.gi]}의 과잉)을 줄이는 것 — 사주의 브레이크부터 풀어야 액셀이 듣습니다`);
    if(t10.비견+t10.겁재>=3) fixes.push('가까운 사람과의 돈 거래 습관 — 이 사주 손재의 8할은 "아는 사람"에게서 나옵니다');
    if(t10.편인+t10.정인>=3) fixes.push('생각만 하다 놓치는 습관 — 완벽한 계획보다 어설픈 시작이 이깁니다');
    if(t10.식신+t10.상관>=3) fixes.push('벌여놓고 마무리 못 하는 습관 — 끝낸 일의 개수가 이 사주의 실력입니다');
    fixes.push(`약점으로 짚인 "${(g.weakness||'').split('.')[0]}" — 성격이 아니라 구조이니, 보완 장치(사람·시스템)를 곁에 두면 됩니다`);
    // 강점 3
    const strengths=[
      `${g.nick} 일간의 "${(g.strength||'').split('.')[0]}"`,
      gd?`${x.gyeok.name}의 그릇 — ${gd.easy}`:null,
      x.pillars.some(pp=>pp.gwiin)?'천을귀인 — 위기마다 사람이 돕는 복':`${elko(s.strong)} 기운(${C.EL_DESC[s.strong]})의 엔진`
    ].filter(Boolean);
    const cn=a&&a.concern?C.describe.concern(s,a.concern):null;
    let html=h4('가장 먼저 고쳐야 할 것 3가지');
    html+=ul(fixes.slice(0,3));
    html+=h4('반드시 붙잡아야 할 강점 3가지');
    html+=ul(strengths.slice(0,3));
    html+=h4('분야별 생존 전략 한 줄');
    html+=ul([
      `💰 돈 — ${MONEY_TYPE[mt].strategy}`,
      `💼 일 — ${CAREER_TYPE[ct].tip}`,
      `💕 인연 — ${x.yong?`${elko(x.yong.yong)} 기운의 사람을 곁에, ${elko(x.yong.gi)} 기운의 소모전은 피하기`:'균형을 잡아주는 사람을 곁에 두기'}`,
      `🩺 건강 — 부족한 ${elko(s.lack)} 계통(${C.CONCERN_HEALTH[s.lack].split('.')[0]})을 평생 관리 항목으로`
    ]);
    if(cn) html+=`<div class="rp-concern"><div class="rp-h4">${cn.title} — 신청자가 고른 고민</div>${p(cn.body)}</div>`;
    html+=h4('총평 — 이 사주 인생의 본질');
    html+=p(`${a&&a.name?a.name+'님':'이 사주'}는 <b>${g.nick}</b>의 본질 위에 <b>${s.body}</b>의 힘, ${x.gyeok?`<b>${x.gyeok.name}</b>의 그릇`:'균형의 그릇'}을 얹은 명(命)입니다. ${gd?gd.theme+'.':''} 부족한 ${elko(s.lack)}과 ${term('용신')} ${x.yong?elko(x.yong.yong):''}을 챙기는 것이 평생의 개운법이며, 위 대운의 계절만 알고 걸어도 남들보다 반 박자 빠르게 준비할 수 있습니다. 운은 정해진 결말이 아니라 "미리 받아보는 일기예보"입니다 — 우산을 챙기는 것은 본인의 몫이고, 그 우산이 무엇인지는 이 리포트가 이미 말해주었습니다.`);
    html+=note('본 리포트는 만세력 기반 규칙 엔진의 자동 분석으로, 격국·용신은 간이 판정입니다. 재미와 참고를 위한 자료이며 의학·법률·투자 판단의 근거가 될 수 없습니다.');
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
    {id:'s3', icon:'🌊', title:'3. 평생 총운 — 시기별 큰 흐름', fn:sec3},
    {id:'s4', icon:'💰', title:'4. 금전운', fn:sec4},
    {id:'s5', icon:'💼', title:'5. 직업운', fn:sec5},
    {id:'s6', icon:'💕', title:'6. 연애운', fn:sec6},
    {id:'s7', icon:'💍', title:'7. 결혼운', fn:sec7},
    {id:'s8', icon:'🩺', title:'8. 건강운', fn:sec8},
    {id:'s9', icon:'🤝', title:'9. 인간관계·가족운', fn:sec9},
    {id:'s10', icon:'🧭', title:'10. 대운 상세 해석', fn:sec10},
    {id:'s11', icon:'📈', title:'11. 세운 핵심 해석', fn:sec11},
    {id:'s12', icon:'🎯', title:'12. 현실 조언 및 총평', fn:sec12}
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

  /* ================= 고객용 A4 명식표 (그림 위주 결과지) ================= */
  function customerSheetHTML(s, x, a){
    if(!s||!x) return '';
    const labs=['시','일','월','년'];
    const cols=labs.map(l=>x.pillars.find(pp=>pp.lab===l));
    const cal=a.calendar==='lunar'?('음력'+(a.leap?'·윤달':'')):'양력';
    const hourTxt=(a.hour===null||a.hour===undefined||a.hour==='')?'시간 모름':a.hour+'시경';
    const g=C.ILGAN[s.dayGan];
    const metal=el=>el==='금'?'box-shadow:inset 0 0 0 1px #c9cfd8;':'';

    /* 명식 그리드 */
    const colHtml=cols.map(c=>{
      if(!c.gan) return `<div class="cs-col"><div class="cs-collab">${c.lab}주</div>
        <div class="cs-ss">－</div><div class="cs-tile cs-empty">－</div><div class="cs-tile cs-empty">－</div>
        <div class="cs-ss">－</div><div class="cs-sub">－</div><div class="cs-sub">－</div><div class="cs-sub">－</div></div>`;
      const ge=C.GAN_EL[c.gan], ze=C.ZHI_EL[c.zhi];
      const sal=[c.gwiin?'귀인':'', c.gongmang?'공망':'', c.sinsal||''].filter(Boolean).join('·')||'－';
      return `<div class="cs-col">
        <div class="cs-collab">${c.lab}주</div>
        <div class="cs-ss">${c.lab==='일'?'<b>나</b>':c.ssGan}</div>
        <div class="cs-tile" style="background:${ELP[ge].bg};color:${ELP[ge].fg};${metal(ge)}"><b>${c.gan}</b><span>${C.GAN_KO[c.gan]} · ${C.EL_HAN[ge]}</span></div>
        <div class="cs-tile" style="background:${ELP[ze].bg};color:${ELP[ze].fg};${metal(ze)}"><b>${c.zhi}</b><span>${C.ZHI_KO[c.zhi]} · ${C.EL_HAN[ze]}</span></div>
        <div class="cs-ss">${c.ssZhi}</div>
        <div class="cs-sub">${c.hide.map(hd=>hd.g).join(' · ')}</div>
        <div class="cs-sub"><b>${c.unseong||'－'}</b></div>
        <div class="cs-sub cs-sal">${sal}</div>
      </div>`;
    }).join('');
    const rowLabs=`<div class="cs-col cs-labels">
      <div class="cs-collab">&nbsp;</div><div class="cs-ss">십성</div>
      <div class="cs-tile cs-lab2">천간</div><div class="cs-tile cs-lab2">지지</div>
      <div class="cs-ss">십성</div><div class="cs-sub">지장간</div><div class="cs-sub">12운성</div><div class="cs-sub">신살</div></div>`;

    /* 오행 밸런스 바 */
    const maxOh=Math.max.apply(null, Object.values(s.oh).concat([1]));
    const ohBars=['목','화','토','금','수'].map(e=>`
      <div class="cs-ohr"><span class="cs-ohd" style="background:${ELP[e].fg}">${C.EL_HAN[e]}</span>
      <span class="cs-oht"><i style="width:${Math.max(s.oh[e]/maxOh*100,3)}%;background:${ELP[e].fg}"></i></span>
      <span class="cs-ohc">${s.oh[e]}</span></div>`).join('');

    /* 신강약 게이지 */
    const de=s.dayEl, support=s.oh[de]+s.oh[C.REV_SHENG[de]];
    const pct=Math.round(support/s.total*100);
    const gaugePos=Math.min(Math.max(pct,4),96);

    /* 용신·개운 */
    const yong=x.yong, rec=yong?C.REC[yong.yong]:null;

    /* 귀인·신살 칩 */
    const salChips=[];
    if(x.pillars.some(pp=>pp.gwiin)) salChips.push({t:'천을귀인',c:'gd'});
    if(x.pillars.some(pp=>pp.gongmang)) salChips.push({t:'공망',c:'wr'});
    ['도화살','역마살','화개살','장성살','반안살'].forEach(sl=>{ if(x.pillars.some(pp=>pp.sinsal===sl)) salChips.push({t:sl,c:''}); });
    const salHtml=salChips.length?salChips.map(cch=>`<span class="cs-chip ${cch.c}">${cch.t}</span>`).join(''):'<span class="cs-chip">두드러진 신살 없음</span>';

    /* 대운 타임라인 SVG */
    const du=x.daeunEx||[]; let timeline='';
    if(du.length>=2){
      const W=700, H=74, x0=26, x1=W-26, n=du.length;
      const step=(x1-x0)/(n-1);
      const nowY=s.luck?s.luck.nowY:0;
      let ticks='';
      du.forEach((d,i)=>{ const tx=x0+step*i;
        ticks+=`<line x1="${tx}" y1="34" x2="${tx}" y2="44" stroke="#b8a15e" stroke-width="1.4"/>
        <text x="${tx}" y="28" text-anchor="middle" font-size="11" fill="#8a7d5a">${d.startAge}세</text>
        <text x="${tx}" y="60" text-anchor="middle" font-size="13" font-weight="700" fill="#4a4234" font-family="'Noto Serif KR',serif">${d.gz}</text>`; });
      const curIdx=du.findIndex(d=>nowY>=d.startYear&&nowY<=d.endYear);
      let marker='';
      if(curIdx>=0){ const frac=Math.min(Math.max((nowY-du[curIdx].startYear)/10,0),1);
        const mx=x0+step*(curIdx+frac*(curIdx<n-1?1:0));
        marker=`<path d="M ${mx} 40 l -5 -8 l 10 0 z" fill="#b8862f"/><text x="${mx}" y="72" text-anchor="middle" font-size="10" font-weight="700" fill="#b8862f">현재</text>`; }
      timeline=`<svg viewBox="0 0 ${W} ${H}" class="cs-tl" xmlns="http://www.w3.org/2000/svg">
        <line x1="${x0}" y1="39" x2="${x1}" y2="39" stroke="#d9c996" stroke-width="2.5" stroke-linecap="round"/>
        ${ticks}${marker}</svg>`;
    }

    return `<button class="cs-close" onclick="previewCustomer()">✕ 미리보기 닫기</button>
    <div class="cs-page">
      <div class="cs-head"><div class="cs-brand">사주 오행 공방</div><div class="cs-title">나의 사주 명식(命式) 결과지</div></div>
      <div class="cs-who"><b>${a.name||'-'}</b> · ${a.sex==='female'?'여성':'남성'} · ${cal} ${a.y}.${a.mo}.${a.d} · ${hourTxt}<span class="cs-solar">양력 ${s.solarStr||'-'}</span></div>
      <div class="cs-grid">${rowLabs}${colHtml}</div>
      <div class="cs-mid">
        <div class="cs-box">
          <div class="cs-boxh">🌳 오행 밸런스</div>${ohBars}
          <div class="cs-lackline">부족한 기운 <b style="color:${ELP[s.lack].fg}">${C.EL_HAN[s.lack]}(${s.lack})</b> — ${C.EL_DESC[s.lack]}</div>
        </div>
        <div class="cs-box cs-ilgan">
          <div class="cs-boxh">📿 나의 일간</div>
          <div class="cs-ilchar" style="color:${ELP[de].fg}">${s.dayGan}</div>
          <div class="cs-ilnick">${g.nick}</div>
          <div class="cs-iless">${(g.essence||'').split('.')[0]}.</div>
        </div>
      </div>
      <div class="cs-row3">
        <div class="cs-box">
          <div class="cs-boxh">⚖️ 기운의 강약 <b class="cs-bodytag">${s.body}</b></div>
          <div class="cs-gauge"><i style="left:${gaugePos}%"></i><em style="left:28%"></em><em style="left:45%"></em></div>
          <div class="cs-gaugelab"><span>신약</span><span>중화</span><span>신강</span></div>
        </div>
        <div class="cs-box">
          <div class="cs-boxh">🔑 용신과 개운</div>
          ${yong?`<div class="cs-yline">용신 <b style="color:${ELP[yong.yong].fg}">${C.EL_HAN[yong.yong]}(${yong.yong})</b> · 희신 ${C.EL_HAN[yong.hee]}(${yong.hee})</div>`:''}
          ${rec?`<div class="cs-yline">색 <b>${rec.color}</b> · 원석 <b>${rec.stone}</b> · 방위 <b>${rec.dir}</b></div>`:''}
          ${x.gyeok?`<div class="cs-yline">격국 <b>${x.gyeok.name}</b></div>`:''}
        </div>
        <div class="cs-box">
          <div class="cs-boxh">✨ 귀인 · 신살</div>
          <div class="cs-salwrap">${salHtml}</div>
        </div>
      </div>
      ${timeline?`<div class="cs-daeun"><div class="cs-boxh">🧭 나의 대운(大運) — 10년 주기 인생의 계절</div>${timeline}</div>`:''}
      <div class="cs-foot"><b>@susu.oheng</b><span> · 무료사주 3초 조회 ✨</span><em>본 결과지는 상담 참고용입니다 · 사주 오행 공방</em></div>
    </div>`;
  }

  global.SAJU_REPORT={ buildAll, customerSheetHTML, count10, moneyType, careerType,
    UNSEONG_DESC, GYEOK_DESC, MONEY_TYPE, CAREER_TYPE, SPOUSE_GONG, DOMAIN_LINE, SINSAL_DESC, REL_DESC, EL_EXCESS_HEALTH, ELP,
    _internal:{ term, p, h4, why, note, ul, chip, elko, gzko, themeFlags, daeunOf, saeunOf, fmtDaeun, fmtSaeun, GROUP, GLOSS, resetTerms:()=>{TERMS=new Set();} } };
})(typeof window!=='undefined'?window:globalThis);
