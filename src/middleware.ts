import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOPXX_PATH, TOPXX_PASSWORD } from '@/lib/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Dynamic check based on the constant
  if (pathname.startsWith(`/${TOPXX_PATH}`)) {
    // Skip if it's just the root of TopXX (optional, but usually we protect everything)
    // Or if there's a specific logic for the entry page
    
    const auth = request.cookies.get('topxx_auth');
    
    // Server-side secret verification
    // process.env.TOPXX_PASSWORD is the source of truth
    const secret = process.env.TOPXX_PASSWORD || TOPXX_PASSWORD;
    
    if (auth?.value !== secret) {
      console.log(`[Middleware] Unauthorized access to ${pathname}, redirecting...`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

// Next.js middleware matcher must be static strings
// We use the current folder name here to ensure Next.js optimizes the execution
export const config = {
  matcher: ['/v2k9r5w8m3x7n1p4q0z6/:path*'],
};
