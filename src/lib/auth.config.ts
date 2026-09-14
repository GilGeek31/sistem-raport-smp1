import type { NextAuthConfig } from 'next-auth';

// File ini SENGAJA tidak import Prisma sama sekali.
// Isinya cuma aturan redirect & halaman login, yang dipakai
// baik oleh proxy.ts maupun auth.ts (yang lebih lengkap).
export const authConfig = {
  pages: {
    signIn: '/login',
  },

  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname === '/login') {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (pathname.startsWith('/admin') && auth.user?.role !== 'ADMIN') {
        return Response.redirect(new URL('/dashboard', request.nextUrl));
      }

      return true;
    },
  },

  // Providers-nya sengaja dikosongkan di sini.
  // Yang isi provider Credentials lengkap (dengan Prisma) ada di auth.ts.
  providers: [],
} satisfies NextAuthConfig;