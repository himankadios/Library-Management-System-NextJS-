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

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const dateFilter = {};
    if (startDateParam) {
      dateFilter.gte = new Date(startDateParam);
    }
    if (endDateParam) {
      dateFilter.lte = new Date(endDateParam + 'T23:59:59.999Z');
    }

    const txDateWhere = Object.keys(dateFilter).length > 0 ? { issueDate: dateFilter } : {};

    // Parallel aggregate queries
    const [
      totalBooks,
      copiesAgg,
      totalMembers,
      totalFiles,
      issuedCount,
      returnedCount,
      overdueCount,
      finesAgg,
      mostBorrowedBooks,
      categoriesWithCount,
      transactionsList,
      fileCategoryAgg,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.book.aggregate({
        _sum: { totalCopies: true, availableCopies: true },
      }),
      prisma.member.count(),
      prisma.digitalFile.count(),
      prisma.bookTransaction.count({
        where: { ...txDateWhere, status: { in: ['ISSUED', 'OVERDUE'] } },
      }),
      prisma.bookTransaction.count({
        where: { ...txDateWhere, status: 'RETURNED' },
      }),
      prisma.bookTransaction.count({
        where: { ...txDateWhere, status: 'OVERDUE' },
      }),
      prisma.fine.aggregate({
        _sum: { amount: true },
      }),
      // Most borrowed books (by transaction count)
      prisma.book.findMany({
        take: 5,
        include: {
          category: { select: { name: true } },
          _count: { select: { transactions: true } },
        },
        orderBy: {
          transactions: { _count: 'desc' },
        },
      }),
      // Category popular counts
      prisma.category.findMany({
        include: {
          _count: { select: { books: true } },
        },
      }),
      // Transactions for timeline breakdown
      prisma.bookTransaction.findMany({
        where: txDateWhere,
        select: { issueDate: true, status: true, fineAmount: true },
      }),
      // Files by category
      prisma.digitalFile.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
    ]);

    const totalCopies = copiesAgg._sum.totalCopies || 0;
    const availableCopies = copiesAgg._sum.availableCopies || 0;
    const issuedCopies = totalCopies - availableCopies;
    const totalFines = finesAgg._sum.amount || 0;

    // Monthly breakdown
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = months.map((m) => ({
      month: m,
      issued: 0,
      returned: 0,
      overdue: 0,
    }));

    transactionsList.forEach((tx) => {
      const monthIndex = new Date(tx.issueDate).getMonth();
      monthlyStats[monthIndex].issued += 1;
      if (tx.status === 'RETURNED') monthlyStats[monthIndex].returned += 1;
      if (tx.status === 'OVERDUE') monthlyStats[monthIndex].overdue += 1;
    });

    return NextResponse.json({
      summary: {
        totalBooks,
        totalCopies,
        availableCopies,
        issuedCopies,
        totalMembers,
        totalFiles,
        issuedCount,
        returnedCount,
        overdueCount,
        totalFines,
      },
      mostBorrowedBooks: mostBorrowedBooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.category.name,
        borrowCount: b._count.transactions,
      })),
      categoryDistribution: categoriesWithCount.map((c) => ({
        name: c.name,
        booksCount: c._count.books,
      })),
      fileDistribution: fileCategoryAgg.map((f) => ({
        category: f.category,
        count: f._count.id,
      })),
      monthlyStats,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 });
  }
}
