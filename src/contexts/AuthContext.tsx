import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserWithRoles } from '@/types';

interface AuthContextType {
  user: UserWithRoles | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  getPrimaryRole: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('ajayu_token');
        if (token) {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            localStorage.removeItem('ajayu_token');
          }
        }
      } catch (error) {
        console.error('Error verifying auth:', error);
        localStorage.removeItem('ajayu_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ajayu_token', data.token);
        localStorage.setItem('ajayu_user', JSON.stringify(data.user)); // Guardar datos del usuario
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ajayu_token', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('ajayu_token');
    localStorage.removeItem('ajayu_user'); // Limpiar datos del usuario
    setUser(null);
  };

  // Función helper para verificar si el usuario tiene un rol específico
  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.name === roleName);
  };

  // Función helper para verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => roleNames.includes(role.name));
  };

  // Función helper para obtener el rol principal del usuario
  const getPrimaryRole = (): string | null => {
    if (!user || !user.roles || user.roles.length === 0) return null;
    return user.roles[0].name;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading, 
      hasRole, 
      hasAnyRole, 
      getPrimaryRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
