export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { reservationSchema } from '@/lib/validators';
import { logActivity, createNotification, notifyStaff } from '@/lib/logger';

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {};
    if (user.role === 'STUDENT') {
      if (!user.memberProfile?.id) {
        return NextResponse.json({ reservations: [] });
      }
      where.memberId = user.memberProfile.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        book: { include: { category: true } },
        member: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { requestDate: 'desc' },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Reservations error:', error);
    return NextResponse.json({ error: 'Failed to retrieve reservations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    let memberId = user.memberProfile?.id;

    const body = await request.json();
    const validated = reservationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid reservation' },
        { status: 400 }
      );
    }

    const { bookId, notes } = validated.data;

    // Staff can reserve on behalf of a specific member if memberId is passed in body
    if (['ADMIN', 'LIBRARIAN'].includes(user.role) && body.memberId) {
      memberId = body.memberId;
    }

    if (!memberId) {
      return NextResponse.json(
        { error: 'A valid student member profile is required to place reservations.' },
        { status: 400 }
      );
    }

    // Check book exists
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check duplicate pending reservation
    const existing = await prisma.reservation.findFirst({
      where: {
        bookId,
        memberId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active pending reservation for this title.' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        bookId,
        memberId,
        notes: notes || null,
        status: 'PENDING',
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days valid
      },
      include: {
        book: true,
        member: { include: { user: true } },
      },
    });

    await logActivity({
      userId: user.id,
      action: 'RESERVE',
      entity: 'Reservation',
      entityId: reservation.id,
      details: `Reservation requested for "${book.title}" by ${user.name}`,
    });

    await notifyStaff({
      title: 'New Book Reservation',
      message: `${user.name} placed a reservation hold for "${book.title}".`,
      type: 'INFO',
      link: '/dashboard/reservations',
    });

    return NextResponse.json({
      success: true,
      message: `Reservation placed successfully for "${book.title}".`,
      reservation,
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place reservation' }, { status: 500 });
  }
}
