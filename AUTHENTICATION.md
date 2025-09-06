# ERP Manufacturing System - 인증 시스템 문서

## 개요

ERP Manufacturing System은 JWT 기반 인증 시스템을 사용하여 사용자 인증과 권한 관리를 수행합니다. 시스템은 Express.js 백엔드와 Next.js 프론트엔드로 구성되어 있습니다.

## 시스템 구조

### 백엔드 (Express.js + MongoDB)
- **포트**: 8080
- **데이터베이스**: MongoDB (로컬: mongodb://localhost:27017/erp_manufacture)
- **인증 방식**: JWT (JSON Web Token)

### 프론트엔드 (Next.js)
- **포트**: 3000
- **상태 관리**: localStorage 기반 토큰 저장
- **API 통신**: Fetch API 사용

## 주요 파일 구조

```
├── server/src/
│   ├── routes/auth.ts          # 인증 API 엔드포인트
│   ├── middleware/auth.ts      # 인증 미들웨어
│   ├── models/User.ts         # 사용자 모델
│   └── tests/auth.test.ts     # 인증 테스트
├── lib/
│   ├── auth.ts                # 클라이언트 인증 서비스
│   └── auth-guard.tsx         # 라우트 보호 컴포넌트
└── app/auth/
    ├── signin/page.tsx        # 로그인 페이지
    ├── signup/page.tsx        # 회원가입 페이지
    └── error/page.tsx         # 인증 에러 페이지
```

## API 엔드포인트

### 1. 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "사용자 이름",
  "email": "user@example.com",
  "password": "비밀번호 (최소 6자)",
  "role": "USER | MANAGER | ADMIN (선택사항, 기본값: USER)",
  "department": "부서명 (선택사항)",
  "position": "직책 (선택사항)",
  "phone": "전화번호 (선택사항)"
}
```

**성공 응답 (201)**:
```json
{
  "status": "success",
  "token": "JWT_TOKEN",
  "data": {
    "user": {
      "_id": "사용자ID",
      "name": "사용자 이름",
      "email": "user@example.com",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-09-06T01:42:57.275Z",
      "updatedAt": "2025-09-06T01:42:57.275Z"
    }
  }
}
```

### 2. 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "비밀번호"
}
```

**성공 응답 (200)**:
```json
{
  "status": "success",
  "token": "JWT_TOKEN",
  "data": {
    "user": {
      "_id": "사용자ID",
      "name": "사용자 이름",
      "email": "user@example.com",
      "role": "USER",
      "isActive": true,
      "lastLogin": "2025-09-06T01:43:04.115Z"
    }
  }
}
```

### 3. 현재 사용자 정보 조회
```http
GET /api/auth/me
Authorization: Bearer JWT_TOKEN
```

### 4. 프로필 업데이트
```http
PATCH /api/auth/me
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "name": "새 이름 (선택사항)",
  "department": "새 부서 (선택사항)",
  "position": "새 직책 (선택사항)",
  "phone": "새 전화번호 (선택사항)"
}
```

### 5. 비밀번호 변경
```http
PATCH /api/auth/change-password
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "passwordCurrent": "현재 비밀번호",
  "password": "새 비밀번호",
  "passwordConfirm": "새 비밀번호 확인"
}
```

## 사용자 역할

시스템은 3단계 역할 기반 권한 시스템을 사용합니다:

1. **USER (일반 사용자)**: 기본 권한
2. **MANAGER (관리자)**: USER 권한 + 관리 기능
3. **ADMIN (최고 관리자)**: 모든 권한

역할 계층 구조:
- ADMIN ≥ MANAGER ≥ USER
- 상위 역할은 하위 역할의 모든 권한을 포함

## 클라이언트 사이드 인증

### AuthService 클래스

`lib/auth.ts`의 `AuthService` 클래스는 다음 기능을 제공합니다:

```typescript
// 사용 예시
import { authService } from '@/lib/auth';

// 로그인
const result = await authService.login('user@example.com', 'password');

// 현재 사용자 정보
const user = await authService.getCurrentUser();

// 인증 상태 확인
const isAuth = authService.isAuthenticated();

// 역할 확인
const hasManagerRole = await authService.hasRole('MANAGER');

// 로그아웃
authService.logout();
```

### React Hooks

```typescript
import { useAuth, useUser } from '@/lib/auth';

function MyComponent() {
  const { login, logout, isAuthenticated } = useAuth();
  const { user, loading } = useUser();
  
  // 컴포넌트 로직
}
```

### AuthGuard 컴포넌트

라우트 보호를 위한 HOC:

