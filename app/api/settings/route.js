export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: { not: { startsWith: 'RESET_' } },
      },
    });

    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ settings: settingsMap, raw: settings });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAuth(request, ['ADMIN']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json(); // key-value dictionary

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string' || typeof value === 'number') {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    await logActivity({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'Setting',
      details: 'Updated system parameters and borrowing rules',
    });

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
