export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity, createNotification } from '@/lib/logger';

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // UNPAID, PAID, WAIVED

    const where = {};
    if (user.role === 'STUDENT') {
      if (!user.memberProfile?.id) {
        return NextResponse.json({ fines: [] });
      }
      where.memberId = user.memberProfile.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const fines = await prisma.fine.findMany({
      where,
      include: {
        member: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        transaction: {
          include: {
            book: { select: { title: true, isbn: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ fines });
  } catch (error) {
    console.error('Fines list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve fines' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { fineId, action } = await request.json(); // action: 'PAY' or 'WAIVE'
    if (!fineId || !['PAY', 'WAIVE'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const fine = await prisma.fine.findUnique({
      where: { id: fineId },
      include: {
        member: { include: { user: true } },
        transaction: { include: { book: true } },
      },
    });

    if (!fine) {
      return NextResponse.json({ error: 'Fine not found' }, { status: 404 });
    }

    const newStatus = action === 'PAY' ? 'PAID' : 'WAIVED';
    const updated = await prisma.fine.update({
      where: { id: fineId },
      data: {
        status: newStatus,
        paidDate: new Date(),
      },
    });

    await logActivity({
      userId: auth.user.id,
      action: action === 'PAY' ? 'UPDATE' : 'WAIVE',
      entity: 'Fine',
      entityId: fineId,
      details: `${action === 'PAY' ? 'Settled payment' : 'Waived fine'} of $${fine.amount.toFixed(2)} for ${fine.member.user.name}`,
    });

    await createNotification({
      userId: fine.member.userId,
      title: action === 'PAY' ? 'Fine Paid' : 'Fine Waived',
      message: `Your overdue fine of $${fine.amount.toFixed(2)} for "${fine.transaction.book.title}" was marked as ${newStatus}.`,
      type: 'SUCCESS',
      link: '/dashboard/circulation/history',
    });

    return NextResponse.json({ success: true, fine: updated });
  } catch (error) {
    console.error('Update fine error:', error);
    return NextResponse.json({ error: 'Failed to update fine' }, { status: 500 });
  }
}
