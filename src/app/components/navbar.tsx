"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Menu, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getClienteByUsuarioId } from "@/app/services/clientService";

const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export default function Navbar() {

  const pathname = usePathname();
  const { user, logout } = useAuth();

  const rol = user?.rol;
  const userId = user?.idUsuario || (user as any)?.id;

  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserName = async () => {
      // Skip if no user data
      if (!userId || !rol) {
        if (isMounted) {
          setUserName("");
          setIsLoading(false);
          fetchedRef.current = null;
        }
        return;
      }

      // Skip if already fetched for this user
      const userKey = `${userId}-${rol}`;
      if (fetchedRef.current === userKey && userName) {
        return;
      }

      if (isMounted) {
        setIsLoading(true);
      }

      try {
        let name = "";

        if (rol === "CLIENTE") {
          const clientData = await getClienteByUsuarioId(Number(userId));
          name = `${clientData.nombre} ${clientData.apellido}`;
        } else if (rol === "ORGANIZACION") {
          // Fetch directly from API instead of using server action
          const res = await fetch(`${baseUrl}/api/organizaciones/usuario/${userId}`);
          if (res.ok) {
            const json = await res.json();
            name = json.data?.nombre || "";
          }
        } else if (rol === "ADMIN") {
          name = "Administrador";
        }

        if (isMounted) {
          setUserName(name);
          setIsLoading(false);
          fetchedRef.current = userKey;
        }
      } catch (error) {
        console.error("Error obteniendo nombre:", error);
        if (isMounted) {
          setUserName("");
          setIsLoading(false);
        }
      }
    };

    fetchUserName();

    return () => {
      isMounted = false;
    };
  }, [userId, rol, userName]);

  if (pathname === "/login") return null;
  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/eventos' && pathname.startsWith('/eventos/estadisticas')) {
      return false;
    }
    return pathname.startsWith(href) && href !== '/';
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const linkClass = (href: string, isMobile = false) =>
    `text-sm font-medium transition-colors ${isMobile ? "block py-2" : ""} ${isActive(href)
      ? `text-gray-900 ${!isMobile && "border-b-2 border-gray-800 pb-1"}`
      : "text-gray-500 hover:text-black"
    }`;

  const renderLinks = (isMobile = false) => (
    <>
      {rol === "ORGANIZACION" && (
        <>
          <Link href="/eventos" className={linkClass("/eventos", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Mis eventos</Link>
          <Link href="/organizaciones/scan" className={linkClass("/organizaciones/scan", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Escanear</Link>
          <Link href="/eventos/estadisticas" className={linkClass("/eventos/estadisticas", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Estadísticas</Link>
          <Link href="/reportes/ventas" className={linkClass("/reportes/ventas", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Ventas</Link>
          <Link href="/reportes/categorias" className={linkClass("/reportes/categorias", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Categorías</Link>
        </>
      )}
      {rol === "ADMIN" && (
        <>
          <Link href="/categorias" className={linkClass("/categorias", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Mis categorías</Link>
          <Link href="/politicas" className={linkClass("/politicas", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Establecer políticas</Link>
        </>
      )}
      {rol === "CLIENTE" && (
        <>
          <Link href="/clientes/mis-tickets" className={linkClass("/clientes/mis-tickets", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Mis tickets</Link>
          <Link href="/#proximos-eventos" className={linkClass("/#proximos-eventos", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Próximos eventos</Link>
        </>
      )}
      {!rol && (
        <>
          <Link href="/#proximos-eventos" className={linkClass("/#proximos-eventos", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Próximos eventos</Link>
          <Link href="/login" className={linkClass("/login", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Iniciar sesión</Link>
          <Link href="/register" className={linkClass("/register", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Registrarse</Link>
        </>
      )}
      {rol && (
        <Link href="/perfil" className={linkClass("/perfil", isMobile)} onClick={isMobile ? closeMobileMenu : undefined}>Mi perfil</Link>
      )}
    </>
  );

  return (
    <nav className="w-full bg-white border-b shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={40}
              style={{ width: "auto", height: "40px" }}
              priority
            />
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex gap-8 items-center">
            {renderLinks(false)}
          </div>

          {/* DESKTOP RIGHT */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/perfil"
                  className="p-2 text-gray-600 hover:text-indigo-600 transition-colors bg-gray-50 rounded-full"
                >
                  <User className="h-6 w-6" />
                </Link>

                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-500 hover:text-black"
                >
                  Cerrar sesión
                </button>

                <div className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-sm font-semibold text-gray-700 max-w-[150px] truncate">
                  {isLoading ? "Cargando..." : userName || "Usuario"}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
              >
                Ingresar
              </Link>
            )}
          </div>

          {/* MOBILE TOGGLE BUTTON */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-black p-2 bg-gray-50 rounded-md focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 top-16 px-6 py-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-2">
            {renderLinks(true)}
          </div>

          <hr className="border-gray-100 my-2" />

          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700 truncate">{isLoading ? "Cargando..." : userName || "Usuario"}</span>
                  <Link
                    href="/perfil"
                    className="p-2 text-gray-600 hover:text-indigo-600 transition-colors bg-gray-50 rounded-full"
                    onClick={closeMobileMenu}
                  >
                    <User className="h-5 w-5" />
                  </Link>
                </div>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="text-sm font-medium text-red-500 hover:text-red-700 text-left w-full py-2 bg-red-50 rounded px-3"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-center text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                onClick={closeMobileMenu}
              >
                Ingresar al sistema
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
