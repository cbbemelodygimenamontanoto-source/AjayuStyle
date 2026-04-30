import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Course {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  thumbnail?: string;
  price: number;
  is_free: boolean;
  difficulty_level: 'principiante' | 'intermedio' | 'avanzado';
  estimated_hours: number;
  rating_average: number;
  rating_count: number;
  enrollment_count: number;
  instructor: {
    name: string;
    last_name: string;
    avatar?: string;
  };
  category: {
    name: string;
    slug: string;
  };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  courses_count: number;
}

interface Filters {
  category?: string;
  difficulty_level?: string;
  price?: 'free' | 'paid' | 'all';
  sort_by?: 'newest' | 'popular' | 'rating' | 'price';
  search?: string;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<Filters>({
    sort_by: 'popular',
    price: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [filters, pagination.page]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await fetch(`/api/courses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm === '' ? undefined : searchTerm
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      sort_by: 'popular',
      price: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'principiante':
        return 'bg-green-100 text-green-800';
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800';
      case 'avanzado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    const labels: Record<string, string> = {
      principiante: 'Principiante',
      intermedio: 'Intermedio',
      avanzado: 'Avanzado'
    };
    return labels[level] || level;
  };

  const formatPrice = (price: number, isFree: boolean) => {
    if (isFree || price === 0) {
      return 'Gratis';
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <>
      <Head>
        <title>Cursos | Ajayu</title>
        <meta name="description" content="Explora nuestro catálogo de cursos y aprende nuevas habilidades" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Explora Nuestros Cursos
              </h1>
              <p className="text-gray-600 mt-2">
                Descubre cursos diseñados para impulsar tu carrera profesional
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar de filtros */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <FunnelIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  {/* Búsqueda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar cursos
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Escribe para buscar..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Categorías */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name} ({category.courses_count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nivel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nivel
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.difficulty_level || ''}
                      onChange={(e) => handleFilterChange('difficulty_level', e.target.value)}
                    >
                      <option value="">Todos los niveles</option>
                      <option value="principiante">Principiante</option>
                      <option value="intermedio">Intermedio</option>
                      <option value="avanzado">Avanzado</option>
                    </select>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.price || 'all'}
                      onChange={(e) => handleFilterChange('price', e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="free">Gratis</option>
                      <option value="paid">De pago</option>
                    </select>
                  </div>

                  {/* Ordenar por */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordenar por
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.sort_by || 'popular'}
                      onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    >
                      <option value="popular">Más populares</option>
                      <option value="newest">Más recientes</option>
                      <option value="rating">Mejor calificados</option>
                      <option value="price">Precio</option>
                    </select>
                  </div>

                  {/* Limpiar filtros */}
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de cursos */}
            <div className="flex-1">
              {/* Resultados y paginación */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  {loading ? 'Cargando...' : `${pagination.total} cursos encontrados`}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1 || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm">
                    {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>

              {/* Grid de cursos */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                      <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No se encontraron cursos
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Intenta ajustar tus filtros de búsqueda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                    >
                      <Link href={`/courses/${course.id}`}>
                        <div className="cursor-pointer">
                          {course.thumbnail ? (
                            <img
                              className="w-full h-48 object-cover rounded-t-lg"
                              src={course.thumbnail}
                              alt={course.title}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <BookOpenIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                                  course.difficulty_level
                                )}`}
                              >
                                {getDifficultyLabel(course.difficulty_level)}
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {formatPrice(course.price, course.is_free)}
                              </span>
                            </div>
                            
                            <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                              {course.title}
                            </h3>
                            
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                              {course.short_description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <StarIcon className="w-4 h-4 text-yellow-400" />
                                <span>{course.rating_average.toFixed(1)}</span>
                                <span>({course.rating_count})</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{course.estimated_hours}h</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <UserGroupIcon className="w-4 h-4" />
                                <span>{course.enrollment_count}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              {course.instructor.avatar ? (
                                <img
                                  className="w-8 h-8 rounded-full mr-3"
                                  src={course.instructor.avatar}
                                  alt={`${course.instructor.name} ${course.instructor.last_name}`}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                                  <span className="text-xs text-gray-600">
                                    {course.instructor.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {course.instructor.name} {course.instructor.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{course.category.name}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}