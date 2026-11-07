import {valuationVisual} from './study-visuals.js';
import {tvm} from './finance.js';
export const valuationDefaults={bond:{bondSolve:'price',face:1000,coupon:8.8,years:11,py:2,yield:11.2,price:850,unit:'dollar'},stock:{model:'multi',d0:.2,g:2.5,r:17.4,price:36.84,eps:2.08,pe:12.7,growths:'15,15,15,15',unit:'dollar'}};
export function bond(s){
 for(const k of ['face','coupon','years','py',...(s.bondSolve==='yield'?['price']:['yield'])])if(!Number.isFinite(s[k]))throw Error('채권의 숫자 조건을 모두 입력해 주세요.');
 if(s.face<=0||s.coupon<0||s.years<=0||!Number.isInteger(s.py)||s.py<1)throw Error('액면가·만기는 양수, 쿠폰율은 0 이상으로 입력하세요.');
 const n=s.years*s.py;if(!Number.isInteger(n))throw Error('만기 × 연 지급 횟수는 정수여야 합니다. 쿠폰 지급일 기준으로 계산합니다.');
 const pmt=s.face*s.coupon/100/s.py;
 if(s.bondSolve==='yield'&&s.price<=0)throw Error('시장가격은 0보다 커야 합니다.');
 const r=tvm({solve:s.bondSolve==='yield'?'rate':'pv',n,py:s.py,cy:s.py,rate:s.yield/100,pv:-s.price,pmt,fv:s.face});
 return {...r,result:s.bondSolve==='yield'?r.result*100:-r.result,pmt,n,yield:s.bondSolve==='yield'?r.result*100:s.yield};
}
export function stock(s){
 const need={gordon:['d0','g','r'],multi:['d0','g','r'],required:['d0','g','price'],growth:['d0','r','price'],multiple:['eps','pe'],perpetuity:['d0','r']}[s.model];
 if(!need||need.some(k=>!Number.isFinite(s[k])))throw Error('모형에 필요한 숫자를 모두 입력하세요.');
 if(s.model==='multiple'){if(s.pe<=0||s.eps<=0)throw Error('이 학습 모형에서는 양의 EPS와 PER을 입력하세요.');return {result:s.eps*s.pe,label:'P₀ · PER 기준 주가',formula:'P₀ = EPS × PER',rows:[]};}
 if(s.d0<0)throw Error('배당은 0 이상이어야 합니다.');
 if(['required','growth'].includes(s.model)&&s.price<=0)throw Error('현재 주가는 양수로 입력하세요.');
 let g=s.g/100,r=s.r/100;
 if(s.model==='growth'){g=(s.price*r-s.d0)/(s.price+s.d0);return {result:g*100,label:'g · 배당성장률',percent:true,formula:'g = (P₀ × R − D₀) / (P₀ + D₀)',d1:s.d0*(1+g),g,r,rows:[]};}
 if(g<=-1&&s.model!=='perpetuity')throw Error('성장률은 −100%보다 커야 합니다.');
 if(s.model==='required'){r=s.d0*(1+g)/s.price+g;return {result:r*100,label:'R · 요구수익률',percent:true,formula:'R = D₀(1+g) / P₀ + g',d1:s.d0*(1+g),g,r,rows:[]};}
 if(s.model==='perpetuity')g=0;
 if(r<=0||r<=g)throw Error('영구 가치평가에는 R > g와 R > 0 조건이 필요합니다.');
 let d=s.d0,rows=[];
 if(s.model==='multi'){
 const rates=s.growths.split(',').map(x=>x.trim());if(!rates.length||rates.length>50||rates.some(x=>x===''||!Number.isFinite(Number(x))||Number(x)<=-100))throw Error('초기 성장률은 연도별로 쉼표로 구분하세요. 예: 20,15,15 (최대 50년)');
 rates.forEach((rate,j)=>{d*=1+Number(rate)/100;rows.push({year:j+1,growth:Number(rate),dividend:d,pv:d/(1+r)**(j+1)});});
 }
 const next=d*(1+g),terminal=next/(r-g),n=rows.length,terminalPV=terminal/(1+r)**n;
 return {result:rows.reduce((a,b)=>a+b.pv,0)+terminalPV,label:s.model==='perpetuity'?'PV · 영구연금 가치':'P₀ · 배당 기준 주가',formula:s.model==='multi'?'P₀ = Σ Dₜ/(1+R)ᵗ + Pₙ/(1+R)ⁿ':'P₀ = D₁ / (R − g)',rows,terminal,terminalPV,next,n,g,r,d1:s.d0*(1+g)};
}
const b=(id,title,caption,data)=>({id,mode:'bond',title,caption,answer:'조건 불러오기 →',data:{...valuationDefaults.bond,...data}});
const s=(id,title,caption,data)=>({id,mode:'stock',title,caption,answer:'조건 불러오기 →',data:{...valuationDefaults.stock,...data}});
export const valuationExamples=[
 b('hw4','제로쿠폰채 · 15년','액면 $1,000 · YTM 6.85% · 반기복리',{coupon:0,years:15,yield:6.85}),
 b('hw5','쿠폰채의 현재가치','11년 · 쿠폰 8.8% · YTM 11.2% · 반기',{ }),
 ...[8,6,4].map(y=>b('ls7-'+y,y>6?'할인채':y===6?'액면채':'할증채','2년 · 액면 $1,000 · 쿠폰 6% · 반기',{years:2,coupon:6,yield:y})),
 b('ls7-zero','제로쿠폰채 · 1년','액면 $1,000 · YTM 8% · 반기복리',{years:1,coupon:0,yield:8}),
 s('hw8','배당성장률 역산','P₀ $36.84 · D₀ $1.61 · R 15.8% → g',{model:'growth',price:36.84,d0:1.61,r:15.8}),
 s('hw9','차등성장 · 초기 4년','D₀ $0.20 · 4년 15% → 2.5% · R 17.4%',{}),
 s('hw10','PER 기준 현재 적정주가','현재 EPS $2.08 × PER 12.7 → 현재 주가',{model:'multiple',eps:2.08,pe:12.7}),
 s('ls8-gordon','일정성장','D₀ $0.50 · g 2% · R 15%',{model:'gordon',d0:.5,g:2,r:15}),
 s('ls8-multi','차등성장 · 초기 3년','D₀ $1 · 20% → 15% → 15% → 5% 영구',{model:'multi',d0:1,growths:'20,15,15',g:5,r:20}),
 s('ls8-return','요구수익률 분해','P₀ $10.50 · D₀ $1 · g 5%',{model:'required',price:10.5,d0:1,g:5}),
 s('ls7-perp','영구채','매년 $50 영구 지급 · R 5%',{model:'perpetuity',d0:50,r:5}),
 s('ls8-per','PER 기준 가치평가','EPS $3 × PER 12',{model:'multiple',eps:3,pe:12})
];
export function valuationForm(mode,state,{select,number,unitSelect,freqOptions}){
 const s=state;
 if(mode==='bond')return `<div class="form-grid">${select('bondSolve','구할 값',[['price','채권 가격'],['yield','만기수익률 YTM']])}${unitSelect()}${number('face','액면가 F','', '만기에 상환되는 원금')}${number('coupon','연 쿠폰율','%','제로쿠폰채는 0')}${number('years','잔존만기','년','쿠폰 지급일 기준')}${select('py','연 지급·복리 횟수',freqOptions)}${number('yield','연 명목 YTM','%','P/Y = C/Y 적용',s.bondSolve==='yield')}${number('price','시장가격','','YTM 역산에 사용',s.bondSolve==='price')}</div><p class="insight-small">각 지급기간 말 쿠폰 지급, 액면 상환을 가정합니다. 경과이자·일수 계산은 포함하지 않습니다. YTM 역산은 0~10,000%를 지원합니다.</p>`;
 return select('model','가치평가 모형',[['gordon','일정성장 · Gordon'],['multi','다단계 배당성장'],['growth','성장률 g 역산'],['required','요구수익률 R 역산'],['perpetuity','무성장 · 영구연금'],['multiple','PER × EPS']])+unitSelect()+`<div class="form-grid">${s.model==='multiple'?number('eps','현재 EPS')+number('pe','기준 PER','배'):number('d0',s.model==='perpetuity'?'매년 지급액 D':'D₀ · 방금 지급한 배당','',s.model==='perpetuity'?'첫 지급은 1년 후':'다음 배당 D₁과 구분하세요')+(['gordon','multi','required'].includes(s.model)?number('g',s.model==='multi'?'안정성장률 g':'연 배당성장률 g','%'): '')+(s.model!=='required'?number('r','연 요구수익률 R','%'):'')+(['growth','required'].includes(s.model)?number('price','현재 주가 P₀'):'')}</div>`+(s.model==='multi'?`<label class="field" for="growths"><span class="field-label">초기 구간의 연도별 성장률 (%)</span><input id="growths" name="growths" value="${s.growths.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}" style="width:100%;padding:12px;border:1px solid #dfe6d5;border-radius:6px"><p class="field-hint">예: 20,15,15 → 1년 20%, 2·3년 15%, 4년부터 안정성장률 적용</p></label>`:'')+`<p class="insight-small">${s.model==='multiple'?'현재 EPS로 현재 주가를 평가합니다. 현재 주가에는 현재 EPS를 적용합니다. 미래 주가라면 해당 연도의 EPS를 사용하세요.':'D₀는 현재 지급 완료된 배당이므로 현재가치에 다시 더하지 않습니다. 영구성장 구간은 R > g 조건이 필요합니다.'}</p>`;
}
export function valuationView(mode,s,{fmt,pct,metric,commonHead,step,keys,unitName}){
 const r=mode==='bond'?bond(s):stock(s),u=unitName(),isRate=mode==='bond'?s.bondSolve==='yield':r.percent;
 const label=mode==='bond'?(isRate?'YTM · 연 명목 만기수익률':'P · 채권 시장가격'):r.label;
 let guide,insight,metrics;
 if(mode==='bond'){
 metrics=metric('전체 기간 N',r.n,'회')+metric('회당 쿠폰 PMT',fmt(r.pmt),u)+metric('연 명목 YTM',fmt(r.yield,4),'%');
 guide=step(1,'초기화와 지급 빈도',[['2nd','FV (CLR TVM)'],['2nd','I/Y (P/Y)',String(s.py),'ENTER','↓',String(s.py),'ENTER','2nd','CPT (QUIT)']])+step(2,'기간 말 지급 END 확인',[['2nd','PMT (BGN)']],'END가 아니면 [2nd] [ENTER (SET)]로 전환한 뒤 [2nd] [CPT (QUIT)].')+step(3,'알고 있는 값 입력',[[String(r.n),'N'],[String(r.pmt),'PMT'],[String(s.face),'FV'],isRate?[String(s.price),'+/−','PV']:[String(s.yield),'I/Y']])+step(4,'계산',[['CPT',isRate?'I/Y':'PV']],'PV는 매입 지출로 음수이며 화면의 채권 가격은 그 절댓값입니다.');
 insight=`<h4 class="insight-title">쿠폰과 원금을,<br>각 시점에서 할인합니다.</h4><p class="insight-copy">액면 ${fmt(s.face)}${u}, 매회 쿠폰 ${fmt(r.pmt)}${u}, 총 ${r.n}회입니다. ${Math.abs(r.yield-s.coupon)<1e-7?'YTM = 쿠폰율이므로 액면채입니다.':r.yield>s.coupon?'YTM > 쿠폰율이므로 할인채입니다.':'YTM < 쿠폰율이므로 할증채입니다.'}</p><div class="formula-box">가격 = Σ C/(1+i)ᵗ + F/(1+i)ᴺ<br>i = YTM / ${s.py} · N = ${s.years} × ${s.py}</div><p class="insight-small">쿠폰은 정기 이자 지급액, 액면가는 만기 상환 원금입니다.<br>쿠폰율이 YTM보다 낮으면 할인채입니다.<br>다른 조건이 같다면 만기가 길고 쿠폰이 낮을수록 금리 변화에 대한 가격 민감도가 큽니다. 금리 하락 시 장기 제로쿠폰채의 가격 상승률이 큽니다.</p>`;
 }else{
 metrics=s.model==='multiple'?metric('현재 EPS',fmt(s.eps),u)+metric('기준 PER',fmt(s.pe),'배'):metric(r.rows.length?`D${r.n+1} · 안정성장 첫 배당`:'다음 배당 D₁',fmt(r.next??r.d1??s.d0,4),u)+metric('요구수익률',fmt(r.r*100,4),'%')+metric('안정 성장률',fmt(r.g*100,4),'%');
 guide=step(1,'사용할 값의 시점 확인',[],s.model==='multiple'?'현재 EPS와 기준 PER을 사용합니다. 미래 주가를 구하는 문제라면 미래 EPS를 먼저 계산합니다.':'D₀는 지급 완료 배당입니다. D₁ = D₀ × (1+g). 모든 이율은 소수로 바꿔 산술 계산합니다.');
 if(r.rows?.length){guide+=step(2,'연도별 배당과 말기 가치 계산',[],`P${r.n} = D${r.n+1}/(R−g) = ${fmt(r.terminal,6)}. 마지막 연도 배당에 이 값을 더해 입력합니다.`)+step(3,'CF 워크시트에 배당 현금흐름 입력',[['CF','2nd','CE/C (CLR WORK)'],['0','ENTER','↓'],...r.rows.flatMap((v,j)=>[[String(Number((v.dividend+(j===r.n-1?r.terminal:0)).toPrecision(12))),'ENTER','↓'],['1','ENTER',...(j<r.n-1?['↓']:[])]])])+step(4,'연 할인율로 현재가치 계산',[['NPV',String(s.r),'ENTER','↓','CPT']],'CF₀=0이므로 NPV 결과가 주식 가치 P₀입니다. TVM의 P/Y는 적용되지 않습니다.');}
 else guide+=step(2,'다음 산술식을 계산',[],s.model==='multiple'?`${s.eps} × ${s.pe} =`:s.model==='growth'?`(${s.price} × ${s.r/100} − ${s.d0}) ÷ (${s.price} + ${s.d0}) × 100 =`:s.model==='required'?`${s.d0} × (1 + ${s.g/100}) ÷ ${s.price} + ${s.g/100} = → × 100`: `${s.d0} × (1 + ${r.g}) ÷ (${s.r/100} − ${r.g}) =`);
 insight=`<h4 class="insight-title">배당의 시점과,<br>성장 구간을 확인하세요.</h4><div class="formula-box">${r.formula}</div>${r.rows.length?`<div class="cf-table-wrap"><table class="help-table"><thead><tr><th>연도</th><th>배당 Dₜ</th><th>현재가치</th></tr></thead><tbody>${r.rows.map(v=>`<tr><td>${v.year}</td><td>${fmt(v.dividend,6)}</td><td>${fmt(v.pv,6)}</td></tr>`).join('')}</tbody></table></div><p class="insight-copy">${r.n}년 말의 P${r.n} = ${fmt(r.terminal,6)}${u}. 이를 현재로 할인한 금액은 ${fmt(r.terminalPV,6)}${u}입니다. 마지막 배당과 말기 가치는 같은 시점에 발생합니다.</p>`:''}${['required','growth'].includes(s.model)?`<p class="insight-copy">배당수익률 D₁/P₀ = ${fmt(r.d1/s.price*100,4)}%, 자본이득률 g = ${fmt(r.g*100,4)}%, 요구수익률 R = ${fmt(r.r*100,4)}%.</p>`:''}<p class="insight-small">주가 상승률은 자본이득률입니다.<br>D₁ > 0, R > g에서 배당과 성장률이 같다면 할인율 R이 낮아질수록 현재 주가는 커집니다.<br>현재가치 모형의 가정에 따른 계산 결과입니다.</p>`;
 if(s.model==='multiple')insight=`<h4 class="insight-title">주당 이익에,<br>평가 배수를 곱합니다.</h4><p class="insight-copy">현재 EPS ${fmt(s.eps)}${u}에 기준 PER ${fmt(s.pe)}배를 적용하면, 현재 평가액은 ${fmt(r.result)}${u}입니다.</p><div class="formula-box">P₀ = EPS₀ × 기준 PER<br>${fmt(s.eps)} × ${fmt(s.pe)} = ${fmt(r.result)}</div><p class="insight-small">EPS는 주당 이익, PER은 이익에 적용하는 배수입니다. 기준 PER이 달라지면 평가액도 달라집니다. 미래 n년 후 주가를 구한다면 미래 EPSₙ = EPS₀(1+g)ⁿ를 먼저 구하고 해당 시점의 PER을 적용합니다. 현재 적정주가는 현재 EPS를 기준으로 평가합니다.</p>`;
 }
 return {result:commonHead(mode==='bond'?'BOND VALUATION':'STOCK VALUATION')+`<div class="result-name">${label}</div><div class="result-number" data-result="${r.result}">${fmt(r.result,isRate?6:2)}<span class="result-unit">${isRate?'%':u}</span></div><p class="result-subtitle">${mode==='bond'?'지급기간 말 쿠폰 · 액면가 상환':s.model==='multiple'?'현재 주당 이익 × 기준 평가 배수':'D₀와 D₁ 구분 · 미래 현금흐름의 가치'}</p><div class="result-metrics">${metrics}</div>${valuationVisual(mode,s,r)}<div class="result-foot">${mode==='bond'?`N = ${r.n} · PMT = ${fmt(r.pmt)} · FV = ${s.face}<br>P/Y = C/Y = ${s.py} · END`:r.formula}</div>`,guide,insight};
}
