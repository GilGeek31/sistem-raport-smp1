'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

const ROLE_OPTIONS = ['GURU_MAPEL', 'WALI_KELAS', 'KOORDINATOR_KOKURIKULER'];
const ROLE_LABEL: Record<string, string> = {
  GURU_MAPEL: 'Guru mapel',
  WALI_KELAS: 'Wali kelas',
  KOORDINATOR_KOKURIKULER: 'Koordinator kokurikuler',
};

const initialForm = { nama: '', nip: '', nuptk: '', role: 'GURU_MAPEL' };
type FormData = typeof initialForm;

export default function EditGuruPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormData | null>(null);
  const [namaGuru, setNamaGuru] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

  useEffect(() => {
    async function muat() {
      const res = await fetch(`/api/v1/gurus/${id}`);
      const data = await res.json();
      if (!data.success) {
        setPesan({ tipe: 'error', teks: data.message });
        setMemuat(false);
        return;
      }

      const g = data.data;
      setNamaGuru(g.nama);
      setEmail(g.user?.email ?? null);
      setForm({
        nama: g.nama ?? '',
        nip: g.nip ?? '',
        nuptk: g.nuptk ?? '',
        role: g.user?.role && ROLE_OPTIONS.includes(g.user.role) ? g.user.role : 'GURU_MAPEL',
      });
      setMemuat(false);
    }
    muat();
  }, [id]);

  function ubah(field: keyof FormData, value: string) {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setPesan(null);

    const payload: Record<string, unknown> = { nama: form.nama, role: form.role };
    if (form.nip !== '') payload.nip = form.nip;
    if (form.nuptk !== '') payload.nuptk = form.nuptk;

    const res = await fetch(`/api/v1/gurus/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    setSubmitting(false);
    setPesan({ tipe: data.success ? 'sukses' : 'error', teks: data.message });
    if (data.success) setTimeout(() => router.push('/guru'), 800);
  }

  async function handleHapus() {
    if (!confirm(`Hapus guru "${namaGuru}"? Akun login guru ini juga akan terhapus.`)) return;
    setMenghapus(true);
    try {
      const res = await fetch(`/api/v1/gurus/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/guru');
      } else {
        setPesan({ tipe: 'error', teks: data.message });
      }
    } catch {
      setPesan({ tipe: 'error', teks: 'Terjadi kesalahan tak terduga di server saat menghapus guru.' });
    } finally {
      setMenghapus(false);
    }
  }

  if (memuat) {
    return (
      <AppShell title="Edit guru">
        <p style={{ fontSize: 13, color: '#777' }}>Memuat data guru...</p>
      </AppShell>
    );
  }

  if (!form) {
    return (
      <AppShell title="Edit guru">
        {pesan && <p style={{ fontSize: 13, color: '#b3261e' }}>{pesan.teks}</p>}
      </AppShell>
    );
  }

  return (
    <AppShell title={`Edit guru — ${namaGuru}`}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
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

        <div style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: 4, padding: '1rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nama lengkap *" value={form.nama} onChange={(v) => ubah('nama', v)} required full />
            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>Email</label>
              <div style={{ fontSize: 13, padding: '7px 0', color: '#777' }}>{email ?? '—'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>Peran</label>
              <select
                value={form.role}
                onChange={(e) => ubah('role', e.target.value)}
                style={{ width: '100%', background: '#ffffff', color: '#000000', border: '1px solid #dee2e6', padding: '7px 8px', fontSize: 13 }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <Field label="NIP" value={form.nip} onChange={(v) => ubah('nip', v)} />
            <Field label="NUPTK" value={form.nuptk} onChange={(v) => ubah('nuptk', v)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: '#023874',
              color: '#ffffff',
              border: 'none',
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {submitting ? 'Menyimpan...' : 'Simpan perubahan'}
          </button>
          <button
            type="button"
            onClick={handleHapus}
            disabled={menghapus}
            style={{
              background: 'transparent',
              color: '#b3261e',
              border: '1px solid #b3261e',
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {menghapus ? 'Menghapus...' : 'Hapus guru'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function Field({
  label, value, onChange, type = 'text', required = false, full = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: '#ffffff', color: '#000000', border: '1px solid #dee2e6', padding: '7px 8px', fontSize: 13 }}
      />
    </div>
  );
}