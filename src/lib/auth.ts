import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },

  providers: [
    Credentials({
      credentials: {
        identifier: { label: 'Email / NIP / NISN', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const identifier = credentials?.identifier as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!identifier || !password) return null;

        let user = await prisma.user.findUnique({
          where: { email: identifier },
        });

        if (!user) {
          const guru = await prisma.guru.findUnique({
            where: { nip: identifier },
            include: { user: true },
          });
          if (guru) user = guru.user;
        }

        if (!user) {
          const siswa = await prisma.siswa.findUnique({
            where: { nisn: identifier },
            include: { user: true },
          });
          if (siswa) user = siswa.user;
        }

        if (!user) return null;

        const passwordCocok = await bcrypt.compare(password, user.password);
        if (!passwordCocok) return null;

        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});