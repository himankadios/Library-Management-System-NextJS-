export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const transactions = await prisma.bookTransaction.findMany({
      include: {
        book: { select: { title: true, isbn: true } },
        member: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { issueDate: 'desc' },
    });

    const headers = ['Transaction ID', 'Book Title', 'ISBN', 'Member Name', 'Member Email', 'Roll Number', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine Amount'];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = transactions.map((t) => [
      escapeCsv(t.id),
      escapeCsv(t.book.title),
      escapeCsv(t.book.isbn),
      escapeCsv(t.member.user.name),
      escapeCsv(t.member.user.email),
      escapeCsv(t.member.rollNumber),
      new Date(t.issueDate).toLocaleDateString(),
      new Date(t.dueDate).toLocaleDateString(),
      t.returnDate ? new Date(t.returnDate).toLocaleDateString() : 'N/A',
      t.status,
      `$${t.fineAmount.toFixed(2)}`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="auralib_circulation_report.csv"',
      },
    });
  } catch (error) {
    console.error('Export report error:', error);
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}
