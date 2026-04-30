import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      <main className={cn('flex-1', className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const router = useRouter();
  const { user, logout, loading, hasRole, hasAnyRole, getPrimaryRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Cerrar dropdown del usuario cuando se hace clic fuera (solo desktop)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen && window.innerWidth >= 768) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);
  
  const navItems = [
    { name: 'Cursos', href: '/cursos', module: 'cursos' },
    { name: 'IA', href: '/ia', module: 'ia' },
    { name: 'Avatares', href: '/avatares', module: 'avatares' },
    { name: 'Red Social', href: '/social', module: 'social', optional: true },
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  if (loading) {
    return (
      <header className="bg-neutral-0 shadow-sm sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/images/Ajayulogo.png" 
                alt="AJAYU Logo" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="text-neutral-500">Cargando...</div>
          </div>
        </div>
      </header>
    );
  }
  
  return (
    <header className="bg-neutral-0 shadow-sm sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/images/Ajayulogo.png" 
              alt="AJAYU Logo" 
              className="h-8 w-auto"
            />
          </Link>
          
          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.module}
                href={item.href}
                className={cn(
                  'text-neutral-600 hover:text-neutral-900 transition-colors duration-300 relative group',
                  router.pathname.startsWith(item.href) && 'text-neutral-900'
                )}
              >
                <span className="flex items-center">
                  {item.name}
                  {item.optional && (
                    <span className="ml-1 text-xs text-neutral-400">
                      (opcional)
                    </span>
                  )}
                </span>
                <div className={cn(
                  'absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#FF69B4] to-[#89004F] transition-all duration-300',
                  router.pathname.startsWith(item.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                )} />
              </Link>
            ))}
          </nav>

          {/* Autenticación - Usuario logueado o botones de login/register */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FF69B4] to-[#89004F] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    {user.name?.split(' ')[0] || 'Usuario'}
                  </span>
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-neutral-200">
                      <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                      {getPrimaryRole() && getPrimaryRole() !== 'normal' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getPrimaryRole() === 'administrador' ? 'Administrador' : 
                           getPrimaryRole() === 'instructor' ? 'Instructor' : 
                           getPrimaryRole() === 'moderador' ? 'Moderador' : getPrimaryRole()}
                        </span>
                      )}
                    </div>
                    
                    {/* Enlaces para roles especiales */}
                    {hasAnyRole(['instructor', 'administrador']) && (
                      <>
                        <Link
                          href="/instructor-dashboard"
                          className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 font-medium"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          📊 Dashboard Instructor
                        </Link>
                        <Link
                          href="/courses/create"
                          className="block px-4 py-2 text-sm text-green-700 hover:bg-green-50 font-medium"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          ➕ Crear Curso
                        </Link>
                      </>
                    )}
                    
                    {hasRole('administrador') && (
                      <Link
                        href="/admin-dashboard"
                        className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ⚙️ Panel Admin
                      </Link>
                    )}
                    
                    <div className="border-t border-neutral-200 my-1"></div>
                    
                    <Link
                      href="/perfil"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/configuracion"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Configuración
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all duration-300"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF69B4] to-[#C33B80] hover:from-[#FF69B4] hover:to-[#89004F] rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
          
          {/* Botón menú móvil */}
          <div className="md:hidden flex items-center space-x-2">
            {user ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 bg-gradient-to-br from-[#FF69B4] to-[#89004F] rounded-full flex items-center justify-center"
              >
                <span className="text-white font-medium text-sm">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all duration-300"
                >
                  Iniciar
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#FF69B4] to-[#C33B80] hover:from-[#FF69B4] hover:to-[#89004F] rounded-lg transition-all duration-300"
                >
                  Registrar
                </Link>
              </>
            )}
            <button
              className="p-2 rounded-lg hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-0 border-t border-neutral-200">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.module}
                  href={item.href}
                  className={cn(
                    'text-neutral-600 hover:text-neutral-900 transition-colors duration-300 flex items-center',
                    router.pathname.startsWith(item.href) && 'text-neutral-900 font-medium'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                  {item.optional && (
                    <span className="ml-2 text-xs text-neutral-400">
                      (opcional)
                    </span>
                  )}
                </Link>
              ))}
              
              {/* Menú de usuario móvil */}
              {user && (
                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF69B4] to-[#89004F] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                      {getPrimaryRole() && getPrimaryRole() !== 'normal' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getPrimaryRole() === 'administrador' ? 'Administrador' : 
                           getPrimaryRole() === 'instructor' ? 'Instructor' : 
                           getPrimaryRole() === 'moderador' ? 'Moderador' : getPrimaryRole()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Enlaces para roles especiales */}
                  {hasAnyRole(['instructor', 'administrador']) && (
                    <>
                      <Link
                        href="/instructor-dashboard"
                        className="block px-2 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        📊 Dashboard Instructor
                      </Link>
                      <Link
                        href="/courses/create"
                        className="block px-2 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        ➕ Crear Curso
                      </Link>
                    </>
                  )}
                  
                  {hasRole('administrador') && (
                    <Link
                      href="/admin-dashboard"
                      className="block px-2 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ⚙️ Panel Admin
                    </Link>
                  )}
<div className="border-t border-neutral-200 my-2"></div>
                  
                  <Link
                    href="/perfil"
                    className="block px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mi Perfil
                  </Link>
                  <Link
                    href="/configuracion"
                    className="block px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Configuración
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mt-2"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Overlay para cerrar dropdowns - SOLO en móvil para evitar conflictos */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden" 
          onClick={() => {
            setUserMenuOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF69B4] to-[#89004F] rounded-lg flex items-center justify-center">
                <span className="text-neutral-0 font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-serif font-bold text-neutral-0">
                Ajayu
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              La plataforma integral para diseño de moda. Combina tu creatividad 
              con inteligencia artificial para crear, aprender y conectar.
            </p>
          </div>
          
          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-neutral-0 font-semibold mb-4">Módulos</h3>
            <ul className="space-y-2">
              <li><Link href="/cursos" className="hover:text-neutral-0 transition-colors">Cursos</Link></li>
              <li><Link href="/ia" className="hover:text-neutral-0 transition-colors">IA</Link></li>
              <li><Link href="/avatares" className="hover:text-neutral-0 transition-colors">Avatares</Link></li>
              <li><Link href="/social" className="hover:text-neutral-0 transition-colors">Red Social</Link></li>
            </ul>
          </div>
          
          {/* Soporte */}
          <div>
            <h3 className="text-neutral-0 font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li><Link href="/ayuda" className="hover:text-neutral-0 transition-colors">Ayuda</Link></li>
              <li><Link href="/contacto" className="hover:text-neutral-0 transition-colors">Contacto</Link></li>
              <li><Link href="/privacidad" className="hover:text-neutral-0 transition-colors">Privacidad</Link></li>
              <li><Link href="/terminos" className="hover:text-neutral-0 transition-colors">Términos</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-neutral-800 text-center">
          <p className="text-neutral-400">
            © {currentYear} Ajayu. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}