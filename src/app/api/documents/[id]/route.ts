import { getDocumentBlob } from '@/actions/documents';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await getDocumentBlob(params.id);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return new NextResponse(result.buffer as any, {
    headers: {
      'Content-Type': result.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(result.filename)}"`,
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}
