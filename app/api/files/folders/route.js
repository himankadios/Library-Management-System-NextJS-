export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { folderSchema } from '@/lib/validators';
import { logActivity } from '@/lib/logger';

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const where = {};

    // Filter by allowed role if student
    if (user.role === 'STUDENT') {
      where.allowedRoles = 'ALL';
    }

    const folders = await prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: { files: true, subfolders: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Folders list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve folders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const validated = folderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid folder parameters' },
        { status: 400 }
      );
    }

    const { name, parentId, category, allowedRoles } = validated.data;

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        category: category || 'Academic Materials',
        allowedRoles: allowedRoles || 'ALL',
        createdById: auth.user.id,
      },
      include: {
        parent: true,
        _count: { select: { files: true, subfolders: true } },
      },
    });

    await logActivity({
      userId: auth.user.id,
      action: 'CREATE',
      entity: 'Folder',
      entityId: folder.id,
      details: `Created folder "${folder.name}" in category "${folder.category}"`,
    });

    return NextResponse.json({ success: true, folder });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create folder' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: { select: { files: true, subfolders: true } },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    await prisma.folder.delete({ where: { id } });

    await logActivity({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'Folder',
      entityId: id,
      details: `Deleted folder "${folder.name}"`,
    });

    return NextResponse.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
