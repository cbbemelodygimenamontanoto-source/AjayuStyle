import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  Filter,
  BarChart3,
  Clock,
  User,
  FileText,
  MessageCircle,
  UserCircle,
  Loader2,
  Check,
  X,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

interface Report {
  id: number;
  type: 'post' | 'review' | 'profile';
  targetId: number;
  reporterId: number;
  reporterName: string;
  reporterUsername: string;
  reportedUserId: number;
  reportedUserName: string;
  reportedUserUsername: string;
  reason: string;
  reasonLabel: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  resolution: string | null;
}

interface Stats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  byType: {
    post: number;
    review: number;
    profile: number;
  };
}

export default function ModerationPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{id: number, role: string, name: string} | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'post' | 'review' | 'profile'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<'dismiss' | 'delete' | 'warn'>('dismiss');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Verificar permisos de acceso
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== 'administrador' && user.role !== 'moderador') {
          alert('No tienes permisos para acceder a este panel');
          router.push('/comunidad/feed');
          return;
        }
        setCurrentUser({ id: user.id, role: user.role, name: user.name || 'Usuario' });
      } catch (e) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Cargar reportes simulados
  useEffect(() => {
    if (!currentUser) return;

    const mockReports: Report[] = [
      {
        id: 1,
        type: 'post',
        targetId: 101,
        reporterId: 5,
        reporterName: 'Maria Garcia',
        reporterUsername: 'maria_creativa',
        reportedUserId: 8,
        reportedUserName: 'Juan Lopez',
        reportedUserUsername: 'juan_designer',
        reason: 'spam',
        reasonLabel: 'Contenido spam o publicidad',
        description: 'Este usuario esta publicando enlaces de spam constantemente',
        status: 'pending',
        createdAt: '2026-05-05T14:30:00Z',
        reviewedAt: null,
        reviewedBy: null,
        resolution: null
      },
      {
        id: 2,
        type: 'review',
        targetId: 201,
        reporterId: 12,
        reporterName: 'Carlos Mendez',
        reporterUsername: 'carlos_styles',
        reportedUserId: 15,
        reportedUserName: 'Ana Rodriguez',
        reportedUserUsername: 'ana_fashion',
        reason: 'inapropiado',
        reasonLabel: 'Contenido inapropiado',
        description: 'Esta resena contiene lenguaje ofensivo e inapropiado',
        status: 'pending',
        createdAt: '2026-05-05T12:15:00Z',
        reviewedAt: null,
        reviewedBy: null,
        resolution: null
      },
      {
        id: 3,
        type: 'profile',
        targetId: 301,
        reporterId: 20,
        reporterName: 'Pedro Sanchez',
        reporterUsername: 'pedro_art',
        reportedUserId: 25,
        reportedUserName: 'Lucia Fernandez',
        reportedUserUsername: 'lucia_design',
        reason: 'informacion_falsa',
        reasonLabel: 'Informacion falsa',
        description: 'Este perfil tiene informacion de contacto falsa',
        status: 'pending',
        createdAt: '2026-05-04T18:45:00Z',
        reviewedAt: null,
        reviewedBy: null,
        resolution: null
      },
      {
        id: 4,
        type: 'post',
        targetId: 102,
        reporterId: 18,
        reporterName: 'Elena Torres',
        reporterUsername: 'elena_makeup',
        reportedUserId: 30,
        reportedUserName: 'Roberto Castro',
        reportedUserUsername: 'roberto_moda',
        reason: 'acoso',
        reasonLabel: 'Acoso o intimidacion',
        description: 'El usuario esta acosando a otros miembros de la comunidad',
        status: 'pending',
        createdAt: '2026-05-04T09:20:00Z',
        reviewedAt: null,
        reviewedBy: null,
        resolution: null
      },
      {
        id: 5,
        type: 'review',
        targetId: 202,
        reporterId: 35,
        reporterName: 'Sofia Vargas',
        reporterUsername: 'sofia_vibes',
        reportedUserId: 40,
        reportedUserName: 'Diego Morales',
        reportedUserUsername: 'diego_style',
        reason: 'spam',
        reasonLabel: 'Contenido spam o publicidad',
        description: 'Resena con enlaces promocionales no autorizados',
        status: 'reviewed',
        createdAt: '2026-05-03T16:00:00Z',
        reviewedAt: '2026-05-04T10:30:00Z',
        reviewedBy: 'Admin Sistema',
        resolution: 'Contenido verificado, parece ser legitimo'
      },
      {
        id: 6,
        type: 'post',
        targetId: 103,
        reporterId: 45,
        reporterName: 'Miguel Herrera',
        reporterUsername: 'miguel_photo',
        reportedUserId: 50,
        reportedUserName: 'Carmen Luna',
        reportedUserUsername: 'carmen_art',
        reason: 'inapropiado',
        reasonLabel: 'Contenido inapropiado',
        description: 'Publicacion con imagenes no apropiadas',
        status: 'resolved',
        createdAt: '2026-05-02T11:30:00Z',
        reviewedAt: '2026-05-03T14:00:00Z',
        reviewedBy: 'Moderador Juan',
        resolution: 'Contenido eliminado, usuario marcado'
      }
    ];

    setReports(mockReports);
    
    // Calcular estadisticas
    const statsData: Stats = {
      total: mockReports.length,
      pending: mockReports.filter(r => r.status === 'pending').length,
      reviewed: mockReports.filter(r => r.status === 'reviewed').length,
      resolved: mockReports.filter(r => r.status === 'resolved').length,
      byType: {
        post: mockReports.filter(r => r.type === 'post').length,
        review: mockReports.filter(r => r.type === 'review').length,
        profile: mockReports.filter(r => r.type === 'profile').length
      }
    };
    setStats(statsData);
    setLoading(false);
  }, [currentUser]);

  // Filtrar reportes
  useEffect(() => {
    let filtered = [...reports];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    setFilteredReports(filtered);
  }, [reports, filterType, filterStatus]);

  const handleResolveReport = async () => {
    if (!selectedReport || !resolutionNotes.trim()) {
      alert('Por favor ingresa notas de resolucion');
      return;
    }

    setProcessing(true);
    
    // Simular procesamiento
    setTimeout(() => {
      const updatedReports = reports.map(r => {
        if (r.id === selectedReport.id) {
          return {
            ...r,
            status: resolutionAction === 'dismiss' ? 'reviewed' : 'resolved',
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUser?.name || 'Admin',
            resolution: resolutionNotes
          };
        }
        return r;
      });
      
      setReports(updatedReports);
      setShowResolutionModal(false);
      setSelectedReport(null);
      setResolutionNotes('');
      setResolutionAction('dismiss');
      setProcessing(false);
      
      // Actualizar estadisticas
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          pending: updatedReports.filter(r => r.status === 'pending').length,
          reviewed: updatedReports.filter(r => r.status === 'reviewed').length,
          resolved: updatedReports.filter(r => r.status === 'resolved').length
        };
      });
    }, 1000);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `Hace ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return 'Hace poco';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4" />;
      case 'review': return <MessageCircle className="w-4 h-4" />;
      case 'profile': return <UserCircle className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'reviewed':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Revisado
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Resuelto
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Verificando permisos...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Panel de Moderacion - Comunidad Ajayu</title>
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
              <div className="ml-auto flex items-center gap-3">
                <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {currentUser.role === 'administrador' ? 'Administrador' : 'Moderador'}
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Moderacion</h1>
            <p className="text-gray-600">Gestiona los reportes de la comunidad y mantiene un entorno seguro</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Total</span>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Pendientes</span>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Revisados</span>
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats.reviewed}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Resueltos</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 text-sm font-medium">Filtrar:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Filter by Type */}
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="appearance-none bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="post">Publicaciones</option>
                    <option value="review">Resenas</option>
                    <option value="profile">Perfiles</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Filter by Status */}
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="appearance-none bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="reviewed">Revisados</option>
                    <option value="resolved">Resueltos</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="ml-auto text-sm text-gray-500">
                {filteredReports.length} reporte{filteredReports.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay reportes que coincidan con los filtros</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={`bg-white rounded-xl border ${
                    report.status === 'pending' ? 'border-yellow-200' : 'border-gray-200'
                  } overflow-hidden`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          report.type === 'post' ? 'bg-blue-100 text-blue-600' :
                          report.type === 'review' ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {getTypeIcon(report.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 capitalize">
                              {report.type === 'post' ? 'Publicacion' : report.type === 'review' ? 'Resena' : 'Perfil'} #{report.targetId}
                            </span>
                            {getStatusBadge(report.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Reportado hace {formatTimeAgo(report.createdAt)}
                          </p>
                        </div>
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setResolutionAction('dismiss');
                              setShowResolutionModal(true);
                            }}
                            className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setResolutionAction('delete');
                              setShowResolutionModal(true);
                            }}
                            className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Report Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Reportado por</p>
                          <p className="text-sm font-medium text-gray-900">{report.reporterName}</p>
                          <p className="text-xs text-gray-500">@{report.reporterUsername}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Usuario reportado</p>
                          <p className="text-sm font-medium text-gray-900">{report.reportedUserName}</p>
                          <p className="text-xs text-gray-500">@{report.reportedUserUsername}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-gray-900">{report.reasonLabel}</span>
                        </div>
                        <p className="text-sm text-gray-700">{report.description}</p>
                      </div>

                      {report.status !== 'pending' && report.resolution && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <p className="text-xs text-gray-500 mb-1">Resolucion</p>
                          <p className="text-sm text-gray-700 mb-1">{report.resolution}</p>
                          <p className="text-xs text-gray-500">
                            Revisado por {report.reviewedBy} - {formatTimeAgo(report.reviewedAt!)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions for resolved/reviewed */}
                    {report.status !== 'pending' && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <Link
                          href={`/comunidad/perfil/${report.reportedUserId}`}
                          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                        >
                          Ver perfil del usuario
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setResolutionAction('dismiss');
                            setShowResolutionModal(true);
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Editar resolucion
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-pink-500" />
                Resolver Reporte
              </h3>
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setSelectedReport(null);
                  setResolutionNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accion a tomar</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="action"
                      checked={resolutionAction === 'dismiss'}
                      onChange={() => setResolutionAction('dismiss')}
                      className="w-4 h-4 text-pink-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Dismiss</p>
                      <p className="text-sm text-gray-500">El contenido es valido, se marca como revisado</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="action"
                      checked={resolutionAction === 'delete'}
                      onChange={() => setResolutionAction('delete')}
                      className="w-4 h-4 text-pink-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Eliminar contenido</p>
                      <p className="text-sm text-gray-500">Se eliminara el contenido reportado</p>
                    </div>
                  </label>
                  {currentUser?.role === 'administrador' && (
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="action"
                        checked={resolutionAction === 'warn'}
                        onChange={() => setResolutionAction('warn')}
                        className="w-4 h-4 text-pink-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Advertir usuario</p>
                        <p className="text-sm text-gray-500">Enviar advertencia al usuario</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas de resolucion</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe las razones de tu decision..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setSelectedReport(null);
                    setResolutionNotes('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResolveReport}
                  disabled={processing || !resolutionNotes.trim()}
                  className="flex-1 bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}