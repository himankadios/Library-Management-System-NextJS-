import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getSafeFilePath } from '@/lib/storage';
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
      return NextResponse.json({ error: 'Access restricted: You do not have permission to view this document' }, { status: 403 });
    }

    const filePath = getSafeFilePath(file.storagePath, 'uploads');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File content not found on server' }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName || file.name)}"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: 'Failed to preview file' }, { status: 500 });
  }
}