```typescript
import { AuthGuard, withAuthGuard } from '@/lib/auth-guard';

// 래핑 방식
function ProtectedPage() {
  return (
    <AuthGuard requireAuth={true} requiredRole="MANAGER">
      <MyProtectedContent />
    </AuthGuard>
  );
}

// HOC 방식
const ProtectedPage = withAuthGuard(MyComponent, {
  requireAuth: true,
  requiredRole: 'ADMIN'
});
```

## 인증 플로우

### 1. 회원가입 플로우
1. 사용자가 `/auth/signup`에서 정보 입력
2. 클라이언트가 `/api/auth/register`에 POST 요청
3. 서버에서 이메일 중복 검사 및 비밀번호 해싱
4. 새 사용자 생성 후 JWT 토큰 발급
5. 클라이언트가 토큰을 localStorage에 저장
6. `/dashboard`로 자동 리디렉션

### 2. 로그인 플로우
1. 사용자가 `/auth/signin`에서 로그인 정보 입력
2. 클라이언트가 `/api/auth/login`에 POST 요청
3. 서버에서 이메일/비밀번호 검증
4. 성공 시 JWT 토큰 발급, lastLogin 업데이트
5. 클라이언트가 토큰을 localStorage에 저장
6. `/dashboard`로 리디렉션

### 3. 인증 검사 플로우
1. 보호된 라우트 접근 시 AuthGuard 실행
2. localStorage에서 토큰 확인
3. `/api/auth/me`로 토큰 유효성 검사
4. 유효하면 사용자 정보 로드, 무효하면 로그인 페이지로 리디렉션

### 4. 에러 처리 플로우
- 인증 실패 시 `/auth/error?error=CredentialsSignin` 같은 형태로 리디렉션
- 에러 페이지에서 사용자 친화적인 메시지 표시
- "다시 로그인" 및 "홈으로 돌아가기" 버튼 제공

## 보안 설정

### JWT 설정
- **시크릿 키**: 환경변수 `JWT_SECRET`에 설정
- **만료 시간**: 7일 (환경변수 `JWT_EXPIRES_IN`)
- **알고리즘**: HMAC SHA256

### 비밀번호 보안
- **해싱**: bcryptjs 사용, salt rounds 12
- **최소 길이**: 6자
- **저장**: 해시된 비밀번호만 데이터베이스에 저장

### CORS 설정
- **개발환경**: http://localhost:3000
- **프로덕션**: 환경변수 `CORS_ORIGIN`으로 설정

## 환경 변수

### 서버 환경변수 (.env)
```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/erp_manufacture
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 클라이언트 환경변수
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 테스트

### API 테스트 실행
```bash
cd server
npm test
```

### 수동 테스트
```bash
# 회원가입 테스트
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"123456"}'

# 로그인 테스트
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

## 알려진 이슈 및 해결 방법

### 1. /auth/error 404 에러
**문제**: 로그인 실패 시 `/auth/error` 경로로 리디렉션되지 않던 문제
**해결**: `/app/auth/error/page.tsx` 파일 생성으로 해결됨

### 2. 회원가입 페이지 누락
**문제**: `/auth/signup` 경로가 존재하지 않던 문제  
**해결**: `/app/auth/signup/page.tsx` 파일 생성으로 해결됨

### 3. 타입 에러
**문제**: TypeScript 빌드 시 타입 에러 발생
**해결**: 
- `CompanyFormData` 타입에서 선택적 속성의 spread 연산자 사용 시 타입 캐스팅 적용
- `NODE_ENV` 읽기 전용 속성 할당 시 조건부 타입 캐스팅 적용

## 개발 가이드

### 새로운 보호된 라우트 추가
1. 페이지 컴포넌트를 `AuthGuard`로 감싸거나 `withAuthGuard` HOC 사용
2. 필요한 권한 수준 지정
3. 로딩 상태 및 에러 처리 구현

### 새로운 API 엔드포인트 추가
1. 라우터에 `protect` 미들웨어 적용
2. `AuthRequest` 타입 사용하여 `req.user` 접근
3. 적절한 에러 처리 및 검증 규칙 적용

### 역할 기반 접근 제어
```typescript
// 서버사이드
router.get('/admin-only', protect, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'ADMIN') {
    return next(new AppError('Access denied', 403));
  }
  // 관리자 전용 로직
});

// 클라이언트사이드
const hasAdminAccess = await authService.hasRole('ADMIN');
```

## 향후 개선사항

1. **리프레시 토큰**: 토큰 자동 갱신 기능
2. **2FA 인증**: 이중 인증 지원
3. **소셜 로그인**: OAuth 제공자 연동
4. **비밀번호 재설정**: 이메일 기반 비밀번호 재설정
5. **세션 관리**: 다중 디바이스 세션 관리
6. **감사 로그**: 인증 관련 활동 로깅

## 문의 및 지원

인증 시스템 관련 문의사항이 있으시면 시스템 관리자에게 연락하거나 이슈를 등록해 주세요.