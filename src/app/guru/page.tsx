'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

type Guru = {
  id: number;
  nip: string | null;
  nuptk: string | null;
  nama: string;
  user: { email: string | null; role?: string };
};

const ROLE_LABEL: Record<string, string> = {
  GURU_MAPEL: 'Guru mapel',
  WALI_KELAS: 'Wali kelas',
  KOORDINATOR_KOKURIKULER: 'Koordinator kokurikuler',
  ADMIN: 'Admin',
  KEPALA_SEKOLAH: 'Kepala sekolah',
};

export default function DaftarGuruPage() {
  const [gurus, setGurus] = useState<Guru[] | null>(null);
  const [cari, setCari] = useState('');
  const [error, setError] = useState('');
  const [menghapusId, setMenghapusId] = useState<number | null>(null);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

  async function muatGuru() {
    setError('');
    const res = await fetch('/api/v1/gurus');
    const data = await res.json();
    if (data.success) {
      setGurus(data.data);
    } else {
      setError(data.message ?? 'Gagal memuat daftar guru');
    }
  }

  useEffect(() => {
    muatGuru();
  }, []);

  async function hapusGuru(id: number, nama: string) {
    if (!confirm(`Hapus guru "${nama}"? Akun login guru ini juga akan terhapus.`)) return;

    setMenghapusId(id);
    setPesan(null);
    try {
      const res = await fetch(`/api/v1/gurus/${id}`, { method: 'DELETE' });
      const data = await res.json();
      setPesan({ tipe: data.success ? 'sukses' : 'error', teks: data.message });
      if (data.success) {
        setGurus((prev) => prev?.filter((g) => g.id !== id) ?? null);
      }
    } catch {
      setPesan({ tipe: 'error', teks: 'Terjadi kesalahan tak terduga di server saat menghapus guru.' });
    } finally {
      setMenghapusId(null);
    }
  }

  const guruTersaring = useMemo(() => {
    if (!gurus) return [];
    const kataKunci = cari.trim().toLowerCase();
    if (!kataKunci) return gurus;
    return gurus.filter(
      (g) =>
        g.nama.toLowerCase().includes(kataKunci) ||
        (g.nip ?? '').includes(kataKunci) ||
        (g.user.email ?? '').toLowerCase().includes(kataKunci)
    );
  }, [gurus, cari]);

  return (
    <AppShell title="Data guru">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
          {gurus ? `${guruTersaring.length} dari ${gurus.length} guru` : 'Memuat...'}
        </p>
        <Link
          href="/input-guru"
          style={{
            background: '#023874',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            padding: '8px 16px',
          }}
        >
          + Tambah guru
        </Link>
      </div>

      {pesan && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '1rem',
            borderRadius: 4,
            fontSize: 13,
            background: pesan.tipe === 'sukses' ? '#e6f4ea' : '#fdecea',
            color: pesan.tipe === 'sukses' ? '#1e7e34' : '#b3261e',
            border: `1px solid ${pesan.tipe === 'sukses' ? '#b7e1c1' : '#f5c2c0'}`,
          }}
        >
          {pesan.teks}
        </div>
      )}

      <div style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: 4, padding: '1rem' }}>
        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            placeholder="Cari nama, NIP, atau email..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 320,
              border: '1px solid #dee2e6',
              padding: '7px 10px',
              fontSize: 13,
              color: '#000',
            }}
          />
        </div>

        {error && <p style={{ color: '#b3261e', fontSize: 13 }}>{error}</p>}

        {gurus && guruTersaring.length === 0 && !error && (
          <p style={{ color: '#777', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            {gurus.length === 0
              ? 'Belum ada data guru. Klik "Tambah guru" untuk mulai menambahkan.'
              : 'Tidak ada guru yang cocok dengan pencarian.'}
          </p>
        )}

        {gurus && guruTersaring.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  <Th>Nama</Th>
                  <Th>NIP</Th>
                  <Th>NUPTK</Th>
                  <Th>Peran</Th>
                  <Th>Email</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {guruTersaring.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                    <Td>{g.nama}</Td>
                    <Td>{g.nip ?? '—'}</Td>
                    <Td>{g.nuptk ?? '—'}</Td>
                    <Td>{g.user.role ? ROLE_LABEL[g.user.role] ?? g.user.role : '—'}</Td>
                    <Td>{g.user.email ?? '—'}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/guru/${g.id}`} style={{ color: '#023874', fontSize: 12.5 }}>
                          Edit
                        </Link>
                        <button
                          onClick={() => hapusGuru(g.id, g.nama)}
                          disabled={menghapusId === g.id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#b3261e',
                            fontSize: 12.5,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {menghapusId === g.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 10px', fontWeight: 500, color: '#555' }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 10px', color: '#222' }}>{children}</td>;
}