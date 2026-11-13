import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function PUT(request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          name: body.name ? body.name.trim() : user.name,
          avatar: body.avatar !== undefined ? body.avatar : user.avatar,
        },
      });

      if (user.memberProfile?.id) {
        await tx.member.update({
          where: { id: user.memberProfile.id },
          data: {
            phone: body.phone !== undefined ? body.phone : user.memberProfile.phone,
            address: body.address !== undefined ? body.address : user.memberProfile.address,
          },
        });
      }

      return u;
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entity: 'Profile',
      entityId: user.id,
      details: 'Updated profile information',
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
