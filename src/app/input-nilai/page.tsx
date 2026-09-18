'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';

type GuruMapel = {
  id: number;
  mapel: { nama: string };
  kelas: { nama: string; tahunAjaran: { tahun: string; semester: number } };
};

type TpRow = { tpId: number; deskripsi: string; status: 'TERCAPAI' | 'TIDAK_TERCAPAI' | null };

type SiswaRow = {
  siswaId: number;
  namaSiswa: string;
  nisn: string;
  nilaiSemesterLalu: number | null;
  nilaiAkhir: number | null;
  isFinal: boolean;
  tpStatus: TpRow[];
};

export default function InputNilaiPage() {
  const [guruMapels, setGuruMapels] = useState<GuruMapel[]>([]);
  const [guruMapelId, setGuruMapelId] = useState<number | null>(null);
  const [siswaRows, setSiswaRows] = useState<SiswaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'sukses' | 'error'; teks: string } | null>(null);

  // Ambil daftar mapel & kelas yang diampu guru ini
  useEffect(() => {
    fetch('/api/v1/guru-mapels/saya')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setGuruMapels(res.data);
          if (res.data.length > 0) setGuruMapelId(res.data[0].id);
        }
      });
  }, []);

  // Ambil tabel nilai setiap kali pilihan kelas/mapel berubah
  const muatTabelNilai = useCallback(() => {
    if (!guruMapelId) return;
    setLoading(true);
    fetch(`/api/v1/nilai?guru_mapel_id=${guruMapelId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSiswaRows(res.data.siswa);
        setLoading(false);
      });
  }, [guruMapelId]);

  useEffect(() => {
    muatTabelNilai();
  }, [muatTabelNilai]);

  function ubahNilai(siswaId: number, nilai: string) {
    setSiswaRows((rows) =>
      rows.map((r) =>
        r.siswaId === siswaId ? { ...r, nilaiAkhir: nilai === '' ? null : Number(nilai) } : r
      )
    );
  }

  function toggleTp(siswaId: number, tpId: number, status: 'TERCAPAI' | 'TIDAK_TERCAPAI') {
    setSiswaRows((rows) =>
      rows.map((r) => {
        if (r.siswaId !== siswaId) return r;
        return {
          ...r,
          tpStatus: r.tpStatus.map((tp) =>
            tp.tpId === tpId ? { ...tp, status: tp.status === status ? null : status } : tp
          ),
        };
      })
    );
  }

  async function submitNilai() {
    if (!guruMapelId) return;
    setSubmitting(true);
    setPesan(null);

    const nilaiSiswa = siswaRows
      .filter((r) => r.nilaiAkhir !== null)
      .map((r) => ({
        siswaId: r.siswaId,
        nilaiAkhir: r.nilaiAkhir as number,
        tpStatus: r.tpStatus
          .filter((tp) => tp.status !== null)
          .map((tp) => ({ tpId: tp.tpId, status: tp.status as 'TERCAPAI' | 'TIDAK_TERCAPAI' })),
      }));

    const res = await fetch('/api/v1/nilai/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guruMapelId, nilaiSiswa }),
    });
    const data = await res.json();

    setSubmitting(false);
    setPesan({
      tipe: data.success ? 'sukses' : 'error',
      teks: data.message,
    });
    if (data.success) muatTabelNilai();
  }

  const totalSiswa = siswaRows.length;
  const sudahDiisi = siswaRows.filter((r) => r.nilaiAkhir !== null).length;
  const selected = guruMapels.find((gm) => gm.id === guruMapelId);
  const semesterLabel = selected?.kelas.tahunAjaran.semester === 1 ? 'Ganjil' : 'Genap';
  const judulHeader = selected
    ? `INPUT NILAI · ${selected.mapel.nama} · ${selected.kelas.nama} · ${selected.kelas.tahunAjaran.tahun} ${semesterLabel}`
    : 'Input nilai';

  return (
    <AppShell title={judulHeader}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: 4,
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
        }}
      >
        <p style={{ fontWeight: 500, margin: '0 0 12px', color: '#111' }}>
          Input nilai akhir raport siswa
        </p>
        <div>
          <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>
            Pilih kelas & mapel
          </label>
          <select
            value={guruMapelId ?? ''}
            onChange={(e) => setGuruMapelId(Number(e.target.value))}
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #dee2e6',
              padding: '6px 8px',
            }}
          >
            {guruMapels.map((gm) => (
              <option key={gm.id} value={gm.id}>
                {gm.mapel.nama} — {gm.kelas.nama}
              </option>
            ))}
          </select>
        </div>
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

      {loading ? (
        <p style={{ fontSize: 13, color: '#555' }}>Memuat data...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 660 }}>
              <thead>
                <tr style={{ background: '#023874' }}>
                  <th rowSpan={2} style={thStyle('16%')}>Siswa</th>
                  <th rowSpan={2} style={{ ...thStyle('9%'), textAlign: 'center' }}>Sem. lalu</th>
                  <th rowSpan={2} style={{ ...thStyle('8%'), textAlign: 'center' }}>Nilai</th>
                  <th colSpan={2} style={{ ...thStyle(undefined), textAlign: 'center' }}>
                    Tujuan pembelajaran
                  </th>
                </tr>
                <tr style={{ background: '#023874' }}>
                  <th style={thStyle('34%')}>Tercapai</th>
                  <th style={thStyle('34%')}>Perlu ditingkatkan</th>
                </tr>
              </thead>
              <tbody>
                {siswaRows.map((row) => (
                  <tr key={row.siswaId}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: '#111' }}>{row.namaSiswa}</div>
                      <div style={{ color: '#777', fontSize: 11 }}>{row.nisn}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#888', verticalAlign: 'middle' }}>
                      {row.nilaiSemesterLalu ?? '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={row.nilaiAkhir ?? ''}
                        onChange={(e) => ubahNilai(row.siswaId, e.target.value)}
                        disabled={row.isFinal}
                        placeholder="-"
                        style={{
                          width: 52,
                          textAlign: 'center',
                          padding: 4,
                          background: row.isFinal ? '#f1f1f1' : '#ffffff',
                          color: '#000000',
                          border: '1px solid #dee2e6',
                          fontSize: 12,
                        }}
                      />
                    </td>
                    <td style={tdStyle}>
                      {row.tpStatus.map((tp) => (
                        <label key={tp.tpId} style={checkboxLabelStyle}>
                          <input
                            type="checkbox"
                            checked={tp.status === 'TERCAPAI'}
                            disabled={row.isFinal}
                            onChange={() => toggleTp(row.siswaId, tp.tpId, 'TERCAPAI')}
                            style={{ marginTop: 2 }}
                          />
                          <span style={{ color: tp.status === 'TERCAPAI' ? '#111' : '#999' }}>
                            {tp.deskripsi}
                          </span>
                        </label>
                      ))}
                    </td>
                    <td style={tdStyle}>
                      {row.tpStatus.map((tp) => (
                        <label key={tp.tpId} style={checkboxLabelStyle}>
                          <input
                            type="checkbox"
                            checked={tp.status === 'TIDAK_TERCAPAI'}
                            disabled={row.isFinal}
                            onChange={() => toggleTp(row.siswaId, tp.tpId, 'TIDAK_TERCAPAI')}
                            style={{ marginTop: 2 }}
                          />
                          <span style={{ color: tp.status === 'TIDAK_TERCAPAI' ? '#111' : '#999' }}>
                            {tp.deskripsi}
                          </span>
                        </label>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: '1rem',
              flexWrap: 'nowrap',
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: '#444',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {sudahDiisi} dari {totalSiswa} siswa sudah diisi nilai
            </p>
            <button
              onClick={submitNilai}
              disabled={submitting}
              style={{
                background: '#023874',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {submitting ? 'Menyimpan...' : 'Submit nilai kelas'}
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}

function thStyle(width: string | undefined): React.CSSProperties {
  return {
    textAlign: 'left',
    padding: '8px 10px',
    fontWeight: 500,
    color: '#ffffff',
    border: '1px solid #dee2e6',
    width,
  };
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'top',
  background: '#ffffff',
  border: '1px solid #dee2e6',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
  marginBottom: 4,
  cursor: 'pointer',
  lineHeight: 1.4,
};