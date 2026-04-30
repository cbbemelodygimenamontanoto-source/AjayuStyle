import { type ClassValue, clsx } from 'clsx';

// ========================================
// UTILIDADES DE CSS Y TAILWIND
// ========================================

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ========================================
// UTILIDADES DE FORMATEO
// ========================================

// Formatear fechas
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateShort = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatear números
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-ES').format(num);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Formatear texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const titleCase = (text: string): string => {
  return text
    .split(' ')
    .map(word => capitalizeFirst(word.toLowerCase()))
    .join(' ');
};

// ========================================
// UTILIDADES DE VALIDACIÓN
// ========================================

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ========================================
// UTILIDADES DE ARRAYS Y OBJETOS
// ========================================

export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// ========================================
// UTILIDADES DE FECHA Y TIEMPO
// ========================================

export const daysAgo = (date: Date | string): number => {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now.getTime() - past.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const hoursAgo = (date: Date | string): number => {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now.getTime() - past.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60));
};

export const minutesAgo = (date: Date | string): number => {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now.getTime() - past.getTime());
  return Math.ceil(diffTime / (1000 * 60));
};

export const timeAgo = (date: Date | string): string => {
  const minutes = minutesAgo(date);
  const hours = hoursAgo(date);
  const days = daysAgo(date);
  
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 30) return `hace ${days}d`;
  
  return formatDate(date);
};

// ========================================
// UTILIDADES DE STORAGE
// ========================================

export const getFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

export const setToStorage = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

export const removeFromStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

export const clearStorage = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.clear();
};

// ========================================
// UTILIDADES DE MÓDULOS
// ========================================

export const getModuleName = (moduleId: string): string => {
  const moduleNames: Record<string, string> = {
    cursos: 'Cursos',
    ia: 'Inteligencia Artificial',
    avatares: 'Avatares',
    social: 'Red Social',
  };
  return moduleNames[moduleId] || moduleId;
};

export const getModuleColor = (moduleId: string): string => {
  const colors: Record<string, string> = {
    cursos: 'text-blue-600',
    ia: 'text-purple-600',
    avatares: 'text-pink-600',
    social: 'text-green-600',
  };
  return colors[moduleId] || 'text-neutral-600';
};

export const isModuleOptional = (moduleId: string): boolean => {
  return moduleId === 'social';
};

// ========================================
// UTILIDADES DE PAGINACIÓN
// ========================================

export const calculatePagination = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

export const getPageNumbers = (currentPage: number, totalPages: number): number[] => {
  const pages: number[] = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }
  
  return pages;
};

// ========================================
// UTILIDADES DE ERRORES
// ========================================

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Ha ocurrido un error desconocido';
};

export const isApiError = (error: any): error is { message: string; status?: number } => {
  return error && typeof error.message === 'string';
};

// ========================================
// EXPORTACIONES
// ========================================

export default {
  cn,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  truncateText,
  capitalizeFirst,
  titleCase,
  isEmpty,
  isEmail,
  isValidUrl,
  groupBy,
  sortBy,
  unique,
  chunk,
  daysAgo,
  hoursAgo,
  minutesAgo,
  timeAgo,
  getFromStorage,
  setToStorage,
  removeFromStorage,
  clearStorage,
  getModuleName,
  getModuleColor,
  isModuleOptional,
  calculatePagination,
  getPageNumbers,
  getErrorMessage,
  isApiError,
};