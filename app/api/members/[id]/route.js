import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;

    // Student can only view their own profile unless staff
    if (auth.user.role === 'STUDENT' && auth.user.memberProfile?.id !== id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        user: true,
        transactions: {
          include: {
            book: true,
            issuedBy: { select: { name: true } },
            returnedBy: { select: { name: true } },
          },
          orderBy: { issueDate: 'desc' },
        },
        reservations: {
          include: { book: true },
          orderBy: { requestDate: 'desc' },
        },
        fines: {
          include: { transaction: { include: { book: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Member details error:', error);
    return NextResponse.json({ error: 'Failed to retrieve member' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const body = await request.json();

    const existing = await prisma.member.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.name || body.userStatus) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            name: body.name ? body.name.trim() : existing.user.name,
            status: body.userStatus || existing.user.status,
          },
        });
      }

      return await tx.member.update({
        where: { id },
        data: {
          rollNumber: body.rollNumber ? body.rollNumber.trim() : existing.rollNumber,
          regNumber: body.regNumber !== undefined ? body.regNumber : existing.regNumber,
          department: body.department ? body.department.trim() : existing.department,
          course: body.course ? body.course.trim() : existing.course,
          phone: body.phone !== undefined ? body.phone : existing.phone,
          address: body.address !== undefined ? body.address : existing.address,
          maxBooksAllowed: body.maxBooksAllowed ? parseInt(body.maxBooksAllowed, 10) : existing.maxBooksAllowed,
          status: body.status || existing.status,
        },
        include: { user: true },
      });
    });

    await logActivity({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'Member',
      entityId: id,
      details: `Updated member profile for ${updated.user.name} (${updated.rollNumber})`,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request, ['ADMIN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        transactions: {
          where: { status: { in: ['ISSUED', 'OVERDUE'] } },
        },
        fines: {
          where: { status: 'UNPAID' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete member: They currently have active or overdue borrowed books.' },
        { status: 400 }
      );
    }

    if (member.fines.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete member: They have unpaid overdue fines.' },
        { status: 400 }
      );
    }

    // Cascade delete user
    await prisma.user.delete({ where: { id: member.userId } });

    await logActivity({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'Member',
      entityId: id,
      details: `Deleted member account ID ${id}`,
    });

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
