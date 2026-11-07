const f=(x,d=2)=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d}).format(x);
const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function lineChart(title,points,note){
 const xs=points.map((_,i)=>28+i*344/(points.length-1));
 return `<section class="study-visual"><div class="result-section-label">${title}</div><div class="timeline-scroll"><svg class="valuation-timeline" viewBox="0 0 400 175" role="img" aria-label="${esc(points.map(p=>p.time+': '+p.label+' '+p.value).join(' / '))}"><line x1="20" x2="380" y1="88" y2="88" stroke="#66816c"/>${points.map((p,j)=>{const x=xs[j],anchor=j===0?'start':j===points.length-1?'end':'middle',color=p.negative?'#dfaa87':'#d4e8b5';return `<circle cx="${x}" cy="88" r="3.5" fill="${color}"/><path d="${p.negative?`M${x} 93v18m-3-4 3 4 3-4`:`M${x} 83V65m-3 4 3-4 3 4`}" fill="none" stroke="${color}"/><text x="${x}" y="25" text-anchor="${anchor}" fill="#a6bf9d" font-size="10">${esc(p.label)}</text><text x="${x}" y="44" text-anchor="${anchor}" fill="${color}" font-size="12">${esc(p.value)}</text><text x="${x}" y="133" text-anchor="${anchor}" fill="#c6dbb6" font-size="10">${esc(p.time)}</text><text x="${x}" y="153" text-anchor="${anchor}" fill="#9fb697" font-size="10">${esc(p.sub||'')}</text>`;}).join('')}</svg></div><span class="timeline-mobile-hint">↔ 그림을 좌우로 밀어 전체 시점을 확인하세요.</span><p class="visual-caption">${note}</p></section>`;
}
export function valuationVisual(mode,s,r){
 if(mode==='bond'){
 const price=s.bondSolve==='yield'?s.price:r.result;
 const stops=[{label:'PV · 매입 지출',value:'−'+f(price),time:'t = 0',negative:true}];
 const periods=r.n>2?[1,r.n-1]:r.n===2?[1]:[];
 for(const t of periods)stops.push({label:'쿠폰 C',value:'+'+f(r.pmt),time:`t = ${t}`,sub:`${f(t/s.py,2)}년`});
 stops.push({label:r.pmt===0?'원금 F':'마지막 C + F',value:'+'+f(s.face+r.pmt),time:`t = ${r.n}`,sub:`만기 ${s.years}년`});
 return lineChart('CASH FLOW TIMELINE · BOND',stops,`투자자 기준 · 금액은 선택한 단위. ${r.n>3?'중간 쿠폰 일부와 시간 간격은 생략한 도식입니다. ':''}${r.pmt===0?'만기 전 이자 지급이 없고 원금만 회수합니다.':`회당 쿠폰 ${f(r.pmt)}을 받고, 마지막에는 쿠폰과 원금을 함께 받습니다.`}`)+`<div class="visual-bridge"><span>매회 이율<br><strong>${f(r.yield/s.py,4)}%</strong></span><span>총 지급 횟수<br><strong>${r.n}회</strong></span><span>만기 회수액<br><strong>${f(s.face+r.pmt)}</strong></span></div>`;
 }
 if(s.model==='multiple')return `<section class="study-visual"><div class="result-section-label">VALUATION MAP · PER × EPS</div><div class="valuation-map"><div><small>현재 EPS</small><strong>${f(s.eps)}</strong><span>주당 이익</span></div><b>×</b><div><small>기준 PER</small><strong>${f(s.pe)}</strong><span>이익의 몇 배?</span></div><b>=</b><div><small>현재 P₀</small><strong>${f(r.result)}</strong><span>주당 평가액</span></div></div><p class="visual-caption">현재 주가 = 현재 EPS × 기준 PER. 이 도식은 가치평가 관계이며, 배당 현금흐름은 아닙니다.</p></section>`;
 if(r.rows.length){
 const n=r.n,first=r.rows[0],last=r.rows[n-1];
 const points=[{label:'오늘의 P₀',value:f(r.result),time:'t = 0',sub:'미래 가치의 합'},...(n>1?[{label:'첫 배당 D₁',value:f(first.dividend,4),time:'t = 1',sub:`g₁ ${f(first.growth)}%`}]:[]),{label:`D${n} + P${n}`,value:f(last.dividend+r.terminal,4),time:`t = ${n}`,sub:'배당 + 말기 가치'},{label:`배당 D${n+1}`,value:f(r.next,4),time:`t = ${n+1} → ∞`,sub:`매년 g ${f(r.g*100)}%`}];
 return lineChart('DIVIDEND TIMELINE · GROWTH STAGES',points,`D₀ ${f(s.d0,4)}은 이미 지급된 배당입니다. ${n>2?'중간 연도는 아래 배당표에서 확인하세요. ':''}가로 간격은 도식용입니다.`)+`<div class="terminal-callout"><strong>성장률이 바뀌는 지점은 ${n}년 말</strong><p>P${n} = D${n+1} ÷ (R − g) = ${f(r.terminal,6)}<br>마지막 입력액 = D${n} ${f(last.dividend,6)} + P${n} ${f(r.terminal,6)}<br>이 말기 가치가 ${n}년 뒤에 있으므로 (1+R)<sup>${n}</sup>으로 할인합니다. P${n}은 이후 배당의 가치이므로 그 배당들을 현재가치 합에 다시 더하지 않습니다.</p></div>`;
 }
 const d1=r.d1??s.d0,d2=d1*(1+r.g),price=r.percent?s.price:r.result;
 return lineChart(s.model==='perpetuity'?'CASH FLOW TIMELINE · PERPETUITY':'DIVIDEND TIMELINE · CONSTANT GROWTH',[
 {label:'오늘의 P₀',value:f(price),time:'t = 0',sub:'현재가치'},
 {label:s.model==='perpetuity'?'첫 지급 D':'다음 배당 D₁',value:f(d1,4),time:'t = 1',sub:'1년 후'},
 {label:s.model==='perpetuity'?'같은 지급 D':'D₂ = D₁(1+g)',value:f(d2,4),time:'t = 2',sub:'2년 후'},
 {label:'계속 지급',value:`g = ${f(r.g*100)}%`,time:'t → ∞',sub:s.model==='perpetuity'?'매년 같은 금액':'매년 같은 성장률'}
 ],s.model==='perpetuity'?'첫 현금흐름은 1년 후입니다. 현재 PV = 연 지급액 ÷ 연 요구수익률.':`D₀ ${f(s.d0,4)}은 지급 완료. 가치평가에는 1년 뒤 D₁부터 반영합니다. R = ${f(r.r*100,4)}%, g = ${f(r.g*100,4)}%.`);
}
export const exampleStories={
 pv:{story:'5년 후 수령액 $25,000 · 연 수익률 12% · 중간 지급 없음',goal:'미래 수령액의 현재가치',tip:'FV는 미래 수령액으로 양수, PV는 오늘 지급할 돈이므로 음수입니다. PMT는 0입니다.'},
 fv:{story:'현재 예금액 $10,000 · 연 6% 복리 · 5년 · 추가 납입 없음',goal:'5년 후 받게 될 금액',tip:'오늘 예금하는 PV는 음수, 나중에 받는 FV는 양수입니다.'},
 loan:{story:'대출금 $75,000 · 연 6.8% · 5년 · 매년 말 균등 상환',goal:'매년 상환 금액',tip:'대출금 PV는 유입이므로 양수입니다. 매년 내는 상환금 PMT는 음수, 완납 후 FV는 0입니다.'},
 tuition:{story:'매월 말 150만원 수령 · 48개월 · 연 명목 3.7% · 월복리',goal:'월 지급액의 현재가치',tip:'N=48, P/Y=C/Y=12입니다. 월 이율 3.7%÷12를 I/Y에 다시 입력하지 않습니다. I/Y에는 연 3.7을 넣습니다.'},
 retire:{story:'은퇴자금 $96,000 · 18년 · 연 명목 5.5% · 월복리 · 매월 말 인출',goal:'잔액이 0이 되는 월 인출 금액',tip:'N=18×12=216, PV=−96000, FV=0으로 계산합니다. PMT는 받는 돈이므로 양수입니다.'},
 ear:{story:'연 명목이율 12% · 매월 복리',goal:'월복리 기준 연 실효이율',tip:'월 이율은 1%입니다. EAR=(1.01)¹²−1이며, NOM과 EFF는 모두 연 이율입니다.'},
 'ti-ear':{story:'연 명목이율 15% · 분기복리',goal:'분기복리 기준 연 실효이율',tip:'C/Y는 분기복리이므로 4입니다. 한 분기 이율 3.75%를 4번 복리로 적용합니다.'},
 npv:{story:'현재 투자액 $7,000 · 연말 회수액 $3,000 → $5,000 × 4년 → $4,000 · 연 할인율 10%',goal:'설비 투자의 순현재가치',tip:'CF₀=−7000, C01=3000·F01=1, C02=5000·F02=4, C03=4000·F03=1입니다. 초기 투자액을 미래 현금흐름처럼 할인하지 않습니다.'},
 'npv-month':{story:'현재 투자액 1,000만원 · 매월 말 100만원 × 12개월 · 연 명목 12% · 월복리',goal:'월별 현금흐름의 순현재가치',tip:'NPV 워크시트의 I에는 월 이율 1을 넣습니다. TVM의 P/Y가 NPV의 이율을 자동으로 나누지 않습니다.'},
 hw4:{story:'액면가 $1,000 · 만기 15년 · 쿠폰 없음 · 연 명목 YTM 6.85% · 반기복리',goal:'제로쿠폰채의 현재가치',tip:'쿠폰이 없으므로 PMT=0입니다. N=30, I/Y=6.85, P/Y=C/Y=2, FV=1000으로 PV를 구합니다.'},
 hw5:{story:'액면가 $1,000 · 잔존만기 11년 · 연 쿠폰율 8.8% · 반기 지급 · 연 명목 YTM 11.2% · 반기복리',goal:'쿠폰채의 현재가치',tip:'회당 쿠폰은 1,000×8.8%÷2=44달러입니다. N=22, 마지막에는 쿠폰 44달러와 원금 1,000달러를 함께 받습니다.'},
 'ls7-zero':{story:'액면가 $1,000 · 만기 1년 · 쿠폰 없음 · 연 명목 YTM 8% · 반기복리',goal:'제로쿠폰채의 현재가치',tip:'1년이지만 반기복리이므로 N=2입니다. 이자 지급은 없고 만기에 원금만 받습니다.'},
 hw8:{story:'현재 주가 $36.84 · 직전 배당 D₀ $1.61 · 연 요구수익률 15.8%',goal:'현재 주가에 내포된 배당성장률',tip:'D₁=D₀(1+g)입니다. D₀를 바로 배당수익률 계산에 넣지 않고 g=(P₀R−D₀)/(P₀+D₀)로 역산합니다.'},
 hw9:{story:'직전 배당 D₀ $0.20 · 초기 4년 연 15% 성장 · 이후 연 2.5% 영구 성장 · 요구수익률 17.4%',goal:'차등성장 주식의 현재 적정주가',tip:'D₁~D₄를 각각 할인하고, P₄=D₅/(R−g)를 4년 할인해 더합니다. D₄와 P₄는 같은 시점입니다.'},
 hw10:{story:'현재 EPS $2.08 · 기준 PER 12.7배 · 예상 연 이익 성장률 3.8%',goal:'현재 EPS 기준 적정주가',tip:'현재 주가는 2.08×12.7입니다. 3.8% 성장률은 미래 연도의 EPS와 주가를 구할 때 적용합니다.'},
 'ls8-gordon':{story:'직전 배당 D₀ $0.50 · 연 배당성장률 2% · 요구수익률 15%',goal:'일정성장 주식의 현재 적정주가',tip:'D₁=0.50×1.02=0.51입니다. P₀=0.51/(0.15−0.02)이며, R>g를 확인합니다.'},
 'ls8-multi':{story:'직전 배당 D₀ $1 · 초기 성장률 20% → 15% → 15% · 이후 연 5% 영구 성장 · 요구수익률 20%',goal:'차등성장 주식의 현재 적정주가',tip:'초기 성장률을 20,15,15로 입력합니다. 안정성장은 4년 차부터이므로 P₃=D₄/(R−g)입니다.'},
 'ls8-return':{story:'현재 주가 $10.50 · 직전 배당 D₀ $1 · 연 배당성장률 5%',goal:'배당수익률·자본이득률·요구수익률',tip:'다음 배당 1.05달러를 주가로 나누면 10%입니다. 여기에 성장률 5%를 더하면 요구수익률은 15%입니다.'},
 'ls7-perp':{story:'매년 말 $50 영구 지급 · 연 요구수익률 5%',goal:'영구채의 현재가치',tip:'첫 지급은 1년 후입니다. 만기 원금 상환은 없으며, 가치=50÷0.05입니다.'},
 'ls8-per':{story:'지난 1년 EPS $3 · 산업 기준 PER 12배',goal:'PER 기준 현재 적정주가',tip:'EPS와 PER을 곱합니다. PER은 배수, 결과는 주당 금액입니다.'}
};
for(const y of [8,6,4])exampleStories['ls7-'+y]={story:`액면가 $1,000 · 만기 2년 · 연 쿠폰율 6% · 반기 지급 · 연 명목 YTM ${y}% · 반기복리`,goal:'쿠폰율과 YTM에 따른 채권 현재가치',tip:`매회 30달러를 4번 받고 마지막에 원금도 받습니다. ${y>6?'YTM이 쿠폰율보다 높아 할인채입니다.':y===6?'YTM과 쿠폰율이 같아 액면채입니다.':'YTM이 쿠폰율보다 낮아 할증채입니다.'} YTM 변화에 따른 채권 가격 비교.`};
export function storyCard(id){const e=exampleStories[id];return e?`<section class="scenario-card" aria-label="예제 설명"><div class="scenario-head"><span>PROBLEM → APPROACH</span><small class="scenario-status">선택한 예제의 조건</small></div><p>${e.story}</p><div class="scenario-goal"><b>계산 항목</b><span>${e.goal}</span></div><div class="scenario-tip"><b>풀이의 출발점</b><span>${e.tip}</span></div></section>`:'';}
