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

    const books = await prisma.book.findMany({
      include: { category: true },
      orderBy: { title: 'asc' },
    });

    const headers = [
      'Title',
      'Author',
      'ISBN',
      'Publisher',
      'Publication Year',
      'Category',
      'Language',
      'Total Copies',
      'Available Copies',
      'Shelf Number',
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = books.map((b) => [
      escapeCsv(b.title),
      escapeCsv(b.author),
      escapeCsv(b.isbn),
      escapeCsv(b.publisher),
      b.pubYear,
      escapeCsv(b.category?.name || 'Uncategorized'),
      escapeCsv(b.language),
      b.totalCopies,
      b.availableCopies,
      escapeCsv(b.shelfNumber || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="auralib_books_export.csv"',
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Failed to export books' }, { status: 500 });
  }
}
