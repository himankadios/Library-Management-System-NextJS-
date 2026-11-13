import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import prisma from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-jwt-token-library-digital-system-key-2026-secure-session'
);

const COOKIE_NAME = 'library_session';

export async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}

export async function comparePassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

export async function createSessionToken(user) {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    memberId: user.memberProfile?.id || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...v] = c.trim().split('=');
      return [key, decodeURIComponent(v.join('='))];
    })
  );
}

export async function getSessionUser(request) {
  try {
    const cookieHeader = request?.headers?.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.id) return null;

    // Fetch fresh user from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        memberProfile: {
          select: {
            id: true,
            rollNumber: true,
            regNumber: true,
            department: true,
            course: true,
            phone: true,
            maxBooksAllowed: true,
            status: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;
    return user;
  } catch (err) {
    console.error('getSessionUser error:', err);
    return null;
  }
}

export async function requireAuth(request, allowedRoles = []) {
  const user = await getSessionUser(request);
  if (!user) {
    return { user: null, error: 'Unauthorized: Please log in', status: 401 };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { user, error: 'Forbidden: Insufficient permissions', status: 403 };
  }

  return { user, error: null, status: 200 };
}

export function buildSessionCookie(token, maxAgeSeconds = 7 * 24 * 60 * 60) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

export function buildClearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
