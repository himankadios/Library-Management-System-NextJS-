import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { bookSchema } from '@/lib/validators';
import { logActivity } from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        transactions: {
          where: { status: { in: ['ISSUED', 'OVERDUE'] } },
          include: {
            member: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        reservations: {
          where: { status: 'PENDING' },
          include: {
            member: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Book details error:', error);
    return NextResponse.json({ error: 'Failed to retrieve book' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
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

    // Check ISBN uniqueness if changed
    if (data.isbn !== existing.isbn) {
      const isbnConflict = await prisma.book.findUnique({ where: { isbn: data.isbn } });
      if (isbnConflict && isbnConflict.id !== id) {
        return NextResponse.json(
          { error: `Another book already uses ISBN ${data.isbn}` },
          { status: 400 }
        );
      }
    }

    // Calculate copy adjustments
    const copiesDiff = data.totalCopies - existing.totalCopies;
    const newAvailableCopies = Math.max(0, existing.availableCopies + copiesDiff);

    const updated = await prisma.book.update({
      where: { id },
      data: {
        title: data.title.trim(),
        author: data.author.trim(),
        isbn: data.isbn.trim(),
        publisher: data.publisher.trim(),
        pubYear: data.pubYear,
        categoryId: data.categoryId,
        language: data.language,
        description: data.description,
        totalCopies: data.totalCopies,
        availableCopies: newAvailableCopies,
        shelfNumber: data.shelfNumber,
        coverImage: data.coverImage || existing.coverImage,
      },
      include: { category: true },
    });

    await logActivity({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'Book',
      entityId: id,
      details: `Updated details for book "${updated.title}"`,
    });

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
      book: updated,
    });
  } catch (error) {
    console.error('Update book error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request, ['ADMIN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        transactions: {
          where: { status: { in: ['ISSUED', 'OVERDUE'] } },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete book: Copies are currently issued to students or overdue.' },
        { status: 400 }
      );
    }

    await prisma.book.delete({ where: { id } });

    await logActivity({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'Book',
      entityId: id,
      details: `Deleted book "${book.title}" (ISBN: ${book.isbn})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
