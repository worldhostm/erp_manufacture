# ERP Manufacturing System

100인 이하 제조업을 위한 통합 ERP 웹 시스템입니다.

## 🏗️ 아키텍처

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + MongoDB
- **Database**: MongoDB (Mongoose ODM)
- **Deployment**: Railway
- **Authentication**: JWT 기반 인증

## 📋 주요 기능 (31개 메뉴)

### 1. 기준정보 관리 (4개 메뉴)
- **회사정보 관리**: 자사 및 협력회사 기본정보 관리
- **품목/BOM 관리**: 제품, 부품, 원자재 정보 및 BOM 관리 (협력사별 필터링 지원)
- **협력회사 관리**: 공급업체 및 고객사 정보 관리 (등록 화면 포함)
- **사용자/부서 관리**: 시스템 사용자 및 조직 관리

### 2. 구매관리 (4개 메뉴)
- **구매요청 관리**: 부서별 구매요청 접수 및 승인
- **구매주문 관리**: 공급업체별 구매주문서 작성 및 관리
- **입고 관리**: 구매물품 입고처리 및 검수
- **구매현황 분석**: 구매실적 및 공급업체 평가

### 3. 생산관리 (6개 메뉴)
- **생산계획 관리**: 월/주별 생산계획 수립
- **작업지시 관리**: 생산작업지시서 발행 및 진행관리
- **생산실적 관리**: 작업완료 실적 등록 및 관리
- **공정 관리**: 생산공정 정보 및 흐름 관리
- **설비 관리**: 생산설비 정보 및 가동현황 관리
- **작업자 관리**: 작업자 배치 및 실적 관리

### 4. 재고관리 (4개 메뉴)
- **재고현황 조회**: 실시간 재고현황 및 위치별 조회
- **출고 관리**: 제품/자재 출고처리 및 관리
- **재고조정 관리**: 재고실사 및 조정 처리
- **안전재고 관리**: 품목별 안전재고 설정 및 알림

### 5. 품질관리 (3개 메뉴)
- **품질검사 관리**: 입고/생산/출하 검사 관리
- **불량품 관리**: 불량품 발생 및 처리현황 관리
- **품질분석 리포트**: 품질수준 분석 및 개선점 도출

### 6. 판매관리 (4개 메뉴)
- **수주 관리**: 고객주문 접수 및 수주확정
- **출하 관리**: 제품 출하계획 및 출하처리
- **매출 관리**: 매출전표 발행 및 수금관리
- **고객 관리**: 고객정보 및 거래현황 관리

### 7. 회계관리 (3개 메뉴)
- **매입/매출 전표**: 회계전표 자동생성 및 관리
- **원가 관리**: 제품별 원가계산 및 분석
- **손익 분석**: 월/분기별 손익현황 분석

### 8. 인사관리 (3개 메뉴)
- **직원 관리**: 직원정보 및 인사기록 관리
- **근태 관리**: 출퇴근 및 휴가관리
- **급여 관리**: 급여계산 및 명세서 발행

### 9. 보고서 및 분석 (4개 메뉴)
- **매출 분석**: 매출현황 및 추이 분석
- **생산 분석**: 생산실적 및 효율성 분석
- **재고 분석**: 재고회전율 및 적정재고 분석
- **원가 분석**: 제품별 원가구조 분석

### 10. 시스템 관리 (3개 메뉴)
- **시스템 설정**: 기본설정 및 코드관리
- **백업/복원**: 데이터 백업 및 복원
- **로그 관리**: 사용자 접속 및 작업 로그

## 🚀 빠른 시작

### 필요 조건
- Node.js 18 이상
- MongoDB (로컬 또는 MongoDB Atlas)

### 1. 프로젝트 클론 및 설정

```bash
git clone <repository-url>
cd erp_manufacture
```

### 2. 의존성 설치

```bash
# 프론트엔드 의존성
npm install

# 백엔드 의존성
cd server
npm install
cd ..

# concurrently 설치 (동시 실행용)
npm install
```

