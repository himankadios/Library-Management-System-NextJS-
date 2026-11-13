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
    const isStudent = user.role === 'STUDENT';

    // Global Library Metrics
    const [
      totalBooksCount,
      totalCopiesAgg,
      totalMembersCount,
      totalFilesCount,
      issuedTransactionsCount,
      overdueTransactionsCount,
      pendingReservationsCount,
      categoriesWithCount,
      recentBooks,
      recentUsers,
      recentIssues,
      recentReturns,
      recentFiles,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.book.aggregate({
        _sum: {
          totalCopies: true,
          availableCopies: true,
        },
      }),
      prisma.member.count(),
      prisma.digitalFile.count(),
      prisma.bookTransaction.count({
        where: { status: { in: ['ISSUED', 'OVERDUE'] } },
      }),
      prisma.bookTransaction.count({
        where: { status: 'OVERDUE' },
      }),
      prisma.reservation.count({
        where: { status: 'PENDING' },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { books: true } },
        },
      }),
      prisma.book.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.bookTransaction.findMany({
        take: 5,
        where: { status: { in: ['ISSUED', 'OVERDUE'] } },
        orderBy: { issueDate: 'desc' },
        include: {
          book: { select: { title: true, coverImage: true } },
          member: { include: { user: { select: { name: true, email: true } } } },
        },
      }),
      prisma.bookTransaction.findMany({
        take: 5,
        where: { status: 'RETURNED' },
        orderBy: { returnDate: 'desc' },
        include: {
          book: { select: { title: true } },
          member: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.digitalFile.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { name: true } } },
      }),
    ]);

    const totalPhysicalCopies = totalCopiesAgg._sum.totalCopies || 0;
    const availablePhysicalCopies = totalCopiesAgg._sum.availableCopies || 0;
    const issuedPhysicalCopies = totalPhysicalCopies - availablePhysicalCopies;

    // Category distribution chart data
    const categoryChartData = categoriesWithCount.map((cat) => ({
      name: cat.name,
      value: cat._count.books,
    }));

    // Monthly issuance simulated / grouped from transactions
    const transactions = await prisma.bookTransaction.findMany({
      select: { issueDate: true, status: true },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthlyIssuanceMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      const mName = monthNames[d.getMonth()];
      monthlyIssuanceMap[mName] = { month: mName, issues: 0, returns: 0 };
    }

    transactions.forEach((tx) => {
      const mName = monthNames[new Date(tx.issueDate).getMonth()];
      if (monthlyIssuanceMap[mName]) {
        monthlyIssuanceMap[mName].issues += 1;
        if (tx.status === 'RETURNED') {
          monthlyIssuanceMap[mName].returns += 1;
        }
      }
    });

    const monthlyTrends = Object.values(monthlyIssuanceMap);

    // If Student: load student specific personal metrics
    let studentStats = null;
    if (isStudent && user.memberProfile?.id) {
      const memberId = user.memberProfile.id;
      const [myActiveLoans, myOverdue, myReservations, myFines] = await Promise.all([
        prisma.bookTransaction.findMany({
          where: {
            memberId,
            status: { in: ['ISSUED', 'OVERDUE'] },
          },
          include: { book: true },
        }),
        prisma.bookTransaction.count({
          where: { memberId, status: 'OVERDUE' },
        }),
        prisma.reservation.findMany({
          where: { memberId },
          include: { book: true },
          orderBy: { requestDate: 'desc' },
        }),
        prisma.fine.findMany({
          where: { memberId, status: 'UNPAID' },
        }),
      ]);

      const unpaidFinesTotal = myFines.reduce((sum, f) => sum + (f.amount || 0), 0);

      studentStats = {
        activeLoansCount: myActiveLoans.length,
        activeLoans: myActiveLoans,
        overdueCount: myOverdue,
        reservationsCount: myReservations.length,
        reservations: myReservations,
        unpaidFinesTotal,
      };
    }

    return NextResponse.json({
      metrics: {
        totalBooks: totalBooksCount,
        totalCopies: totalPhysicalCopies,
        availableCopies: availablePhysicalCopies,
        issuedCopies: issuedPhysicalCopies,
        totalMembers: totalMembersCount,
        totalFiles: totalFilesCount,
        issuedTransactions: issuedTransactionsCount,
        overdueTransactions: overdueTransactionsCount,
        pendingReservations: pendingReservationsCount,
      },
      charts: {
        categoryDistribution: categoryChartData,
        monthlyTrends,
        inventorySplit: [
          { name: 'Available Copies', value: availablePhysicalCopies, color: '#10b981' },
          { name: 'Issued Copies', value: issuedPhysicalCopies, color: '#2563eb' },
        ],
      },
      recentActivity: {
        recentBooks,
        recentUsers,
        recentIssues,
        recentReturns,
        recentFiles,
      },
      studentStats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
