'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

const ROLE_OPTIONS = ['GURU_MAPEL', 'WALI_KELAS', 'KOORDINATOR_KOKURIKULER'];
const ROLE_LABEL: Record<string, string> = {
  GURU_MAPEL: 'Guru mapel',
  WALI_KELAS: 'Wali kelas',
  KOORDINATOR_KOKURIKULER: 'Koordinator kokurikuler',
};

const initialForm = {
  nama: '', email: '', nip: '', nuptk: '', password: '', role: 'GURU_MAPEL',
};

type FormData = typeof initialForm;

export default function InputGuruPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

  function ubah(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setPesan(null);

    const payload: Record<string, unknown> = { email: form.email, nama: form.nama, role: form.role };
    if (form.nip !== '') payload.nip = form.nip;
    if (form.nuptk !== '') payload.nuptk = form.nuptk;
    if (form.password !== '') payload.password = form.password;

    const res = await fetch('/api/v1/gurus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    setSubmitting(false);
    setPesan({ tipe: data.success ? 'sukses' : 'error', teks: data.message });

    if (data.success) {
      setForm(initialForm);
      setTimeout(() => router.push('/guru'), 800);
    }
  }

  return (
    <AppShell title="Input guru">
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

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: 4,
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nama lengkap *" value={form.nama} onChange={(v) => ubah('nama', v)} required full />
            <Field label="Email *" type="email" value={form.email} onChange={(v) => ubah('email', v)} required full />
            <Field label="NIP" value={form.nip} onChange={(v) => ubah('nip', v)} />
            <Field label="NUPTK" value={form.nuptk} onChange={(v) => ubah('nuptk', v)} />
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
            <Field
              label="Password (kosongkan = pakai NIP)"
              type="password"
              value={form.password}
              onChange={(v) => ubah('password', v)}
            />
          </div>
          <p style={{ fontSize: 11.5, color: '#888', margin: '10px 0 0' }}>
            Kalau password dikosongkan dan NIP diisi, NIP otomatis dipakai sebagai password default.
            Peran &quot;Wali kelas&quot; dan &quot;Koordinator kokurikuler&quot; bisa diatur ulang belakangan
            lewat menu Penugasan mengajar / Data kelas.
          </p>
        </div>

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
            marginTop: 14,
          }}
        >
          {submitting ? 'Menyimpan...' : 'Simpan guru'}
        </button>
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