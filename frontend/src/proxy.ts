import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types';

const roleRoutes: Record<UserRole, string> = {
  directeur: '/directeur',
  gestionnaire: '/gestionnaire',
  formateur: '/formateur',
};

const protectedPrefixes = ['/directeur', '/gestionnaire', '/formateur'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isLogin = pathname.startsWith('/login');
  const isAuthenticated = request.cookies.get('ofppt_auth')?.value === '1';
  const role = request.cookies.get('ofppt_role')?.value as UserRole | undefined;
  const roleHome = role && roleRoutes[role] ? roleRoutes[role] : '/login';

  if (isLogin && isAuthenticated && role && roleRoutes[role]) {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/directeur') && role !== 'directeur') {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  if (pathname.startsWith('/gestionnaire') && role !== 'gestionnaire' && role !== 'directeur') {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  if (pathname.startsWith('/formateur') && role !== 'formateur') {
    return NextResponse.redirect(new URL(roleHome, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/directeur/:path*', '/gestionnaire/:path*', '/formateur/:path*'],
};
