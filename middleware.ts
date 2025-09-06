import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookies or localStorage (we'll handle this client-side)
  // For now, we'll let the pages handle authentication checks
  // since we're using JWT tokens with Express.js backend
  
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }
  
  // For protected routes, we'll handle authentication on the client side
  // using our authService utility
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/master/:path*',
    '/purchase/:path*',
    '/production/:path*',
    '/inventory/:path*',
    '/quality/:path*',
    '/sales/:path*',
    '/accounting/:path*',
    '/hr/:path*',
    '/reports/:path*',
    '/system/:path*'
  ]
};