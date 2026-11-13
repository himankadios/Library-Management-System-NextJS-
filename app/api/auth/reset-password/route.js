import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const storedSetting = await prisma.setting.findUnique({
      where: { key: `RESET_${cleanEmail}` },
    });

    if (!storedSetting || storedSetting.value !== code.trim()) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete token
    await prisma.setting.delete({
      where: { key: `RESET_${cleanEmail}` },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      details: 'Password was successfully reset using verification code.',
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
