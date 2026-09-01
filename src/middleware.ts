import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/jwt'

export async function middleware(request: NextRequest) {
  // Enforce HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https' &&
    !request.nextUrl.hostname.includes('localhost')
  ) {
    const httpsUrl = request.url.replace(/^http:/, 'https:')
    return NextResponse.redirect(new URL(httpsUrl))
  }

  const token = request.cookies.get('session_token')?.value
  
  // Public routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname.startsWith('/style-guide') ||
    request.nextUrl.pathname === '/how-it-works' ||
    request.nextUrl.pathname === '/for-coaches' ||
    request.nextUrl.pathname === '/pricing' ||
    request.nextUrl.pathname === '/privacy' ||
    request.nextUrl.pathname === '/terms' ||
    request.nextUrl.pathname === '/contact'
  ) {
    return NextResponse.next()
  }

  // If trying to access protected route without token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verifyToken(token)

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check coach routes
  if (request.nextUrl.pathname.startsWith('/coach') && session.role !== 'COACH') {
    return NextResponse.redirect(new URL('/client', request.url))
  }

  // Check client routes
  if (request.nextUrl.pathname.startsWith('/client') && session.role !== 'CLIENT') {
    return NextResponse.redirect(new URL('/coach', request.url))
  }

  // Passed all checks
  const response = NextResponse.next()
  response.headers.set('x-user-id', session.userId)
  response.headers.set('x-user-role', session.role)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
