import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { returnBookSchema } from '@/lib/validators';
import { logActivity, createNotification } from '@/lib/logger';

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const validated = returnBookSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid return data' },
        { status: 400 }
      );
    }

    const { transactionId, notes } = validated.data;

    const existingTx = await prisma.bookTransaction.findUnique({
      where: { id: transactionId },
      include: {
        book: true,
        member: { include: { user: true } },
      },
    });

    if (!existingTx) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
    }

    if (existingTx.status === 'RETURNED') {
      return NextResponse.json(
        { error: 'This book has already been processed and marked as returned.' },
        { status: 400 }
      );
    }

    // Check overdue and calculate late fees
    const returnDate = new Date();
    const dueDate = new Date(existingTx.dueDate);
    let overdueDays = 0;
    let fineAmount = 0.0;

    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Fetch fine rate from settings
      const fineSetting = await prisma.setting.findUnique({ where: { key: 'FINE_PER_DAY' } });
      const rate = fineSetting ? parseFloat(fineSetting.value) || 1.0 : 1.0;
      fineAmount = parseFloat((overdueDays * rate).toFixed(2));
    }

    // Atomic execution via transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Increment available copies
      await tx.book.update({
        where: { id: existingTx.bookId },
        data: { availableCopies: { increment: 1 } },
      });

      // 2. Update transaction
      const txUpdated = await tx.bookTransaction.update({
        where: { id: transactionId },
        data: {
          returnDate,
          status: 'RETURNED',
          fineAmount,
          returnedById: auth.user.id,
          notes: notes ? `${existingTx.notes ? existingTx.notes + ' | ' : ''}${notes}` : existingTx.notes,
        },
        include: {
          book: true,
          member: { include: { user: true } },
        },
      });

      // 3. If fine applies, create fine entry
      if (fineAmount > 0) {
        await tx.fine.create({
          data: {
            transactionId: txUpdated.id,
            memberId: existingTx.memberId,
            amount: fineAmount,
            status: 'UNPAID',
            notes: `Overdue by ${overdueDays} day(s) at scheduled return.`,
          },
        });
      }

      return txUpdated;
    });

    // Notify member
    let returnMessage = `Book "${existingTx.book.title}" returned successfully.`;
    if (fineAmount > 0) {
      returnMessage += ` An overdue fine of $${fineAmount.toFixed(2)} (${overdueDays} days) has been recorded.`;
    }

    await createNotification({
      userId: existingTx.member.userId,
      title: 'Book Return Processed',
      message: returnMessage,
      type: fineAmount > 0 ? 'WARNING' : 'SUCCESS',
      link: '/dashboard/circulation/history',
    });

    // Log Activity
    await logActivity({
      userId: auth.user.id,
      action: 'RETURN',
      entity: 'BookTransaction',
      entityId: updated.id,
      details: `Processed return of "${existingTx.book.title}" from ${existingTx.member.user.name}. Fine: $${fineAmount.toFixed(2)}`,
    });

    return NextResponse.json({
      success: true,
      message: returnMessage,
      transaction: updated,
      overdueDays,
      fineAmount,
    });
  } catch (error) {
    console.error('Return book error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process return' }, { status: 500 });
  }
}
