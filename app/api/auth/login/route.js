import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, createSessionToken, buildSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';
import { logActivity } from '@/lib/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { memberProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email address or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is suspended or inactive. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email address or password' },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user);
    const cookie = buildSessionCookie(token);

    // Audit log
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: `User ${user.email} logged in successfully`,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status,
      memberProfile: user.memberProfile,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: safeUser,
    });

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}
