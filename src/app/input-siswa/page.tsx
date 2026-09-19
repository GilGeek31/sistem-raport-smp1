'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

const AGAMA_OPTIONS = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA'];
const JENIS_KELAMIN_OPTIONS = ['LAKI_LAKI', 'PEREMPUAN'];
const STATUS_KELUARGA_OPTIONS = ['ANAK_KANDUNG', 'ANAK_ANGKAT', 'ANAK_TIRI'];

const initialForm = {
  // Akun
  email: '', nisn: '', nis: '', nama: '', password: '',
  // Data diri
  tempatLahir: '', tanggalLahir: '', jenisKelamin: '', agama: '', nik: '',
  statusDalamKeluarga: '', anakKe: '',
  // Alamat & kontak
  alamatSiswa: '', noTeleponRumah: '',
  // Riwayat penerimaan
  sekolahAsal: '', diterimaKelas: '', diterimaTanggal: '',
  // Orang tua
  namaAyah: '', namaIbu: '', alamatOrtu: '', noHpOrtu: '',
  pekerjaanAyah: '', pekerjaanIbu: '',
  // Wali
  namaWali: '', alamatWali: '', noHpWali: '', pekerjaanWali: '',
};

type FormData = typeof initialForm;

export default function InputSiswaPage() {
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

    // Kosongkan field yang tidak diisi (string kosong) supaya tidak
    // dikirim sebagai "" ke server — biar dianggap "tidak diisi".
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      if (value !== '') {
        payload[key] = key === 'anakKe' ? Number(value) : value;
      }
    }

    const res = await fetch('/api/v1/siswas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    setSubmitting(false);
    setPesan({ tipe: data.success ? 'sukses' : 'error', teks: data.message });

    if (data.success) {
      setForm(initialForm);
      setTimeout(() => router.push('/siswa'), 1000);
    }
  }

  return (
    <AppShell title="Input siswa baru">
      <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
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

        <Section title="Akun">
          <Grid>
            <Field label="Nama lengkap *" value={form.nama} onChange={(v) => ubah('nama', v)} required />
            <Field label="Email (opsional)" type="email" value={form.email} onChange={(v) => ubah('email', v)} />
            <Field label="NISN *" value={form.nisn} onChange={(v) => ubah('nisn', v)} required />
            <Field label="NIS" value={form.nis} onChange={(v) => ubah('nis', v)} />
            <Field
              label="Password (kosongkan = pakai NISN)"
              type="password"
              value={form.password}
              onChange={(v) => ubah('password', v)}
            />
          </Grid>
        </Section>

        <Section title="Data diri">
          <Grid>
            <Field label="Tempat lahir" value={form.tempatLahir} onChange={(v) => ubah('tempatLahir', v)} />
            <Field label="Tanggal lahir" type="date" value={form.tanggalLahir} onChange={(v) => ubah('tanggalLahir', v)} />
            <SelectField
              label="Jenis kelamin"
              value={form.jenisKelamin}
              onChange={(v) => ubah('jenisKelamin', v)}
              options={JENIS_KELAMIN_OPTIONS}
            />
            <SelectField
              label="Agama"
              value={form.agama}
              onChange={(v) => ubah('agama', v)}
              options={AGAMA_OPTIONS}
            />
            <Field label="NIK" value={form.nik} onChange={(v) => ubah('nik', v)} />
            <SelectField
              label="Status dalam keluarga"
              value={form.statusDalamKeluarga}
              onChange={(v) => ubah('statusDalamKeluarga', v)}
              options={STATUS_KELUARGA_OPTIONS}
            />
            <Field label="Anak ke" type="number" value={form.anakKe} onChange={(v) => ubah('anakKe', v)} />
          </Grid>
        </Section>

        <Section title="Alamat & kontak siswa">
          <Grid>
            <Field label="Alamat" value={form.alamatSiswa} onChange={(v) => ubah('alamatSiswa', v)} full />
            <Field label="No. telepon rumah" value={form.noTeleponRumah} onChange={(v) => ubah('noTeleponRumah', v)} />
          </Grid>
        </Section>

        <Section title="Riwayat penerimaan">
          <Grid>
            <Field label="Sekolah asal" value={form.sekolahAsal} onChange={(v) => ubah('sekolahAsal', v)} />
            <Field label="Diterima di kelas" value={form.diterimaKelas} onChange={(v) => ubah('diterimaKelas', v)} />
            <Field
              label="Tanggal diterima"
              type="date"
              value={form.diterimaTanggal}
              onChange={(v) => ubah('diterimaTanggal', v)}
            />
          </Grid>
        </Section>

        <Section title="Data orang tua">
          <Grid>
            <Field label="Nama ayah" value={form.namaAyah} onChange={(v) => ubah('namaAyah', v)} />
            <Field label="Nama ibu" value={form.namaIbu} onChange={(v) => ubah('namaIbu', v)} />
            <Field label="Alamat orang tua" value={form.alamatOrtu} onChange={(v) => ubah('alamatOrtu', v)} full />
            <Field label="No. HP orang tua" value={form.noHpOrtu} onChange={(v) => ubah('noHpOrtu', v)} />
            <Field label="Pekerjaan ayah" value={form.pekerjaanAyah} onChange={(v) => ubah('pekerjaanAyah', v)} />
            <Field label="Pekerjaan ibu" value={form.pekerjaanIbu} onChange={(v) => ubah('pekerjaanIbu', v)} />
          </Grid>
        </Section>

        <Section title="Data wali (kalau ada)">
          <Grid>
            <Field label="Nama wali" value={form.namaWali} onChange={(v) => ubah('namaWali', v)} />
            <Field label="Alamat wali" value={form.alamatWali} onChange={(v) => ubah('alamatWali', v)} full />
            <Field label="No. HP wali" value={form.noHpWali} onChange={(v) => ubah('noHpWali', v)} />
            <Field label="Pekerjaan wali" value={form.pekerjaanWali} onChange={(v) => ubah('pekerjaanWali', v)} />
          </Grid>
        </Section>

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
            marginTop: 8,
          }}
        >
          {submitting ? 'Menyimpan...' : 'Simpan siswa'}
        </button>
      </form>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: 4,
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
      }}
    >
      <p style={{ fontWeight: 500, margin: '0 0 12px', color: '#111', fontSize: 14 }}>{title}</p>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: '#ffffff',
          color: '#000000',
          border: '1px solid #dee2e6',
          padding: '7px 8px',
          fontSize: 13,
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: '#ffffff',
          color: '#000000',
          border: '1px solid #dee2e6',
          padding: '7px 8px',
          fontSize: 13,
        }}
      >
        <option value="">— Pilih —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </div>
  );
}