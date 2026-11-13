import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { bookSchema } from '@/lib/validators';
import { logActivity } from '@/lib/logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const categoryId = searchParams.get('category') || '';
    const availability = searchParams.get('availability') || ''; // 'available', 'unavailable', or all
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
        { publisher: { contains: search } },
      ];
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (availability === 'available') {
      where.availableCopies = { gt: 0 };
    } else if (availability === 'unavailable') {
      where.availableCopies = { equals: 0 };
    }

    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { transactions: true, reservations: true } },
        },
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Books list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve books' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const validated = bookSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid book information' },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check duplicate ISBN
    const existing = await prisma.book.findUnique({
      where: { isbn: data.isbn.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A book with ISBN ${data.isbn} already exists ("${existing.title}")` },
        { status: 400 }
      );
    }

    const newBook = await prisma.book.create({
      data: {
        title: data.title.trim(),
        author: data.author.trim(),
        isbn: data.isbn.trim(),
        publisher: data.publisher.trim(),
        pubYear: data.pubYear,
        categoryId: data.categoryId,
        language: data.language || 'English',
        description: data.description || null,
        totalCopies: data.totalCopies,
        availableCopies: data.totalCopies,
        shelfNumber: data.shelfNumber?.trim() || null,
        coverImage: data.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      },
      include: { category: true },
    });

    await logActivity({
      userId: auth.user.id,
      action: 'CREATE',
      entity: 'Book',
      entityId: newBook.id,
      details: `Added new book "${newBook.title}" (ISBN: ${newBook.isbn}, Copies: ${newBook.totalCopies})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Book added successfully',
      book: newBook,
    });
  } catch (error) {
    console.error('Create book error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add book' }, { status: 500 });
  }
}
