import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Please provide an email address' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // For security, still return generic success or friendly prompt
      return NextResponse.json({
        success: true,
        message: 'If that email exists in our records, a reset code has been generated.',
      });
    }

    // Generate a 6-digit verification code or token
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Setting or log
    await prisma.setting.upsert({
      where: { key: `RESET_${user.email}` },
      update: { value: resetCode },
      create: {
        key: `RESET_${user.email}`,
        value: resetCode,
        description: `Password reset verification code for ${user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset code generated. For demonstration purposes, your reset code is: ${resetCode}`,
      demoCode: resetCode,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
