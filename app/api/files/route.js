export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { validateFile, saveUploadedFile } from '@/lib/storage';
import { logActivity, createNotification } from '@/lib/logger';
import path from 'path';

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const folderId = searchParams.get('folderId'); // if 'root', folderId is null
    const category = searchParams.get('category');
    const fileType = searchParams.get('fileType');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const where = {};

    // Role permissions
    if (user.role === 'STUDENT') {
      where.allowedRoles = 'ALL';
    } else if (user.role === 'LIBRARIAN') {
      where.allowedRoles = { in: ['ALL', 'ADMIN_LIBRARIAN'] };
    }

    if (folderId !== undefined && folderId !== null && folderId !== '') {
      if (folderId === 'root') {
        where.folderId = null;
      } else {
        where.folderId = folderId;
      }
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (fileType && fileType !== 'ALL') {
      where.fileType = fileType.toLowerCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { originalName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const files = await prisma.digitalFile.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true, category: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortBy]: order },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Files list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve files' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Please choose a file to upload' }, { status: 400 });
    }

    const customName = formData.get('name') || file.name;
    const category = formData.get('category') || 'Academic Materials';
    const folderId = formData.get('folderId') || null;
    const description = formData.get('description') || null;
    const allowedRoles = formData.get('allowedRoles') || 'ALL';

    // File validation
    const validation = validateFile({
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Save to disk securely
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveUploadedFile(buffer, file.name, 'uploads');

    // Create DB entry
    const digitalFile = await prisma.digitalFile.create({
      data: {
        name: customName,
        originalName: file.name,
        fileType: validation.ext,
        mimeType: validation.detectedMime,
        fileSize: file.size,
        category,
        description,
        folderId: folderId && folderId !== 'root' ? folderId : null,
        storagePath: saved.safeName,
        allowedRoles,
        isPublic: allowedRoles === 'ALL',
        uploadedById: auth.user.id,
      },
      include: {
        folder: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userId: auth.user.id,
      action: 'UPLOAD',
      entity: 'DigitalFile',
      entityId: digitalFile.id,
      details: `Uploaded digital document "${digitalFile.name}" (${(file.size / 1024).toFixed(1)} KB)`,
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: digitalFile,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
