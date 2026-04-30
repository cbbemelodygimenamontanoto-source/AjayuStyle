import React, { createContext, useContext, useEffect, useState } from 'react';
import { SimpleUser, SimpleAuthContextType, SimpleLoginCredentials, SimpleRegisterData } from '@/types/simple-types';

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
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
            const data = await response.json();
            setUser(data.user);
          } else {
            localStorage.removeItem('ajayu_token');
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
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
        body: JSON.stringify({ email, password } as SimpleLoginCredentials)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ajayu_token', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error de login:', error);
      return false;
    }
  };

  const register = async (userData: SimpleRegisterData): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ajayu_token', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error de registro:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('ajayu_token');
    setUser(null);
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.role === roleName;
  };

  // Función para verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user) return false;
    return roleNames.includes(user.role);
  };

  // Función para obtener el rol principal del usuario
  const getPrimaryRole = (): string | null => {
    if (!user) return null;
    return user.role;
  };

  return (
    <SimpleAuthContext.Provider value={{ 
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
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth debe ser usado dentro de SimpleAuthProvider');
  }
  return context;
}