import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Kita pakai JWT (bukan session di database) supaya nanti gampang
  // dipakai juga oleh aplikasi mobile.
  session: { strategy: 'jwt' },

  providers: [
    Credentials({
      // Field yang akan diterima dari form login.
      // "identifier" bisa diisi email, NIP, atau NISN.
      credentials: {
        identifier: { label: 'Email / NIP / NISN', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      // Fungsi ini dipanggil setiap ada percobaan login.
      // Tugasnya: cari user yang cocok, lalu cek passwordnya.
      async authorize(credentials) {
        const identifier = credentials?.identifier as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!identifier || !password) return null;

        // 1. Coba cari langsung berdasarkan email (berlaku untuk semua role)
        let user = await prisma.user.findUnique({
          where: { email: identifier },
        });

        // 2. Kalau tidak ketemu, coba cari lewat NIP guru
        if (!user) {
          const guru = await prisma.guru.findUnique({
            where: { nip: identifier },
            include: { user: true },
          });
          if (guru) user = guru.user;
        }

        // 3. Kalau masih tidak ketemu, coba cari lewat NISN siswa
        if (!user) {
          const siswa = await prisma.siswa.findUnique({
            where: { nisn: identifier },
            include: { user: true },
          });
          if (siswa) user = siswa.user;
        }

        // 4. Kalau user tidak ditemukan sama sekali, login gagal
        if (!user) return null;

        // 5. Cocokkan password yang diketik dengan password ter-hash di database
        const passwordCocok = await bcrypt.compare(password, user.password);
        if (!passwordCocok) return null;

        // 6. Login berhasil — data ini akan masuk ke token/session
        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // Dipanggil setiap kali token JWT dibuat/diperbarui.
    // Kita "titipkan" role & id ke dalam token.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },

    // Dipanggil setiap kali session dibaca (misal lewat auth()).
    // Kita ambil balik role & id dari token, taruh ke session.
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login', // nanti kita bikin halaman ini
  },
});