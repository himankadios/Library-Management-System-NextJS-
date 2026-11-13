import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { issueBookSchema } from '@/lib/validators';
import { logActivity, createNotification } from '@/lib/logger';

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const validated = issueBookSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid circulation data' },
        { status: 400 }
      );
    }

    const { bookId, memberId, dueDate, notes } = validated.data;

    // Check Member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: true,
        transactions: {
          where: { status: { in: ['ISSUED', 'OVERDUE'] } },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Library member not found' }, { status: 404 });
    }

    if (member.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot issue book: Member account is currently ${member.status}.` },
        { status: 400 }
      );
    }

    // Check borrowing limit
    if (member.transactions.length >= member.maxBooksAllowed) {
      return NextResponse.json(
        {
          error: `Member has reached maximum borrowing limit (${member.transactions.length}/${member.maxBooksAllowed} books). Return an existing book first.`,
        },
        { status: 400 }
      );
    }

    // Prevent duplicate active borrowing of the same book
    const duplicate = member.transactions.find((tx) => tx.bookId === bookId);
    if (duplicate) {
      return NextResponse.json(
        { error: 'This member already has an active borrowed copy of this book.' },
        { status: 400 }
      );
    }

    // Check Book
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.availableCopies <= 0) {
      return NextResponse.json(
        { error: `No available copies for "${book.title}". All ${book.totalCopies} copies are currently checked out.` },
        { status: 400 }
      );
    }

    // Execute issue inside database transaction to ensure atomicity
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Decrement available copies
      await tx.book.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
      });

      // 2. Create circulation transaction
      const newTx = await tx.bookTransaction.create({
        data: {
          bookId,
          memberId,
          issueDate: new Date(),
          dueDate: new Date(dueDate),
          status: 'ISSUED',
          issuedById: auth.user.id,
          notes: notes || null,
        },
        include: {
          book: true,
          member: { include: { user: true } },
        },
      });

      // 3. If there was a pending reservation for this book by this member, fulfill it
      await tx.reservation.updateMany({
        where: {
          bookId,
          memberId,
          status: 'PENDING',
        },
        data: { status: 'FULFILLED' },
      });

      return newTx;
    });

    // Notify member
    await createNotification({
      userId: member.userId,
      title: 'Book Issued Successfully',
      message: `"${book.title}" has been issued to you. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
      type: 'SUCCESS',
      link: '/dashboard/circulation/issued',
    });

    // Log Activity
    await logActivity({
      userId: auth.user.id,
      action: 'ISSUE',
      entity: 'BookTransaction',
      entityId: transaction.id,
      details: `Issued "${book.title}" to ${member.user.name} (Roll: ${member.rollNumber}). Due: ${new Date(dueDate).toLocaleDateString()}`,
    });

    return NextResponse.json({
      success: true,
      message: `Book "${book.title}" issued successfully to ${member.user.name}.`,
      transaction,
    });
  } catch (error) {
    console.error('Issue book error:', error);
    return NextResponse.json({ error: error.message || 'Failed to issue book' }, { status: 500 });
  }
}
