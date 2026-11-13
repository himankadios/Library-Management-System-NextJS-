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
    const file = await prisma.digitalFile.findUnique({
      where: { id },
      include: {
        folder: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Role check
    if (auth.user.role === 'STUDENT' && file.allowedRoles !== 'ALL') {
      return NextResponse.json({ error: 'Access restricted for this digital document' }, { status: 403 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error('File details error:', error);
    return NextResponse.json({ error: 'Failed to retrieve file details' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const body = await request.json();

    const existing = await prisma.digitalFile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const updated = await prisma.digitalFile.update({
      where: { id },
      data: {
        name: body.name ? body.name.trim() : existing.name,
        category: body.category || existing.category,
        description: body.description !== undefined ? body.description : existing.description,
        folderId: body.folderId === 'root' ? null : body.folderId !== undefined ? body.folderId : existing.folderId,
        allowedRoles: body.allowedRoles || existing.allowedRoles,
        isPublic: (body.allowedRoles || existing.allowedRoles) === 'ALL',
      },
      include: { folder: true },
    });

    await logActivity({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'DigitalFile',
      entityId: id,
      details: `Updated metadata for file "${updated.name}"`,
    });

    return NextResponse.json({ success: true, file: updated });
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update file' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const file = await prisma.digitalFile.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete physical file
    try {
      const diskPath = getSafeFilePath(file.storagePath, 'uploads');
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    } catch (fsErr) {
      console.warn('Physical file removal warning:', fsErr.message);
    }

    // Delete DB record
    await prisma.digitalFile.delete({ where: { id } });

    await logActivity({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'DigitalFile',
      entityId: id,
      details: `Deleted digital file "${file.name}"`,
    });

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
