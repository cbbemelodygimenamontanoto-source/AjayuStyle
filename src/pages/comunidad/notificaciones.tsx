import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Heart,
  UserPlus,
  Star,
  Share2,
  Check,
  Trash2,
  Loader2
} from 'lucide-react';

interface Notification {
  id: number;
  type: 'like' | 'follow' | 'review' | 'share';
  message: string;
  fromUser: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    // Verificar autenticacion
    const token = localStorage.getItem('ajayu_token');
    if (!token) {
      router.push('/comunidad');
      return;
    }

    // Mock data de notificaciones
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'like',
        message: 'le gusto tu publicacion',
        fromUser: {
          id: 2,
          name: 'Carlos Perez',
          username: 'carlos_instructor',
          avatar: null
        },
        targetId: 1,
        isRead: false,
        createdAt: '2026-05-04T10:30:00Z'
      },
      {
        id: 2,
        type: 'follow',
        message: 'comenzo a seguirte',
        fromUser: {
          id: 3,
          name: 'Sofia Ramirez',
          username: 'sofia_social',
          avatar: null
        },
        targetId: null,
        isRead: false,
        createdAt: '2026-05-04T09:15:00Z'
      },
      {
        id: 3,
        type: 'review',
        message: 'te dejo una resena de 5 estrellas',
        fromUser: {
          id: 4,
          name: 'Ana Garcia',
          username: 'ana_normal',
          avatar: null
        },
        targetId: null,
        isRead: true,
        createdAt: '2026-05-04T08:00:00Z'
      },
      {
        id: 4,
        type: 'share',
        message: 'compartio tu publicacion',
        fromUser: {
          id: 5,
          name: 'Laura Martinez',
          username: 'laura_mod',
          avatar: null
        },
        targetId: 1,
        isRead: true,
        createdAt: '2026-05-03T16:30:00Z'
      },
      {
        id: 5,
        type: 'like',
        message: 'le gusto tu publicacion',
        fromUser: {
          id: 6,
          name: 'Miguel Torres',
          username: 'miguel_admin',
          avatar: null
        },
        targetId: 2,
        isRead: true,
        createdAt: '2026-05-03T12:00:00Z'
      }
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  }, [router]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500 fill-current" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-violet-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500 fill-current" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace un momento';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${Math.floor(diffHours / 24)}d`;
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(notifications.map(n => {
      if (n.id === notificationId) {
        return { ...n, isRead: true };
      }
      return n;
    }));
  };

  const markAllAsRead = () => {
    setMarkingAllRead(true);
    setTimeout(() => {
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setMarkingAllRead(false);
    }, 500);
  };

  const deleteNotification = (notificationId: number) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Notificaciones - Comunidad Ajayu</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/comunidad/feed" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver al feed</span>
              </Link>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold text-gray-900">Notificaciones</h1>
              </div>
              <div className="w-24" />
            </div>
          </div>
        </nav>

        {/* Notifications List */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-500">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leidas'}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAllRead}
                className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium transition-colors disabled:opacity-50"
              >
                {markingAllRead ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Marcar todas como leidas
              </button>
            )}
          </div>

          {/* Notifications */}
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay notificaciones</h3>
              <p className="text-gray-500">Cuando recibas notificacciones, las veremos aqui</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-violet-50/30' : ''
                  } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Link href={`/comunidad/perfil/${notification.fromUser.id}`}>
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {notification.fromUser.avatar ? (
                          <img
                            src={notification.fromUser.avatar}
                            alt={notification.fromUser.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {notification.fromUser.name[0]}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-gray-900">
                            <Link
                              href={`/comunidad/perfil/${notification.fromUser.id}`}
                              className="font-semibold hover:underline"
                            >
                              {notification.fromUser.name}
                            </Link>
                            {' '}
                            <span className="text-gray-500">{notification.message}</span>
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Icon */}
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                title="Marcar como leida"
                              >
                                <Check className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
