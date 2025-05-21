import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get('token')?.value;

  // Protected routes pattern
  const isProtectedRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/farmers') || pathname.startsWith('/staff');

  // Auth routes pattern
  const isAuthRoute = pathname === '/login';

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if accessing auth route with token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
/**
     *  This middleware checks if the user is accessing a protected route without a token and redirects them to the login page. It also checks if the user is accessing an auth route with a token and redirects them to the dashboard. 
    To apply the middleware to all routes, update the  next.config.js  file:
     * 
     *  */
