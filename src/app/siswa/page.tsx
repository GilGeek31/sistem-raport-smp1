'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

type Kelas = {
  id: number;
  nama: string;
  tingkat: number;
  rombel: string;
};

type Siswa = {
  id: number;
  nisn: string;
  nis: string | null;
  nama: string;
  jenisKelamin: 'LAKI_LAKI' | 'PEREMPUAN' | null;
  user: { email: string | null };
  riwayatKelas: { kelas: Kelas }[];
};

const JENIS_KELAMIN_LABEL: Record<string, string> = {
  LAKI_LAKI: 'Laki-laki',
  PEREMPUAN: 'Perempuan',
};

export default function DaftarSiswaPage() {
  const [siswas, setSiswas] = useState<Siswa[] | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [kelasFilter, setKelasFilter] = useState('');
  const [cari, setCari] = useState('');
  const [error, setError] = useState('');
  const [menghapusId, setMenghapusId] = useState<number | null>(null);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

  async function muatKelas() {
    const resTahun = await fetch('/api/v1/tahun-ajarans');
    const dataTahun = await resTahun.json();
    if (!dataTahun.success) return;

    const aktif = (dataTahun.data as { id: number; isActive: boolean }[]).find((t) => t.isActive);
    if (!aktif) return;

    const resKelas = await fetch(`/api/v1/kelas?tahun_ajaran_id=${aktif.id}`);
    const dataKelas = await resKelas.json();
    if (dataKelas.success) setKelasList(dataKelas.data);
  }

  async function muatSiswa(kelasId: string) {
    setError('');
    const url = kelasId ? `/api/v1/siswas?kelas_id=${kelasId}` : '/api/v1/siswas';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setSiswas(data.data);
    } else {
      setError(data.message ?? 'Gagal memuat daftar siswa');
    }
  }

  useEffect(() => {
    muatKelas();
  }, []);

  useEffect(() => {
    muatSiswa(kelasFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasFilter]);

  async function hapusSiswa(id: number, nama: string) {
    if (!confirm(`Hapus siswa "${nama}"? Akun login siswa ini juga akan terhapus.`)) return;

    setMenghapusId(id);
    setPesan(null);
    try {
      const res = await fetch(`/api/v1/siswas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      setPesan({ tipe: data.success ? 'sukses' : 'error', teks: data.message });
      if (data.success) {
        setSiswas((prev) => prev?.filter((s) => s.id !== id) ?? null);
      }
    } catch {
      setPesan({ tipe: 'error', teks: 'Terjadi kesalahan tak terduga di server saat menghapus siswa.' });
    } finally {
      setMenghapusId(null);
    }
  }

  const siswaTersaring = useMemo(() => {
    if (!siswas) return [];
    const kataKunci = cari.trim().toLowerCase();
    if (!kataKunci) return siswas;
    return siswas.filter(
      (s) => s.nama.toLowerCase().includes(kataKunci) || s.nisn.includes(kataKunci)
    );
  }, [siswas, cari]);

  return (
    <AppShell title="Data siswa">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
          {siswas ? `${siswaTersaring.length} dari ${siswas.length} siswa` : 'Memuat...'}
        </p>
        <Link
          href="/input-siswa"
          style={{
            background: '#023874',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            padding: '8px 16px',
          }}
        >
          + Tambah siswa
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

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: 4,
          padding: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari nama atau NISN..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            style={{
              flex: '1 1 240px',
              border: '1px solid #dee2e6',
              padding: '7px 10px',
              fontSize: 13,
              color: '#000',
            }}
          />
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            style={{ border: '1px solid #dee2e6', padding: '7px 10px', fontSize: 13, color: '#000' }}
          >
            <option value="">Semua kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: '#b3261e', fontSize: 13 }}>{error}</p>}

        {siswas && siswaTersaring.length === 0 && !error && (
          <p style={{ color: '#777', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            {siswas.length === 0
              ? 'Belum ada data siswa. Klik "Tambah siswa" untuk mulai menambahkan.'
              : 'Tidak ada siswa yang cocok dengan pencarian.'}
          </p>
        )}

        {siswas && siswaTersaring.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  <Th>Nama</Th>
                  <Th>NISN</Th>
                  <Th>NIS</Th>
                  <Th>Jenis kelamin</Th>
                  <Th>Kelas</Th>
                  <Th>Email</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {siswaTersaring.map((s) => {
                  const kelas = s.riwayatKelas[0]?.kelas;
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                      <Td>{s.nama}</Td>
                      <Td>{s.nisn}</Td>
                      <Td>{s.nis ?? '—'}</Td>
                      <Td>{s.jenisKelamin ? JENIS_KELAMIN_LABEL[s.jenisKelamin] : '—'}</Td>
                      <Td>
                        {kelas ? (
                          kelas.nama
                        ) : (
                          <span style={{ color: '#999' }}>Belum ada kelas</span>
                        )}
                      </Td>
                      <Td>{s.user.email ?? <span style={{ color: '#999' }}>— (login pakai NISN)</span>}</Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link href={`/siswa/${s.id}`} style={{ color: '#023874', fontSize: 12.5 }}>
                            Edit
                          </Link>
                          <button
                            onClick={() => hapusSiswa(s.id, s.nama)}
                            disabled={menghapusId === s.id}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#b3261e',
                              fontSize: 12.5,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {menghapusId === s.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
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