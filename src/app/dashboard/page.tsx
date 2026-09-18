import { AppShell } from '@/components/AppShell';
import { auth, signOut } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', fontFamily: 'sans-serif' }}>
        <p>
          Kamu belum login. Silakan ke halaman <a href="/login">/login</a> dulu.
        </p>
      </div>
    );
  }

  return (
    <AppShell title="Dashboard">
      <div style={{ maxWidth: 480, fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Dashboard</h1>

        <p>Selamat datang! Ini data session kamu saat ini:</p>

        <pre
          style={{
            background: '#f4f4f4',
            padding: 16,
            borderRadius: 8,
            marginTop: 12,
            fontSize: 13,
          }}
        >
          {JSON.stringify(session.user, null, 2)}
        </pre>

        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button type="submit" style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
            Logout
          </button>
        </form>
      </div>
    </AppShell>
  );
}