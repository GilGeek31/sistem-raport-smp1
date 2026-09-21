'use client';

import { useState, useRef } from 'react';
import { AppShell } from '@/components/AppShell';

type HasilValidasi = {
  baris: number;
  status: 'valid' | 'error' | 'duplikat';
  pesan?: string;
  data?: Record<string, unknown>;
};

type Ringkasan = { total: number; valid: number; error: number; duplikat: number };

export default function ImportGuruPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memvalidasi, setMemvalidasi] = useState(false);
  const [mengimport, setMengimport] = useState(false);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [hasil, setHasil] = useState<HasilValidasi[]>([]);
  const [hasilImport, setHasilImport] = useState<{ berhasil: number; gagal: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Pilih file Excel terlebih dahulu');
      return;
    }

    setMemvalidasi(true);
    setError(null);
    setHasilImport(null);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/v1/gurus/import/preview', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    setMemvalidasi(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    setRingkasan(data.data.ringkasan);
    setHasil(data.data.hasil);
  }

  async function handleKonfirmasi() {
    const guruValid = hasil.filter((h) => h.status === 'valid').map((h) => h.data);
    if (guruValid.length === 0) return;

    setMengimport(true);
    setError(null);

    const res = await fetch('/api/v1/gurus/import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guruList: guruValid }),
    });
    const data = await res.json();

    setMengimport(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    setHasilImport({ berhasil: data.data.berhasil, gagal: data.data.gagal });
    setRingkasan(null);
    setHasil([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <AppShell title="Import guru dari Excel">
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: 4,
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          maxWidth: 720,
        }}
      >
        <p style={{ fontWeight: 500, margin: '0 0 8px', color: '#111' }}>
          Import data guru dari file Excel
        </p>
        <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
          Download template dulu, isi datanya, lalu upload kembali di sini.
        </p>

        <a
          href="/api/v1/gurus/template"
          style={{
            display: 'inline-block',
            fontSize: 13,
            color: '#023874',
            marginBottom: 16,
            textDecoration: 'underline',
          }}
        >
          ⬇ Download template Excel
        </a>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ fontSize: 13 }} />
          <button
            onClick={handleUpload}
            disabled={memvalidasi}
            style={{
              background: '#023874',
              color: '#ffffff',
              border: 'none',
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {memvalidasi ? 'Memvalidasi...' : 'Validasi file'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '1rem',
            borderRadius: 4,
            fontSize: 13,
            background: '#fdecea',
            color: '#b3261e',
            border: '1px solid #f5c2c0',
            maxWidth: 720,
          }}
        >
          {error}
        </div>
      )}

      {hasilImport && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '1rem',
            borderRadius: 4,
            fontSize: 13,
            background: '#e6f4ea',
            color: '#1e7e34',
            border: '1px solid #b7e1c1',
            maxWidth: 720,
          }}
        >
          Import selesai: {hasilImport.berhasil} guru berhasil disimpan
          {hasilImport.gagal > 0 ? `, ${hasilImport.gagal} gagal` : ''}.
        </div>
      )}

      {ringkasan && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 12,
              fontSize: 13,
              color: '#333',
            }}
          >
            <span>Total: <strong>{ringkasan.total}</strong></span>
            <span style={{ color: '#1e7e34' }}>Valid: <strong>{ringkasan.valid}</strong></span>
            <span style={{ color: '#b3261e' }}>Error: <strong>{ringkasan.error}</strong></span>
            <span style={{ color: '#a15c00' }}>Duplikat: <strong>{ringkasan.duplikat}</strong></span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: 4, marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#023874' }}>
                  <th style={thStyle}>Baris</th>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {hasil.map((h) => (
                  <tr key={h.baris}>
                    <td style={tdStyle}>{h.baris}</td>
                    <td style={tdStyle}>{(h.data?.nama as string) ?? '-'}</td>
                    <td style={{ ...tdStyle, color: warnaStatus(h.status), fontWeight: 500 }}>
                      {h.status.toUpperCase()}
                    </td>
                    <td style={tdStyle}>{h.pesan ?? 'Siap diimport'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ringkasan.valid > 0 && (
            <button
              onClick={handleKonfirmasi}
              disabled={mengimport}
              style={{
                background: '#1e7e34',
                color: '#ffffff',
                border: 'none',
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {mengimport ? 'Menyimpan...' : `Konfirmasi & simpan ${ringkasan.valid} guru`}
            </button>
          )}
        </>
      )}
    </AppShell>
  );
}

function warnaStatus(status: string) {
  if (status === 'valid') return '#1e7e34';
  if (status === 'error') return '#b3261e';
  return '#a15c00';
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontWeight: 500,
  color: '#ffffff',
  border: '1px solid #dee2e6',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #dee2e6',
  background: '#ffffff',
};