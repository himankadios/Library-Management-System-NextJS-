import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { books: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Failed to retrieve categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { name, description } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: cleanName }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: cleanName,
        slug,
        description: description?.trim() || null,
      },
    });

    await logActivity({
      userId: auth.user.id,
      action: 'CREATE',
      entity: 'Category',
      entityId: category.id,
      details: `Created new category "${category.name}"`,
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const count = await prisma.book.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: Category has ${count} associated books. Move books first.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    await logActivity({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'Category',
      entityId: id,
      details: `Deleted category with ID ${id}`,
    });

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
