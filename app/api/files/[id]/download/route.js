import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getSafeFilePath } from '@/lib/storage';
import { logActivity } from '@/lib/logger';
import fs from 'fs';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const file = await prisma.digitalFile.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Role check
    if (auth.user.role === 'STUDENT' && file.allowedRoles !== 'ALL') {
      return NextResponse.json({ error: 'Access restricted: You do not have permission to download this document' }, { status: 403 });
    }

    const filePath = getSafeFilePath(file.storagePath, 'uploads');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File content not found on server' }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    // Increment download count asynchronously
    await prisma.digitalFile.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    await logActivity({
      userId: auth.user.id,
      action: 'DOWNLOAD',
      entity: 'DigitalFile',
      entityId: id,
      details: `Downloaded "${file.name}"`,
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName || file.name)}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
