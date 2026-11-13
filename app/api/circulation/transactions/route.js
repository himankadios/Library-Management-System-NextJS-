export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || ''; // 'ISSUED', 'OVERDUE', 'RETURNED', or empty
    const search = searchParams.get('search')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    // First auto-flag overdue transactions
    const now = new Date();
    await prisma.bookTransaction.updateMany({
      where: {
        status: 'ISSUED',
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    const where = {};

    // If Student, only show their own transactions
    if (user.role === 'STUDENT') {
      if (!user.memberProfile?.id) {
        return NextResponse.json({ transactions: [], pagination: { total: 0, page: 1, limit, totalPages: 1 } });
      }
      where.memberId = user.memberProfile.id;
    } else {
      const filterMemberId = searchParams.get('memberId');
      if (filterMemberId) {
        where.memberId = filterMemberId;
      }
    }

    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        where.status = { in: ['ISSUED', 'OVERDUE'] };
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { book: { title: { contains: search } } },
        { book: { isbn: { contains: search } } },
        { member: { rollNumber: { contains: search } } },
        { member: { user: { name: { contains: search } } } },
      ];
    }

    const [total, transactions] = await Promise.all([
      prisma.bookTransaction.count({ where }),
      prisma.bookTransaction.findMany({
        where,
        include: {
          book: true,
          member: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          issuedBy: { select: { name: true } },
          returnedBy: { select: { name: true } },
          fines: true,
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Transactions list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve transactions' }, { status: 500 });
  }
}
