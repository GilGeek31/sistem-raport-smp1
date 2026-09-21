'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  GURU_MAPEL: 'Guru mapel',
  WALI_KELAS: 'Wali kelas',
  KEPALA_SEKOLAH: 'Kepala sekolah',
  KOORDINATOR_KOKURIKULER: 'Koordinator kokurikuler',
  SISWA: 'Siswa',
};

type MenuItem = {
  label: string;
  icon: string;
  href?: string; // item biasa (langsung link)
  children?: { href: string; label: string }[]; // item dropdown (submenu)
};

const MENU_UMUM: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/profil', label: 'Profil', icon: '☺' },
];

const MENU_PER_ROLE: Record<string, MenuItem[]> = {
  ADMIN: [
    {
      label: 'Input siswa',
      icon: '➕',
      children: [
        { href: '/input-siswa', label: 'Input satu-satu' },
        { href: '/input-siswa/import', label: 'Import' },
      ],
    },
    { href: '/siswa', label: 'Data siswa', icon: '☰' },
    {
      label: 'Input guru',
      icon: '➕',
      children: [
        { href: '/input-guru', label: 'Input satu-satu' },
        { href: '/input-guru/import', label: 'Import' },
      ],
    },
    { href: '/guru', label: 'Data guru', icon: '☰' },
    { href: '/master-data', label: 'Master data', icon: '⚙' },
    { href: '/guru-mapel', label: 'Penugasan mengajar', icon: '⇄' },
    { href: '/pengaturan-raport', label: 'Pengaturan raport', icon: '🖶' },
    { href: '/monitoring', label: 'Monitoring', icon: '▤' },
  ],
  GURU_MAPEL: [
    { href: '/tujuan-pembelajaran', label: 'Tujuan pembelajaran', icon: '◎' },
    { href: '/input-nilai', label: 'Input nilai', icon: '✎' },
  ],
  WALI_KELAS: [
    { href: '/kehadiran', label: 'Kehadiran', icon: '📋' },
    { href: '/nilai-ekskul', label: 'Nilai ekskul', icon: '🏅' },
    { href: '/cetak-raport', label: 'Cetak raport', icon: '🖶' },
    { href: '/monitoring', label: 'Monitoring kelas', icon: '▤' },
  ],
  KEPALA_SEKOLAH: [
    { href: '/monitoring', label: 'Monitoring sekolah', icon: '▤' },
    { href: '/cetak-raport', label: 'Cetak raport', icon: '🖶' },
  ],
  KOORDINATOR_KOKURIKULER: [
    { href: '/nilai-kokurikuler', label: 'Input kokurikuler', icon: '📝' },
  ],
  SISWA: [
    { href: '/nilai-saya', label: 'Nilai saya', icon: '📊' },
    { href: '/raport-saya', label: 'Raport saya', icon: '🖶' },
  ],
};

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const nama = session?.user?.email ?? '...';
  const roleMentah = session?.user?.role ?? '';
  const role = roleMentah ? ROLE_LABEL[roleMentah] ?? roleMentah : '';
  const inisial = nama.slice(0, 2).toUpperCase();

  const menu = [...MENU_UMUM, ...(MENU_PER_ROLE[roleMentah] ?? [])];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        style={{
          background: '#1d4ed8',
          color: '#ffffff',
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label="Sembunyikan atau tampilkan sidebar"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              width: 28,
              height: 28,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
          <span>{title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {inisial}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{nama}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{role}</div>
          </div>
          <button
            onClick={() => signOut({ redirectTo: '/login' })}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            Keluar
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <nav
          style={{
            width: sidebarCollapsed ? 0 : 200,
            background: '#1d4ed8',
            color: '#ffffff',
            padding: sidebarCollapsed ? 0 : '1rem 0',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 0.2s ease, padding 0.2s ease',
          }}
        >
          {menu.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </nav>

        <main style={{ flex: 1, padding: '1.25rem', minWidth: 0, background: '#e5e5e5' }}>
          {children}
        </main>
      </div>

      <footer
        style={{
          background: '#1d4ed8',
          color: '#ffffff',
          padding: '8px 16px',
          fontSize: 11,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        Sistem Pengelolaan Nilai Raport SMP &middot; 2026
      </footer>
    </div>
  );
}

// Satu baris menu di sidebar. Kalau item punya `children`, dia jadi
// dropdown yang bisa dibuka/tutup (state lokal per item, `terbuka`).
// Kalau tidak, dia jadi link biasa.
function NavItem({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const adaAnakAktif = item.children?.some((c) => pathname === c.href) ?? false;
  const [terbuka, setTerbuka] = useState(adaAnakAktif);

  const linkStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    color: '#ffffff',
    textDecoration: 'none',
    opacity: 0.9,
  };

  if (!item.children) {
    return (
      <Link href={item.href!} style={linkStyle}>
        <span style={{ width: 16, flexShrink: 0 }}>{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setTerbuka((t) => !t)}
        style={{
          ...linkStyle,
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, flexShrink: 0 }}>{item.icon}</span>
          {item.label}
        </span>
        <span style={{ fontSize: 10, transform: terbuka ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
          ▸
        </span>
      </button>

      {terbuka && (
        <div>
          {item.children.map((child) => {
            const aktif = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                style={{
                  ...linkStyle,
                  paddingLeft: 44,
                  background: aktif ? 'rgba(255,255,255,0.15)' : 'transparent',
                  fontSize: 12.5,
                }}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}