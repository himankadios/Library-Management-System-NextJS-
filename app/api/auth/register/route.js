import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createSessionToken, buildSessionCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';
import { logActivity, notifyStaff } from '@/lib/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, email, password, role, department, course, rollNumber, phone } = validated.data;
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole = role || 'STUDENT';

    // Transaction to create User and Member profile if Student
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: assignedRole,
          status: 'ACTIVE',
        },
      });

      let memberProfile = null;
      if (assignedRole === 'STUDENT') {
        const cleanRoll = rollNumber?.trim() || `ROLL-${Date.now().toString().slice(-6)}`;
        memberProfile = await tx.member.create({
          data: {
            userId: newUser.id,
            rollNumber: cleanRoll,
            regNumber: `REG-${Date.now().toString().slice(-6)}`,
            department: department || 'General Studies',
            course: course || 'Undergraduate',
            phone: phone || null,
            maxBooksAllowed: 4,
            status: 'ACTIVE',
          },
        });
      }

      return { user: newUser, memberProfile };
    });

    const token = await createSessionToken({ ...result.user, memberProfile: result.memberProfile });
    const cookie = buildSessionCookie(token);

    // Activity log & staff notification
    await logActivity({
      userId: result.user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: result.user.id,
      details: `New ${assignedRole} account created for ${result.user.email}`,
    });

    await notifyStaff({
      title: 'New Member Registered',
      message: `${name} has registered as a new library member (${assignedRole}).`,
      type: 'INFO',
      link: '/dashboard/members',
    });

    const safeUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      memberProfile: result.memberProfile,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Account registered successfully',
      user: safeUser,
    });

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
