import { DataRaport } from './raport-data';

// Fungsi ini MURNI bikin teks HTML — tidak ada Puppeteer di sini.
// Puppeteer baru dipakai nanti di file route.ts, untuk "screenshot"
// hasil HTML ini jadi PDF.
export function generateRaportHtml(data: DataRaport): string {
  const {
    siswa,
    kelas,
    tahunAjaran,
    nilais,
    ekskuls,
    kokurikulers,
    kehadiran,
    pengaturanRaport,
    ttdWaliKelas,
    ttdKepsek,
    namaWaliKelas,
  } = data;

  const tanggalRaport = pengaturanRaport
    ? new Date(pengaturanRaport.tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return `
<!DOCTYPE html>
<html lang="id">
<head>
<title>Raport ${siswa.nama}</title>
<meta charset="UTF-8" />
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12px; color: #111; margin: 0; padding: 15px; }
  h1 { text-align: center; font-size: 16px; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
  th { background: #f0f0f0; text-align: center }
  .center{text-align:center;}
  .info-table td { border: none; padding: 2px 4px; }
  .ttd-section { display: flex; justify-content: space-between; margin-top: 40px; }
  .ttd-box { text-align: center; width: 200px; }
  .ttd-box img { height: 60px; object-fit: contain; }
  .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 8px; }
</style>
</head>
<body>
  <h1>LAPORAN HASIL BELAJAR SISWA</h1>
  <div class="subtitle">Tahun Ajaran ${tahunAjaran.tahun} — Semester ${tahunAjaran.semester === 1 ? 'Ganjil' : 'Genap'}</div>

  <table class="info-table">
    <tr><td><strong>Nama</strong></td><td>: ${siswa.nama}</td><td><strong>Kelas</strong></td><td>: ${kelas.nama}</td></tr>
    <tr><td><strong>NISN</strong></td><td>: ${siswa.nisn}</td><td><strong>NIS</strong></td><td>: ${siswa.nis ?? '-'}</td></tr>
  </table>

  <div class="section-title">A. Nilai Akademik</div>
  <table>
    <thead>
      <tr><th style="width: 4%">No</th><th style="width: 25%">Mata Pelajaran</th><th style="width: 8%">Nilai</th><th>Deskripsi</th></tr>
    </thead>
    <tbody>
      ${nilais
        .map(
          (n, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${n.mapel}</td>
          <td class="center">${n.nilaiAkhir ?? '-'}</td>
          <td>${n.deskripsi ?? '-'}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="section-title">B. Ekstrakurikuler</div>
  <table>
    <thead>
      <tr><th style="width: 4%">No</th><th style="width: 25%">Kegiatan</th><th style="width: 8%">Nilai</th><th>Deskripsi</th></tr>
    </thead>
    <tbody>
      ${
        ekskuls.length > 0
          ? ekskuls
              .map(
                (e, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${e.nama}</td>
          <td class="center">${e.nilai ?? '-'}</td>
          <td>${e.deskripsi ?? '-'}</td>
        </tr>`
              )
              .join('')
          : '<tr><td colspan="4">Tidak ada data ekstrakurikuler</td></tr>'
      }
    </tbody>
  </table>

  <div class="section-title">C. Kokurikuler (Proyek Profil Pelajar Pancasila)</div>
  <table>
    <thead><tr><th style="width: 4%">No</th><th style="width: 30%">Tema Proyek</th><th>Deskripsi</th></tr></thead>
    <tbody>
      ${
        kokurikulers.length > 0
          ? kokurikulers
              .map(
                (k, i) => `
        <tr><td>${i + 1}</td><td>${k.nama}</td><td>${k.deskripsi ?? '-'}</td></tr>`
              )
              .join('')
          : '<tr><td colspan="3">Tidak ada data kokurikuler</td></tr>'
      }
    </tbody>
  </table>

  <div class="section-title">D. Ketidakhadiran</div>
  <table style="width: 40%" class="tb-sakit">
    <tr><th>Sakit</th><th>Izin</th><th>Tanpa Keterangan</th></tr>
    <tr><td class="center">${kehadiran.sakit} hari</td><td  class="center">${kehadiran.izin} hari</td><td class="center">${kehadiran.tanpaKeterangan} hari</td></tr>
  </table>

  <div class="ttd-section">
    <div class="ttd-box">
      <p>Orang Tua/Wali</p>
      <br /><br /><br />
      <p>______________________</p>
    </div>

    <div class="ttd-box">
      <p>${pengaturanRaport?.tempat ?? '-'}, ${tanggalRaport}</p>
      <p>Wali Kelas</p>
      ${ttdWaliKelas ? `<img src="${ttdWaliKelas}" />` : '<br /><br /><br />'}
      <p>${namaWaliKelas ?? '______________________'}</p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px;">
    <p>Mengetahui,<br />Kepala Sekolah</p>
    ${ttdKepsek ? `<img src="${ttdKepsek}" style="height: 60px;" />` : '<br /><br /><br />'}
    <p>______________________</p>
  </div>
</body>
</html>
  `;
}