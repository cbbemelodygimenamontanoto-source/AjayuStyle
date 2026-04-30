import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface UserWithRole {
  id: number;
  name: string;
  email: string;
  roles: Array<{
    id: number;
    name: 'normal' | 'instructor' | 'moderador' | 'administrador';
    description: string;
    permissions: any;
  }>;
  created_at: string;
  last_login?: string;
}

interface AdminStats {
  total_users: number;
  total_instructors: number;
  total_students: number;
  total_courses: number;
  total_revenue: number;
}

const getUserPrimaryRole = (user: UserWithRole): string => {
  if (!user.roles || user.roles.length === 0) return 'normal';
  return user.roles[0].name;
};

const getRoleBadgeColor = (roleName: string): string => {
  switch (roleName) {
    case 'administrador': return 'bg-red-100 text-red-800';
    case 'instructor': return 'bg-blue-100 text-blue-800';
    case 'moderador': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRoleLabel = (roleName: string): string => {
  switch (roleName) {
    case 'administrador': return 'Administrador';
    case 'instructor': return 'Instructor';
    case 'moderador': return 'Moderador';
    default: return 'Normal';
  }
};

export default function AdminDashboard() {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<number | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !hasRole('administrador')) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadAdminData();
    }
  }, [user, loading]);

  const loadAdminData = async () => {
    try {
      setLoadingUsers(true);
      
      // Obtener token de autenticación
      const token = localStorage.getItem('ajayu_token');
      if (!token) {
        throw new Error('Sesión no válida. Por favor, inicie sesión nuevamente.');
      }

      // Llamar a la API route para obtener datos del dashboard
      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setUsers(result.users || []);
        setStats(result.stats);
      } else {
        throw new Error(result.message || 'Error obteniendo datos del dashboard');
      }

    } catch (error) {
      console.error('Error cargando datos de administración:', error);
      
      // Mostrar mensaje útil al usuario
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('connect'))) {
        alert('❌ Error de conexión a la base de datos. Verifica que MySQL esté ejecutándose.');
      } else if (error instanceof Error && error.message.includes('ER_ACCESS_DENIED')) {
        alert('❌ Error de credenciales. Verifica la configuración de la base de datos.');
      } else if (error instanceof Error && error.message.includes('ER_BAD_DB_ERROR')) {
        alert('❌ Base de datos no encontrada. Verifica que la base de datos "ajayu_db" exista.');
      } else if (error instanceof Error && error.message.includes('Net.connect is not a function')) {
        alert('❌ Error de configuración. MySQL2 debe usarse solo del lado del servidor.');
      } else {
        alert('❌ Error cargando datos de administración. Revisa la consola para más detalles.');
      }
      
      // Limpiar datos para evitar mostrar información incorrecta
      setUsers([]);
      setStats({
        total_users: 0,
        total_instructors: 0,
        total_students: 0,
        total_courses: 0,
        total_revenue: 0
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleUpdate = async (userId: number, newRole: string) => {
    setUpdatingRole(userId);
    
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem('ajayu_token');
      if (!token) {
        throw new Error('Sesión no válida. Por favor, inicie sesión nuevamente.');
      }

      // Llamar a la API route para actualizar el rol
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          newRole
        })
      });

      const result = await response.json();

      if (result.success) {
        await loadAdminData();
        alert('Rol actualizado exitosamente');
      } else {
        alert(result.message || 'Error al actualizar el rol');
      }
    } catch (error) {
      console.error('Error actualizando rol:', error);
      
      // Mostrar mensaje útil al usuario
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('connect'))) {
        alert('❌ Error de conexión a la base de datos. Verifica que MySQL esté ejecutándose.');
      } else if (error instanceof Error && error.message.includes('ER_ACCESS_DENIED')) {
        alert('❌ Error de credenciales. Verifica la configuración de la base de datos.');
      } else if (error instanceof Error && error.message.includes('ER_BAD_DB_ERROR')) {
        alert('❌ Base de datos no encontrada. Verifica que la base de datos "ajayu_db" exista.');
      } else {
        alert('❌ Error al actualizar el rol. Revisa la consola para más detalles.');
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'moderador':
        return 'bg-purple-100 text-purple-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'normal':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'moderador':
        return 'Moderador';
      case 'instructor':
        return 'Instructor';
      case 'normal':
      default:
        return 'Estudiante';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Panel de Administración - Ajayu</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Panel de Administración
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Bienvenido, {user?.name}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/instructor-dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Ver Dashboard Instructor
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Dashboard Principal
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas Generales */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.total_users}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Instructores</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.total_instructors}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Estudiantes</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.total_students}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.total_courses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.total_revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gestión de Usuarios */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Gestión de Usuarios ({users.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Actividad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(getUserPrimaryRole(user))}`}>
                          {getRoleLabel(getUserPrimaryRole(user))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? formatDate(user.last_login) : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <select
                            value={getUserPrimaryRole(user)}
                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                            disabled={updatingRole === user.id || user.id === 1} // No permitir cambiar el rol del primer usuario (admin por defecto)
                            className={`text-sm border border-gray-300 rounded px-2 py-1 ${
                              user.id === 1 ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="normal">Estudiante</option>
                            <option value="instructor">Instructor</option>
                            <option value="moderador">Moderador</option>
                            <option value="administrador">Administrador</option>
                          </select>
                          {updatingRole === user.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay usuarios registrados
                </h3>
                <p className="text-gray-600">
                  Los usuarios aparecerán aquí cuando se registren en la plataforma
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}