import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { auth } from '@/lib/auth';
import { apiError } from '@/lib/api-response';
import { ambilDataRaport, bolehLihatRaport } from '@/lib/raport-data';
import { generateRaportHtml } from '@/lib/raport-template';

// GET /api/v1/raport/:siswaId/pdf?tahun_ajaran_id=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siswaId: string }> }
) {
  const session = await auth();
  if (!session) return apiError('Anda harus login terlebih dahulu', 401);

  const { siswaId } = await params;
  const tahunAjaranId = req.nextUrl.searchParams.get('tahun_ajaran_id');

  const boleh = await bolehLihatRaport(
    Number(session.user.id),
    session.user.role,
    Number(siswaId)
  );
  if (!boleh) return apiError('Anda tidak punya akses ke raport ini', 403);

  const data = await ambilDataRaport(
    Number(siswaId),
    tahunAjaranId ? Number(tahunAjaranId) : undefined
  );
  if (!data) {
    return apiError('Data raport tidak lengkap (siswa/kelas/tahun ajaran tidak ditemukan)', 404);
  }

  const html = generateRaportHtml(data);

  // --- Bagian inti Puppeteer ---
  // 1. Nyalakan "browser tanpa tampilan"
  const browser = await puppeteer.launch({ headless: true });
  try {
    // 2. Buka 1 tab baru di browser itu
    const page = await browser.newPage();

    // 3. "Muat" HTML yang kita generate tadi ke tab itu,
    //    seolah-olah kita buka file HTML biasa di Chrome
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 4. "Screenshot" seluruh halaman itu, dalam bentuk PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });

    // 5. Kirim hasilnya sebagai file PDF ke browser yang minta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="raport-${data.siswa.nama}.pdf"`,
      },
    });
  } finally {
    // Penting: selalu tutup browser-nya setelah selesai,
    // supaya tidak ada proses "menggantung" yang makan memori server.
    await browser.close();
  }
}