### 3. 환경변수 설정

**.env.local (프론트엔드):**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**server/.env (백엔드):**
```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/erp_manufacture
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 4. 개발 서버 실행

#### 🎯 원클릭 실행 (권장)

**Windows:**
```bash
# 배치 파일 실행
start-dev.bat
```

**Linux/macOS:**
```bash
# 스크립트 실행
./start-dev.sh
```

#### 📋 수동 실행

**방법 1: 개별 스크립트 사용 (권장)**

Windows:
```bash
# 프론트엔드 실행
start-frontend.bat

# 백엔드 실행 (별도 터미널에서)
start-backend.bat
```

Linux/macOS:
```bash
# 프론트엔드 실행
./start-frontend.sh

# 백엔드 실행 (별도 터미널에서)  
./start-backend.sh
```

Node.js (플랫폼 무관):
```bash
# 프론트엔드 실행
node start-frontend.js

# 백엔드 실행 (별도 터미널에서)
node start-backend.js
```

**방법 2: concurrently 사용**
```bash
npm run dev:full
```

**방법 3: 별도 터미널**

터미널 1 - 백엔드:
```bash
cd server
npm run dev
```

터미널 2 - 프론트엔드:
```bash
npm run dev
```

### 5. 접속 확인

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

### 6. 서버 중지

**Windows:**
```bash
stop-dev.bat
```

**Linux/macOS:**
```bash
./stop-dev.sh
```

## 🧪 테스트 실행

```bash
# 백엔드 테스트 실행
npm run test:server

