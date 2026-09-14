import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Proxy ini pakai instance NextAuth TERPISAH, khusus dari authConfig
// yang ringan (tanpa Prisma) — bukan dari lib/auth.ts yang lengkap.
const { auth} = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};