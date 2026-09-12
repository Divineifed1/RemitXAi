import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, insertNotification } from '@/lib/supabase-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(userId, limit),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, userId, actionUrl, metadata } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Title, message, and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['incoming', 'insight', 'warning', 'transaction'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const notification = await insertNotification({
      title,
      message,
      type,
      userId,
      actionUrl,
      metadata,
    });

    return NextResponse.json(
      {
        success: true,
        notification,
        message: 'Notification created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;

    if (action === 'mark_read' && id !== undefined) {
      const success = await markNotificationRead(id);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark notification as read' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_read') {
      const success = await markAllNotificationsRead(body.userId);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark all notifications as read' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "mark_read" with id, or "mark_all_read"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
