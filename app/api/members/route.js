export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';
import { memberSchema } from '@/lib/validators';
import { logActivity } from '@/lib/logger';

export async function GET(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (search) {
      where.OR = [
        { rollNumber: { contains: search } },
        { regNumber: { contains: search } },
        { department: { contains: search } },
        { course: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [total, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, status: true, createdAt: true },
          },
          transactions: {
            where: { status: { in: ['ISSUED', 'OVERDUE'] } },
            select: { id: true, status: true },
          },
          fines: {
            where: { status: 'UNPAID' },
            select: { amount: true },
          },
          _count: {
            select: {
              transactions: true,
              reservations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Format response with active counts and outstanding fines
    const formatted = members.map((m) => {
      const activeLoansCount = m.transactions.length;
      const overdueLoansCount = m.transactions.filter((t) => t.status === 'OVERDUE').length;
      const unpaidFinesTotal = m.fines.reduce((sum, f) => sum + (f.amount || 0), 0);
      return {
        ...m,
        activeLoansCount,
        overdueLoansCount,
        unpaidFinesTotal,
      };
    });

    return NextResponse.json({
      members: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Members list error:', error);
    return NextResponse.json({ error: 'Failed to retrieve members' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const validated = memberSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid member details' },
        { status: 400 }
      );
    }

    const data = validated.data;
    const cleanEmail = data.email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Check roll number uniqueness
    const existingRoll = await prisma.member.findUnique({ where: { rollNumber: data.rollNumber.trim() } });
    if (existingRoll) {
      return NextResponse.json({ error: `Roll number ${data.rollNumber} is already registered` }, { status: 400 });
    }

    const defaultPassword = await hashPassword('student123');

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: cleanEmail,
          password: defaultPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          rollNumber: data.rollNumber.trim(),
          regNumber: data.regNumber?.trim() || `REG-${Date.now().toString().slice(-6)}`,
          department: data.department.trim(),
          course: data.course.trim(),
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          maxBooksAllowed: data.maxBooksAllowed || 4,
          status: data.status || 'ACTIVE',
        },
        include: { user: true },
      });

      return member;
    });

    await logActivity({
      userId: auth.user.id,
      action: 'CREATE',
      entity: 'Member',
      entityId: result.id,
      details: `Created member account for ${result.user.name} (Roll: ${result.rollNumber})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Member registered successfully (default password: student123)',
      member: result,
    });
  } catch (error) {
    console.error('Create member error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create member' }, { status: 500 });
  }
}
