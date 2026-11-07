// All rates in engine functions are decimals. Money retains the selected display unit.
export function periodicRate(rate, type, py, cy) {
  if (!(py > 0 && cy > 0) || !Number.isFinite(rate)) throw new Error('이율과 빈도를 확인해 주세요.');
  if (type === 'period') { if(rate<=-1) throw new Error('기간 이율은 -100%보다 커야 합니다.'); return rate; }
  const base = type === 'effective' ? 1 + rate : 1 + rate / cy;
  if (base <= 0) throw new Error('복리 계산의 1 + 기간 이율이 0보다 커야 합니다.');
  return Math.expm1(Math.log(base) * (type === 'effective' ? 1 / py : cy / py));
}
export function annualNominal(i, py, cy) { return cy * Math.expm1(Math.log1p(i) * py / cy); }
export function annuity(i,n) { return Math.abs(i) < 1e-12 ? n : Math.expm1(n*Math.log1p(i))/i; }
export function tvm({solve='fv',n,rate,rateType='nominal',py=1,cy=1,pv=0,pmt=0,fv=0,bgn=false}) {
  if (![py,cy].every(x=>Number.isInteger(x)&&x>=1&&x<=365)) throw new Error('P/Y와 C/Y는 1~365의 정수로 입력해 주세요.');
  const required = {n,rate,pv,pmt,fv};
  for (const [key,value] of Object.entries(required)) if(key!==solve && !Number.isFinite(value)) throw new Error('빈칸 없이 유효한 숫자를 입력해 주세요.');
  if(solve!=='n' && !(n>0 && n<=100000)) throw new Error('총 기간 N은 0보다 크고 100,000 이하여야 합니다.');
  let i=solve==='rate'?0:periodicRate(rate,rateType,py,cy), result;
  const factor = (r)=>annuity(r,n)*(bgn?1+r:1);
  if(solve==='fv') result=-(pv*Math.exp(n*Math.log1p(i))+pmt*factor(i));
  else if(solve==='pv') result=-(fv+pmt*factor(i))/Math.exp(n*Math.log1p(i));
  else if(solve==='pmt') result=-(fv+pv*Math.exp(n*Math.log1p(i)))/factor(i);
  else if(solve==='n') {
    const a=pmt*(bgn?1+i:1);
    if(Math.abs(i)<1e-12) { if(pmt===0) throw new Error('이율과 PMT가 모두 0이면 N을 구할 수 없습니다.'); result=-(pv+fv)/pmt; }
    else { const ratio=(a-fv*i)/(pv*i+a); if(!(ratio>0)) throw new Error('현재 현금흐름으로 목표금액에 도달할 수 없습니다.'); result=Math.log(ratio)/Math.log1p(i); }
    if(!(result>0 && result<=100000)) throw new Error('양의 유효한 기간을 구할 수 없습니다. 현금흐름 부호와 목표를 확인해 주세요.');
    n=result;
  } else if(solve==='rate') {
    // Restrict to conventional cash flows: unique nonnegative yield for learning use.
    const signs=(bgn?[pv+pmt,...(n>1?[pmt]:[]),fv]:[pv,pmt,fv]).filter(x=>x!==0).map(Math.sign);
    const changes=signs.slice(1).filter((x,j)=>x!==signs[j]).length;
    if(changes!==1) throw new Error('I/Y 계산은 시간 순서대로 현금흐름 부호가 한 번 바뀌는 일반 투자·대출을 지원합니다.');
    const balance=(r)=>pv + pmt*(bgn?1+r:1)*(Math.abs(r)<1e-12?n:-Math.expm1(-n*Math.log1p(r))/r)+fv*Math.exp(-n*Math.log1p(r));
    let lo=0,hi=periodicRate(100,'nominal',py,cy),a=balance(lo),b=balance(hi);
    if(a===0) i=0;
    else {
      if(Math.sign(a)===Math.sign(b)) throw new Error('0~10,000% 범위에서 연 명목이율을 찾을 수 없습니다. 현금흐름을 확인해 주세요.');
      for(let j=0;j<180;j++){ const mid=(lo+hi)/2,c=balance(mid); if(Math.sign(c)===Math.sign(a)) {lo=mid;a=c;} else hi=mid; }
      i=(lo+hi)/2;
    }
    result=annualNominal(i,py,cy);
  } else throw new Error('계산 대상을 확인해 주세요.');
  if(!Number.isFinite(result)) throw new Error('계산 범위를 벗어났습니다. 기간과 이율을 줄여 주세요.');
  const values={pv,pmt,fv,n,rate};values[solve]=result;
  const nominal=annualNominal(i,py,cy);
  return {result,i,nominal,ear:Math.expm1(py*Math.log1p(i)),n,values};
}
export function convert(rate,cy,direction='nominal') {
  if(!Number.isFinite(rate)||!Number.isInteger(cy)||cy<1||cy>365) throw new Error('이율과 연 복리 횟수(1~365)를 확인해 주세요.');
  const nominal=direction==='nominal'?rate:cy*Math.expm1(Math.log1p(rate)/cy);
  if(1+nominal/cy<=0 || (direction==='effective'&&rate<=-1)) throw new Error('유효한 이율 범위를 확인해 주세요.');
  const ear=Math.expm1(cy*Math.log1p(nominal/cy));
  return {nominal,ear,period:nominal/cy,result:direction==='nominal'?ear:nominal};
}
export function npv({cf0,flows,rate,rateType='period',py=1,cy=1}) {
  if(!Number.isFinite(cf0)||!flows.length||flows.length>24) throw new Error('초기 현금흐름과 1~24개 현금흐름을 입력해 주세요.');
  const i=periodicRate(rate,rateType,py,cy);
  let total=cf0,period=0;const rows=[];
  for(const flow of flows){
    if(!Number.isFinite(flow.amount)||!Number.isInteger(flow.frequency)||flow.frequency<1||flow.frequency>9999) throw new Error('금액과 반복 횟수(1~9,999의 정수)를 확인해 주세요.');
    for(let j=0;j<flow.frequency;j++){period++;if(period>10000) throw new Error('총 현금흐름 기간은 10,000 이하로 입력해 주세요.');const present=flow.amount*Math.exp(-period*Math.log1p(i));total+=present;rows.push({period,amount:flow.amount,present});}
  }
  if(!Number.isFinite(total)) throw new Error('계산 범위를 벗어났습니다. 이율과 기간을 확인해 주세요.');
  return {result:total,i,rows,periods:period,inflowPV:total-cf0};
}
export const examples=[
 {id:'pv',mode:'tvm',title:'일시금의 현재가치',caption:'연 12% · 일시금 할인',answer:'PV = −14,185.67',data:{solve:'pv',n:5,nUnit:'years',rate:12,rateType:'nominal',py:1,cy:1,pv:0,pmt:0,fv:25000,bgn:false,unit:'dollar'}},
 {id:'fv',mode:'tvm',title:'예금의 미래가치',caption:'연 6% · 5년 복리',answer:'FV = 13,382.26',data:{solve:'fv',n:5,nUnit:'years',rate:6,rateType:'nominal',py:1,cy:1,pv:-10000,pmt:0,fv:0,bgn:false,unit:'dollar'}},
 {id:'loan',mode:'tvm',title:'대출의 연 상환액',caption:'연 6.8% · 5회 연말 상환',answer:'PMT = −18,193.96',data:{solve:'pmt',n:5,nUnit:'years',rate:6.8,rateType:'nominal',py:1,cy:1,pv:75000,pmt:0,fv:0,bgn:false,unit:'dollar'}},
 {id:'tuition',mode:'monthly',title:'월 지급액의 현재가치',caption:'연 명목 3.7% · 매월 말 수령',answer:'PV = −6,682.99만원',data:{solve:'pv',n:48,nUnit:'months',rate:3.7,rateType:'nominal',py:12,cy:12,pv:0,pmt:150,fv:0,bgn:false,unit:'man'}},
 {id:'retire',mode:'monthly',title:'은퇴자금의 월 인출액',caption:'연 5.5% 월복리 · 18년',answer:'PMT = 701.10',data:{solve:'pmt',n:18,nUnit:'years',rate:5.5,rateType:'nominal',py:12,cy:12,pv:-96000,pmt:0,fv:0,bgn:false,unit:'dollar'}},
 {id:'ear',mode:'apr',title:'월복리 실효이율',caption:'NOM 12% · C/Y 12',answer:'EAR = 12.682503%',data:{direction:'nominal',rate:12,cy:12}},
 {id:'ti-ear',mode:'apr',title:'분기복리 실효이율',caption:'NOM 15% · C/Y 4',answer:'EAR = 15.865042%',data:{direction:'nominal',rate:15,cy:4}},
 {id:'npv',mode:'npv',title:'설비 투자의 순현재가치',caption:'−7,000 → 3,000 · 5,000×4 · 4,000',answer:'NPV = 12,393.65',data:{cf0:-7000,rate:10,rateType:'period',py:1,cy:1,unit:'dollar',flows:[{amount:3000,frequency:1},{amount:5000,frequency:4},{amount:4000,frequency:1}]}},
 {id:'npv-month',mode:'npv',title:'월 현금흐름의 순현재가치',caption:'−1,000 → 월 100×12 · 연 명목 12%',answer:'NPV = 125.51',data:{cf0:-1000,rate:12,rateType:'nominal',py:12,cy:12,unit:'man',flows:[{amount:100,frequency:12}]}}
];
