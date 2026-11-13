import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function POST(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN', 'LIBRARIAN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Please select a CSV file to upload' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have a header row and at least one data row' }, { status: 400 });
    }

    // Simple CSV line parser supporting quoted fields
    const parseCsvLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1);

    // Map column indices
    const titleIdx = header.findIndex((h) => h.includes('title'));
    const authorIdx = header.findIndex((h) => h.includes('author'));
    const isbnIdx = header.findIndex((h) => h.includes('isbn'));
    const pubIdx = header.findIndex((h) => h.includes('publisher'));
    const yearIdx = header.findIndex((h) => h.includes('year'));
    const catIdx = header.findIndex((h) => h.includes('category'));
    const copiesIdx = header.findIndex((h) => h.includes('copies') || h.includes('total'));
    const shelfIdx = header.findIndex((h) => h.includes('shelf'));

    if (titleIdx === -1 || authorIdx === -1 || isbnIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must include at least "Title", "Author", and "ISBN" columns.' },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Preload categories
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const values = parseCsvLine(rows[i]);
      const title = values[titleIdx];
      const author = values[authorIdx];
      const isbn = values[isbnIdx];

      if (!title || !author || !isbn) {
        skippedCount++;
        continue;
      }

      const publisher = (pubIdx !== -1 && values[pubIdx]) || 'Academic Press';
      const pubYear = (yearIdx !== -1 && parseInt(values[yearIdx], 10)) || new Date().getFullYear();
      const rawCat = (catIdx !== -1 && values[catIdx]) || 'General Reference';
      const totalCopies = (copiesIdx !== -1 && parseInt(values[copiesIdx], 10)) || 3;
      const shelfNumber = (shelfIdx !== -1 && values[shelfIdx]) || null;

      try {
        // Resolve or create category
        let categoryId = categoryMap.get(rawCat.toLowerCase());
        if (!categoryId) {
          const newCat = await prisma.category.create({
            data: {
              name: rawCat,
              slug: rawCat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            },
          });
          categoryMap.set(rawCat.toLowerCase(), newCat.id);
          categoryId = newCat.id;
        }

        // Upsert book by ISBN
        await prisma.book.upsert({
          where: { isbn },
          update: {
            title,
            author,
            publisher,
            pubYear,
            categoryId,
            shelfNumber,
          },
          create: {
            title,
            author,
            isbn,
            publisher,
            pubYear,
            categoryId,
            totalCopies,
            availableCopies: totalCopies,
            shelfNumber,
          },
        });

        importedCount++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
        skippedCount++;
      }
    }

    await logActivity({
      userId: auth.user.id,
      action: 'IMPORT',
      entity: 'Book',
      details: `Bulk imported ${importedCount} books from CSV (${skippedCount} skipped)`,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed CSV: ${importedCount} imported/updated, ${skippedCount} skipped.`,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    console.error('Import CSV error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import CSV' }, { status: 500 });
  }
}
