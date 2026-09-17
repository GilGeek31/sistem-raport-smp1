import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ambilDataRaport, bolehLihatRaport } from '@/lib/raport-data';

// GET /api/v1/raport/:siswaId/preview?tahun_ajaran_id=...
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

  return apiSuccess(data, 'Preview data raport berhasil diambil');
}