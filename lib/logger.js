import prisma from './prisma';

export async function logActivity({
  userId = null,
  action,
  entity,
  entityId = null,
  details = null,
  ipAddress = null,
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
    return null;
  }
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  link = null,
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

// Notify all admins and librarians
export async function notifyStaff({ title, message, type = 'INFO', link = null }) {
  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'LIBRARIAN'] },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const notifications = staffUsers.map((staff) => ({
      userId: staff.id,
      title,
      message,
      type,
      link,
    }));

    if (notifications.length > 0) {
      return await prisma.notification.createMany({
        data: notifications,
      });
    }
  } catch (err) {
    console.error('Failed to notify staff:', err);
  }
}
