import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity, createNotification } from '@/lib/logger';

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const { status, notes } = await request.json();
    const allowedStatuses = ['APPROVED', 'REJECTED', 'CANCELLED', 'FULFILLED'];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid reservation status' }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        book: true,
        member: { include: { user: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Only Admin/Librarian can approve/reject/fulfill; student can cancel their own
    if (auth.user.role === 'STUDENT') {
      if (reservation.member.userId !== auth.user.id || status !== 'CANCELLED') {
        return NextResponse.json({ error: 'You can only cancel your own reservations' }, { status: 403 });
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status,
        notes: notes || reservation.notes,
      },
      include: {
        book: true,
        member: { include: { user: true } },
      },
    });

    // Notify student
    await createNotification({
      userId: reservation.member.userId,
      title: `Reservation ${status}`,
      message: `Your reservation request for "${reservation.book.title}" was marked as ${status}.`,
      type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'WARNING' : 'INFO',
      link: '/dashboard/reservations',
    });

    await logActivity({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'Reservation',
      entityId: id,
      details: `Updated reservation status to ${status} for "${reservation.book.title}"`,
    });

    return NextResponse.json({ success: true, reservation: updated });
  } catch (error) {
    console.error('Update reservation error:', error);
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
  }
}
