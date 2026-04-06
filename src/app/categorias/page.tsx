"use client";

import { useEffect, useState } from "react";
import { CategoriaForm } from "@/app/components/categoriaForm";
import { CategoriaTable } from "@/app/components/categoriaTable";
import RoleGuard from "@/app/components/RoleGuard";
import ConfirmDeleteModal from "@/app/components/ui/confirmDeleteModal";
import {
  getCategorias,
  createCategoria,
  deleteCategoria,
} from "@/app/services/categoriaService";
import { Categoria, CategoriaFormData } from "@/types/categoria";

// New imports for client view
import { getEventos } from "@/app/services/eventosService";
import { getOrganizacionByUsuarioId } from "@/app/services/organizacionService";
import { Evento } from "@/types/evento";
import EventGrid from "@/app/components/eventGrid";
import { useAuth } from "@/context/AuthContext";

export default function CategoriasPage() {
  const { user } = useAuth();
  const rol = user?.rol;

  if (rol === "ADMIN") {
    return <AdminCategoriasView />;
  }
  return <ClienteCategoriasView />;
}

function AdminCategoriasView() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const res = await getCategorias();
      if (res.success) {
        setCategorias(res.data);
      } else {
        console.error("Error al cargar categorías:", res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: CategoriaFormData) => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const res = await createCategoria(data);
      if (res.success) {
        setSuccessMessage(res.message || "Operación realizada con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadCategorias();
      } else {
        // Lanzamos el error para que CategoriaForm lo capture en su propio try-catch
        throw new Error(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (categoria: Categoria) => {
    setCategoriaToDelete(categoria);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoriaToDelete) return;
    setLoading(true);
    try {
      const res = await deleteCategoria(categoriaToDelete.idCategoria);
      if (res.success) {
        await loadCategorias();
      } else {
        alert(res.error);
      }
    } finally {
      setShowDeleteModal(false);
      setCategoriaToDelete(null);
      setLoading(false);
    }
  };



  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Gestión de Categorías</h1>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 animate-in fade-in duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4">
            <CategoriaForm
              onSubmit={handleFormSubmit}
              loading={loading}
            />
          </div>
          <div className="col-span-12 md:col-span-8">
            <CategoriaTable
              categorias={categorias}
              loading={loading}
              onDelete={handleDeleteRequest}
            />
          </div>
        </div>

        {showDeleteModal && categoriaToDelete && (
          <ConfirmDeleteModal
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
            itemName={categoriaToDelete.nombreCategoria}
          />
        )}
      </div>
    </RoleGuard>
  );
}

function ClienteCategoriasView() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [catsRes, evtsRes] = await Promise.all([getCategorias(), getEventos()]);
      
      let filtered: Evento[] = [];
      if (evtsRes.success) {
        filtered = evtsRes.data;
        if (user?.rol === "ORGANIZACION" && user?.idUsuario) {
          const org = await getOrganizacionByUsuarioId(Number(user.idUsuario));
          if (org) {
            filtered = evtsRes.data.filter(e => e.idOrganizacion === org.idOrganizacion);
          }
        }
      }
      
      if (catsRes.success) setCategorias(catsRes.data);
      setEventos(filtered);
      setLoading(false);
    };
    if (user) loadData();
  }, [user]);

  return (
    <RoleGuard allowedRoles={["ORGANIZACION", "CLIENTE"]}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
          Eventos por Categoría
        </h1>
        <EventGrid eventos={eventos} loading={loading} />
      </div>
    </RoleGuard>
  );
}