# 또는 직접 실행
cd server
npm test
```

## 🛠️ 개발 스크립트

### 프론트엔드
- `npm run dev` - 개발 서버 시작
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 시작
- `npm run lint` - ESLint 실행

### 백엔드
- `npm run server:dev` - 백엔드 개발 서버 시작
- `cd server && npm run build` - TypeScript 빌드
- `npm run server:start` - 백엔드 프로덕션 서버 시작
- `npm run test:server` - 테스트 실행

### 통합 실행
- `npm run dev:full` - 프론트엔드 + 백엔드 동시 실행
- `npm run build:all` - 전체 프로젝트 빌드
- `npm run start:prod` - 프로덕션 모드로 전체 실행

## 🚢 Railway 배포

### 백엔드 배포

1. **Railway 프로젝트 생성**
```bash
cd server
# Railway CLI 설치 후
railway login
railway init
```

2. **환경변수 설정**
Railway 대시보드에서 다음 환경변수를 설정:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/erp_manufacture
JWT_SECRET=production-jwt-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

3. **배포**
```bash
railway up
```

### 프론트엔드 배포

1. **Vercel 배포 (권장)**
```bash
# Vercel CLI 설치 후
vercel --prod
```

2. **환경변수 설정**
Vercel 대시보드에서:
```env
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=production-secret-key
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
```

## 📁 프로젝트 구조

```
erp_manufacture/
├── app/                     # Next.js App Router 페이지
│   ├── auth/               # 인증 관련 페이지
│   ├── dashboard/          # 대시보드
│   ├── master/            # 기준정보 관리
│   │   ├── companies/     # 협력사 관리
│   │   │   └── register/  # 협력사 등록 화면
│   │   └── items/         # 품목/BOM 관리 (협력사별 필터링)
│   ├── purchase/          # 구매관리
│   ├── production/        # 생산관리
│   ├── inventory/         # 재고관리
│   ├── quality/           # 품질관리
│   ├── sales/            # 판매관리
│   ├── accounting/       # 회계관리
│   ├── hr/              # 인사관리
│   ├── reports/         # 보고서 및 분석
│   └── system/          # 시스템 관리
├── components/           # 재사용 가능한 컴포넌트
├── server/              # Express.js 백엔드
│   ├── src/
│   │   ├── models/      # MongoDB 모델
│   │   ├── routes/      # API 라우트
│   │   ├── middleware/  # 미들웨어 (인증, 에러 처리)
│   │   └── config/      # 데이터베이스 설정
│   ├── tests/          # TDD 테스트 파일
│   ├── Dockerfile       # Docker 설정
│   └── railway.json     # Railway 배포 설정
├── logs/               # 개발 서버 로그 (자동 생성)
├── start-dev.bat       # Windows 개발 서버 시작 스크립트
├── start-dev.sh        # Linux/macOS 개발 서버 시작 스크립트
├── stop-dev.bat        # Windows 개발 서버 중지 스크립트
├── stop-dev.sh         # Linux/macOS 개발 서버 중지 스크립트
└── README.md
```

## 🔧 API 엔드포인트

### 인증
- `POST /api/auth/register` - 사용자 등록
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `PATCH /api/auth/me` - 사용자 정보 수정
- `PATCH /api/auth/change-password` - 비밀번호 변경

### 협력사 관리
- `GET /api/companies` - 협력사 목록 조회
- `GET /api/companies/:id` - 협력사 상세 조회
- `POST /api/companies` - 협력사 등록
- `PATCH /api/companies/:id` - 협력사 수정
- `DELETE /api/companies/:id` - 협력사 삭제
- `GET /api/companies/by-type/:type` - 타입별 협력사 조회

### 품목 관리
- `GET /api/items` - 품목 목록 조회 (협력사별 필터링 지원)
- `GET /api/items/:id` - 품목 상세 조회
- `POST /api/items` - 품목 등록
- `PATCH /api/items/:id` - 품목 수정
- `DELETE /api/items/:id` - 품목 삭제
- `GET /api/items/by-supplier/:supplierId` - 협력사별 품목 조회
- `GET /api/items/dropdown/list` - 드롭다운용 품목 목록

## 🔐 보안

- JWT 기반 인증
- 비밀번호 bcrypt 해싱
- API Rate Limiting
- CORS 설정
- Helmet 보안 헤더
- 입력 검증 (express-validator)
- MongoDB Injection 방지

## 🎨 주요 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 완벽 지원
- **협력사별 필터링**: 품목 관리에서 협력사별로 물품 조회 가능
- **실시간 대시보드**: 주요 KPI 및 현황 실시간 모니터링
- **권한 관리**: 사용자별 메뉴 접근 권한 제어
- **검색 및 필터링**: 각 모듈별 고급 검색 기능
- **데이터 시각화**: Charts 및 분석 리포트 제공
- **RESTful API**: 표준화된 API 설계
- **TDD 개발 환경**: Test-Driven Development 지원
- **원클릭 실행**: 개발 환경 쉬운 설정 및 실행

## 🧪 TDD (Test-Driven Development)

이 프로젝트는 TDD 방식으로 개발되었습니다:

- **Jest + Supertest**: API 테스트
- **MongoDB Memory Server**: 인메모리 테스트 DB
- **테스트 커버리지**: 핵심 기능 테스트 작성
- **CI/CD 준비**: 자동화된 테스트 실행

## 📝 라이선스

MIT License

## 🤝 기여

이 프로젝트에 기여하고 싶으시다면:

1. 포크(Fork)하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/AmazingFeature`)
5. 풀 리퀘스트를 생성하세요

## 📞 지원

문의사항이나 지원이 필요한 경우:
- 이슈를 등록해주세요
- 이메일: support@yourcompany.com

## 🎯 로드맵

- [x] 기본 ERP 모듈 31개 구현
- [x] TDD 개발 환경 구축
- [x] Express.js + MongoDB 백엔드
- [x] Next.js 14 프론트엔드
- [x] 원클릭 개발 환경 실행 스크립트
- [ ] 실시간 알림 시스템
- [ ] 모바일 앱 개발
- [ ] 고급 분석 및 BI 기능
- [ ] 다국어 지원 확장
- [ ] API 문서화 (Swagger)
- [ ] 단위 테스트 및 통합 테스트 확장
- [ ] CI/CD 파이프라인 구축