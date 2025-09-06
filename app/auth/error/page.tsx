'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  const message = searchParams?.get('message');

  const getErrorMessage = (errorType: string | null): string => {
    switch (errorType) {
      case 'CredentialsSignin':
        return '이메일 또는 비밀번호가 올바르지 않습니다.';
      case 'SessionRequired':
        return '로그인이 필요합니다.';
      case 'AccessDenied':
        return '접근이 거부되었습니다. 권한을 확인해주세요.';
      case 'Verification':
        return '이메일 인증이 필요합니다.';
      case 'Default':
        return '인증 중 오류가 발생했습니다.';
      case 'Configuration':
        return '시스템 설정 오류가 발생했습니다.';
      case 'OAuthSignin':
        return 'OAuth 로그인 중 오류가 발생했습니다.';
      case 'OAuthCallback':
        return 'OAuth 콜백 처리 중 오류가 발생했습니다.';
      case 'OAuthCreateAccount':
        return 'OAuth 계정 생성 중 오류가 발생했습니다.';
      case 'EmailCreateAccount':
        return '이메일 계정 생성 중 오류가 발생했습니다.';
      case 'Callback':
        return '콜백 처리 중 오류가 발생했습니다.';
      case 'OAuthAccountNotLinked':
        return '이미 다른 방법으로 가입된 이메일입니다.';
      case 'EmailSignin':
        return '이메일 로그인 중 오류가 발생했습니다.';
      case 'CredentialsCallback':
        return '로그인 정보 처리 중 오류가 발생했습니다.';
      case 'AuthorizedCallbackError':
        return '인증 콜백 오류가 발생했습니다.';
      case 'SigninError':
        return '로그인 처리 중 오류가 발생했습니다.';
      case 'SignoutError':
        return '로그아웃 처리 중 오류가 발생했습니다.';
      default:
        return message || '알 수 없는 오류가 발생했습니다.';
    }
  };

  const getErrorTitle = (errorType: string | null): string => {
    switch (errorType) {
      case 'CredentialsSignin':
        return '로그인 실패';
      case 'SessionRequired':
        return '로그인 필요';
      case 'AccessDenied':
        return '접근 거부';
      case 'Verification':
        return '인증 필요';
      default:
        return '인증 오류';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {getErrorTitle(error)}
          </h2>
          <p className="mt-2 text-center text-sm text-red-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 정보</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {error && <li>오류 유형: {error}</li>}
                    {message && <li>세부 메시지: {message}</li>}
                    <li>시간: {new Date().toLocaleString('ko-KR')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              다시 로그인
            </Link>
            
            <Link
              href="/"
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              홈으로 돌아가기
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 mt-4">
              문제가 계속되면 시스템 관리자에게 문의하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}