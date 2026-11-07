# Finance Lab

MBA 재무관리 학습용 인터랙티브 계산기입니다. 입력값에 맞는 계산 결과, 현금흐름 그림, 핵심 해석과 BA II Plus 입력 순서를 제공합니다.

- TVM: 현재가치, 미래가치, 정기 지급액, 기간, 이율
- 월복리 및 APR·EAR 환산
- NPV와 반복 현금흐름
- 채권 가격과 만기수익률
- 영구연금, 일정·차등 배당성장, 성장률·요구수익률 역산, PER 평가
- 학습 예제 23개와 모바일 화면 지원

## 실행

별도의 패키지 설치 없이 정적 파일 서버로 실행합니다.

```sh
python3 -m http.server 8000 --directory dist
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 계산 검증

Node.js가 설치된 환경에서 다음 명령을 실행합니다.

```sh
npm test
```

일시금, 연금, 월복리, 이율 환산, 기간·이율 역산, 채권 및 배당성장 모형 등을 검증하는 테스트 30개를 포함합니다.

## 계산 기준

금액 단위는 입력·표시 단위이며 환율을 변환하지 않습니다. 채권은 쿠폰 지급일, NPV는 동일 간격의 기간 말 현금흐름을 기준으로 합니다. 이율 역산은 지원 범위와 현금흐름 조건을 화면에 안내합니다. 수수료·세금·경과이자는 별도 반영하지 않습니다.

모든 계산은 현재 브라우저에서 처리하며 입력값을 외부로 전송하지 않습니다. `dist/finance.js`와 `dist/valuation.js`에 계산 수식, `dist/study-visuals.js`에 학습 그림과 설명이 있습니다.

## 공식 참고 자료

- [BA II Plus 공식 가이드 안내](https://education.ti.com/en/guidebook/details/en/ADF11FB65B284B6195B0A7E9502784BA/baiiplus?id=6114)
- [P/Y·C/Y 설정](https://education.ti.com/en/customer-support/knowledge-base/financial-calculators/general-information/11262)
- [NPV 계산 안내](https://education.ti.com/en/customer-support/knowledge-base/financial-calculators/product-usage/11241)

## Vercel 배포

Vercel에서 이 GitHub 저장소를 가져오면 `vercel.json`의 설정으로 `dist` 폴더를 정적 사이트로 배포합니다. 별도 설치나 빌드 단계는 필요하지 않습니다.
