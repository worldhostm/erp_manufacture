import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {

  // if (session) {
  //   redirect('/dashboard');
  // }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            ERP Manufacturing System
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            100인 이하 제조업을 위한 통합 ERP 솔루션
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            로그인
          </Link>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              계정이 없으신가요?{' '}
              <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}