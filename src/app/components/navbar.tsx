"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getClienteByUsuarioId } from "@/app/services/clientService";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/['"]/g, "");

export default function Navbar() {

  const pathname = usePathname();
  const { user, logout } = useAuth();

  const rol = user?.rol;
  const userId = user?.idUsuario || (user as any)?.id;

  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const isActive = (href: string) => pathname.startsWith(href);

  const linkClass = (href: string) =>
    `text-sm font-medium ${isActive(href)
      ? "border-b-2 border-gray-800 text-gray-900 pb-1"
      : "text-gray-500 hover:text-black"
    }`;

  return (
    <nav className="w-full bg-white border-b shadow-sm">

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

          {/* LINKS */}
          <div className="flex gap-8">

            {rol === "ORGANIZACION" && (
              <>
                <Link href="/eventos" className={linkClass("/eventos")}>
                  Mis eventos
                </Link>

                <Link href="/organizaciones/scan" className={linkClass("/organizaciones/scan")}>
                  Escanear
                </Link>

                <Link href="/eventos/estadisticas" className={linkClass("/eventos/estadisticas")}>
                  Estadísticas
                </Link>

                <Link href="/reportes/ventas" className={linkClass("/reportes/ventas")}>
                  Ventas
                </Link>

                <Link href="/reportes/categorias" className={linkClass("/reportes/categorias")}>
                  Categorías
                </Link>
              </>
            )}

            {rol === "ADMIN" && (
              <>
                <Link href="/categorias" className={linkClass("/categorias")}>
                  Mis categorías
                </Link>

                <Link href="/politicas" className={linkClass("/politicas")}>
                  Establecer políticas
                </Link>
              </>
            )}

            {rol === "CLIENTE" && (
              <>
                <Link href="/clientes/mis-tickets" className={linkClass("/clientes/mis-tickets")}>
                  Mis tickets
                </Link>

                <Link href="/#proximos-eventos" className={linkClass("/#proximos-eventos")}>
                  Próximos eventos
                </Link>
              </>
            )}

            {!rol && (
              <>
                <Link href="/#proximos-eventos" className={linkClass("/#proximos-eventos")}>
                  Próximos eventos
                </Link>

                <Link href="/login" className={linkClass("/login")}>
                  Iniciar sesión
                </Link>

                <Link href="/register" className={linkClass("/register")}>
                  Registrarse
                </Link>
              </>
            )}

            {rol && (
              <Link href="/perfil" className={linkClass("/perfil")}>
                Mi perfil
              </Link>
            )}

          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-4">

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

        </div>

      </div>

    </nav>
  );
}
