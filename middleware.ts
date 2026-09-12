import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};