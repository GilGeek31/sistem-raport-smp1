'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

const AGAMA_OPTIONS = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA'];
const JENIS_KELAMIN_OPTIONS = ['LAKI_LAKI', 'PEREMPUAN'];
const STATUS_KELUARGA_OPTIONS = ['ANAK_KANDUNG', 'ANAK_ANGKAT', 'ANAK_TIRI'];

type Kelas = { id: number; nama: string };

const initialForm = {
  nisn: '', nis: '', nama: '',
  tempatLahir: '', tanggalLahir: '', jenisKelamin: '', agama: '', nik: '',
  statusDalamKeluarga: '', anakKe: '',
  alamatSiswa: '', noTeleponRumah: '',
  kelasId: '', sekolahAsal: '', diterimaKelas: '', diterimaTanggal: '',
  namaAyah: '', namaIbu: '', alamatOrtu: '', noHpOrtu: '',
  pekerjaanAyah: '', pekerjaanIbu: '',
  namaWali: '', alamatWali: '', noHpWali: '', pekerjaanWali: '',
};

type FormData = typeof initialForm;

export default function EditSiswaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormData | null>(null);
  const [namaSiswa, setNamaSiswa] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

  useEffect(() => {
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
    muatKelas();
  }, []);

  useEffect(() => {
    async function muat() {
      const res = await fetch(`/api/v1/siswas/${id}`);
      const data = await res.json();
      if (!data.success) {
        setPesan({ tipe: 'error', teks: data.message });
        setMemuat(false);
        return;
      }

      const s = data.data;
      setNamaSiswa(s.nama);
      setEmail(s.user?.email ?? null);
      setForm({
        nisn: s.nisn ?? '',
        nis: s.nis ?? '',
        nama: s.nama ?? '',
        tempatLahir: s.tempatLahir ?? '',
        tanggalLahir: s.tanggalLahir ? String(s.tanggalLahir).slice(0, 10) : '',
        jenisKelamin: s.jenisKelamin ?? '',
        agama: s.agama ?? '',
        nik: s.nik ?? '',
        statusDalamKeluarga: s.statusDalamKeluarga ?? '',
        anakKe: s.anakKe != null ? String(s.anakKe) : '',
        alamatSiswa: s.alamatSiswa ?? '',
        noTeleponRumah: s.noTeleponRumah ?? '',
        kelasId: s.riwayatKelas?.[0]?.kelas?.id != null ? String(s.riwayatKelas[0].kelas.id) : '',
        sekolahAsal: s.sekolahAsal ?? '',
        diterimaKelas: s.diterimaKelas ?? '',
        diterimaTanggal: s.diterimaTanggal ? String(s.diterimaTanggal).slice(0, 10) : '',
        namaAyah: s.namaAyah ?? '',
        namaIbu: s.namaIbu ?? '',
        alamatOrtu: s.alamatOrtu ?? '',
        noHpOrtu: s.noHpOrtu ?? '',
        pekerjaanAyah: s.pekerjaanAyah ?? '',
        pekerjaanIbu: s.pekerjaanIbu ?? '',
        namaWali: s.namaWali ?? '',
        alamatWali: s.alamatWali ?? '',
        noHpWali: s.noHpWali ?? '',
        pekerjaanWali: s.pekerjaanWali ?? '',
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

    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      if (value !== '') {
        payload[key] = key === 'anakKe' || key === 'kelasId' ? Number(value) : value;
      }
    }

    const res = await fetch(`/api/v1/siswas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    setSubmitting(false);
    setPesan({ tipe: data.success ? 'sukses' : 'error', teks: data.message });
    if (data.success) setTimeout(() => router.push('/siswa'), 800);
  }

  async function handleHapus() {
    if (!confirm(`Hapus siswa "${namaSiswa}"? Akun login siswa ini juga akan terhapus.`)) return;
    setMenghapus(true);
    try {
      const res = await fetch(`/api/v1/siswas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/siswa');
      } else {
        setPesan({ tipe: 'error', teks: data.message });
      }
    } catch {
      setPesan({ tipe: 'error', teks: 'Terjadi kesalahan tak terduga di server saat menghapus siswa.' });
    } finally {
      setMenghapus(false);
    }
  }

  if (memuat) {
    return (
      <AppShell title="Edit siswa">
        <p style={{ fontSize: 13, color: '#777' }}>Memuat data siswa...</p>
      </AppShell>
    );
  }

  if (!form) {
    return (
      <AppShell title="Edit siswa">
        {pesan && <p style={{ fontSize: 13, color: '#b3261e' }}>{pesan.teks}</p>}
      </AppShell>
    );
  }

  return (
    <AppShell title={`Edit siswa — ${namaSiswa}`}>
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
            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>Email</label>
              <div style={{ fontSize: 13, padding: '7px 0', color: '#777' }}>
                {email ?? 'Belum ada (login pakai NISN)'}
              </div>
            </div>
            <Field label="NISN *" value={form.nisn} onChange={(v) => ubah('nisn', v)} required />
            <Field label="NIS" value={form.nis} onChange={(v) => ubah('nis', v)} />
          </Grid>
        </Section>

        <Section title="Data diri">
          <Grid>
            <Field label="Tempat lahir" value={form.tempatLahir} onChange={(v) => ubah('tempatLahir', v)} />
            <Field label="Tanggal lahir" type="date" value={form.tanggalLahir} onChange={(v) => ubah('tanggalLahir', v)} />
            <SelectField label="Jenis kelamin" value={form.jenisKelamin} onChange={(v) => ubah('jenisKelamin', v)} options={JENIS_KELAMIN_OPTIONS} />
            <SelectField label="Agama" value={form.agama} onChange={(v) => ubah('agama', v)} options={AGAMA_OPTIONS} />
            <Field label="NIK" value={form.nik} onChange={(v) => ubah('nik', v)} />
            <SelectField label="Status dalam keluarga" value={form.statusDalamKeluarga} onChange={(v) => ubah('statusDalamKeluarga', v)} options={STATUS_KELUARGA_OPTIONS} />
            <Field label="Anak ke" type="number" value={form.anakKe} onChange={(v) => ubah('anakKe', v)} />
          </Grid>
        </Section>

        <Section title="Alamat & kontak siswa">
          <Grid>
            <Field label="Alamat" value={form.alamatSiswa} onChange={(v) => ubah('alamatSiswa', v)} full />
            <Field label="No. telepon rumah" value={form.noTeleponRumah} onChange={(v) => ubah('noTeleponRumah', v)} />
          </Grid>
        </Section>

        <Section title="Penempatan kelas">
          <Grid>
            <SelectFieldObj
              label="Kelas (tahun ajaran aktif)"
              value={form.kelasId}
              onChange={(v) => ubah('kelasId', v)}
              options={kelasList}
            />
          </Grid>
          <p style={{ fontSize: 11.5, color: '#888', margin: '8px 0 0' }}>
            Mengubah ini akan memindahkan siswa ke kelas baru di tahun ajaran yang sedang aktif.
          </p>
        </Section>

        <Section title="Riwayat penerimaan">
          <Grid>
            <Field label="Sekolah asal" value={form.sekolahAsal} onChange={(v) => ubah('sekolahAsal', v)} />
            <Field label="Diterima di kelas" value={form.diterimaKelas} onChange={(v) => ubah('diterimaKelas', v)} />
            <Field label="Tanggal diterima" type="date" value={form.diterimaTanggal} onChange={(v) => ubah('diterimaTanggal', v)} />
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

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
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
            {menghapus ? 'Menghapus...' : 'Hapus siswa'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #dee2e6', borderRadius: 4, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      <p style={{ fontWeight: 500, margin: '0 0 12px', color: '#111', fontSize: 14 }}>{title}</p>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
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

function SelectFieldObj({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { id: number; nama: string }[];
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: '#ffffff', color: '#000000', border: '1px solid #dee2e6', padding: '7px 8px', fontSize: 13 }}
      >
        <option value="">— Belum ditempatkan —</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.nama}</option>
        ))}
      </select>
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: '#ffffff', color: '#000000', border: '1px solid #dee2e6', padding: '7px 8px', fontSize: 13 }}
      >
        <option value="">— Pilih —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt.replaceAll('_', ' ')}</option>
        ))}
      </select>
    </div>
  );
}