import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface ModerationStats {
  pending_reports: number;
  total_reports_today: number;
  resolved_reports_today: number;
  average_resolution_time: number;
  active_users: number;
  flagged_content: number;
}

interface Report {
  id: number;
  reporter: {
    name: string;
    last_name: string;
    email: string;
  };
  reported_user?: {
    name: string;
    last_name: string;
    email: string;
  };
  reported_content_type: string;
  reason: string;
  description?: string;
  status: 'pendiente' | 'en_revista' | 'resuelto' | 'descartado' | 'sancionado';
  created_at: string;
  evidence_urls?: string[];
}

interface ActivityLog {
  id: number;
  user?: {
    name: string;
    last_name: string;
  };
  action: string;
  resource_type?: string;
  resource_id?: number;
  metadata?: Record<string, any>;
  created_at: string;
  ip_address?: string;
}

export default function ModeratorDashboard() {
  const { user, loading, hasAnyRole } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !hasAnyRole(['moderador', 'administrador'])) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      setStatsLoading(true);
      
      // Cargar estadísticas de moderación
      const statsResponse = await fetch('/api/moderator/stats');
      const statsData = await statsResponse.json();
      
      // Cargar reportes pendientes
      const reportsResponse = await fetch('/api/moderator/reports?status=pendiente&limit=10');
      const reportsData = await reportsResponse.json();
      
      // Cargar logs de actividad
      const logsResponse = await fetch('/api/moderator/activity?limit=20');
      const logsData = await logsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      
      if (reportsData.success) {
        setReports(reportsData.data);
      }
      
      if (logsData.success) {
        setActivityLogs(logsData.data);
      }
      
    } catch (error) {
      console.error('Error loading moderator data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleReportAction = async (reportId: number, action: 'resolve' | 'dismiss' | 'sanction', notes?: string) => {
    try {
      const response = await fetch(`/api/moderator/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes,
          reviewed_by: user?.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Recargar datos
        loadDashboardData();
        setShowReportModal(false);
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error processing report action:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_revista':
        return 'bg-blue-100 text-blue-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'descartado':
        return 'bg-gray-100 text-gray-800';
      case 'sancionado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: 'Usuario',
      course: 'Curso',
      lesson: 'Lección',
      review: 'Reseña',
      assignment: 'Tarea',
      comment: 'Comentario'
    };
    return labels[type] || type;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_login':
        return <UserGroupIcon className="w-4 h-4 text-green-500" />;
      case 'course_created':
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'content_reported':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'user_suspended':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ChartBarIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Moderador | Ajayu</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Panel de Moderación
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona reportes y mantiene la comunidad segura
                </p>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/moderator/reports"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Ver Todos los Reportes
                </Link>
                <Link
                  href="/moderator/activity"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Logs de Actividad
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas de moderación */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Reportes Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_reports}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Resueltos Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.resolved_reports_today}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(stats.average_resolution_time)}h
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Contenido Marcado</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.flagged_content}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reportes recientes */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Reportes Recientes</h2>
                    <Link
                      href="/moderator/reports"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Ver todos →
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {reports.length === 0 ? (
                    <div className="text-center py-8">
                      <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No hay reportes pendientes
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        La comunidad está funcionando bien
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                    report.status
                                  )}`}
                                >
                                  {report.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {getContentTypeLabel(report.reported_content_type)}
                                </span>
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">
                                {report.reason}
                              </h3>
                              {report.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {report.description}
                                </p>
                              )}
                              <div className="flex items-center text-xs text-gray-500 space-x-4">
                                <span>
                                  Reportado por: {report.reporter.name} {report.reporter.last_name}
                                </span>
                                {report.reported_user && (
                                  <span>
                                    Usuario: {report.reported_user.name} {report.reported_user.last_name}
                                  </span>
                                )}
                                <span>
                                  {new Date(report.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowReportModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                Revisar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Acciones rápidas */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                  <Link
                    href="/moderator/users"
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Gestionar Usuarios
                  </Link>
                  <Link
                    href="/moderator/content"
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Revisar Contenido
                  </Link>
                  <Link
                    href="/moderator/settings"
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Configuración
                  </Link>
                </div>
              </div>

              {/* Actividad reciente */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
                </div>
                <div className="p-6">
                  {activityLogs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay actividad reciente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activityLogs.slice(0, 8).map((log) => (
                        <div key={log.id} className="flex items-start space-x-3">
                          {getActionIcon(log.action)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{log.action}</p>
                            {log.user && (
                              <p className="text-xs text-gray-500">
                                {log.user.name} {log.user.last_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Alertas */}
              {stats && stats.pending_reports > 5 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Atención Requerida
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        Tienes {stats.pending_reports} reportes pendientes que requieren revisión.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para revisar reporte */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Revisar Reporte #{selectedReport.id}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Razón</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.reason}</p>
                </div>
                
                {selectedReport.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReport.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reportado por</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedReport.reporter.name} {selectedReport.reporter.last_name}
                    </p>
                  </div>
                  {selectedReport.reported_user && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Usuario reportado</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedReport.reported_user.name} {selectedReport.reported_user.last_name}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReportAction(selectedReport.id, 'descartar')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Descartar
                </button>
                <button
                  onClick={() => handleReportAction(selectedReport.id, 'sancionar')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Sancionar
                </button>
                <button
                  onClick={() => handleReportAction(selectedReport.id, 'resolver')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Resolver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}