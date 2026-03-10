"use client";

import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { Evento, EventoFormData, TipoTicketFormData } from "@/types/evento";
import {
  getEventos,
  createEvento,
  cambiarFechaEvento,
  deleteEvento,
  cancelarEvento,
} from "@/app/services/eventosService";
import { getCategorias } from "@/app/services/categoriaService";
import { getOrganizacionByUsuarioId } from "@/app/services/organizacionService";
import { Categoria } from "@/types/categoria";
import { EventoForm } from "@/app/components/eventoForm";
import { EventoTable } from "@/app/components/eventoTable";
import { TipoTicketForm } from "../components/tipoTicketForm";
import RoleGuard from "../components/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tipoTickets, setTipoTickets] = useState<TipoTicketFormData[]>([]);
  const [successEvent, setSuccessEvent] = useState<Evento | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [organizacionId, setOrganizacionId] = useState<number | null>(null);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  const { user } = useAuth(); // Assume we need to import useAuth and destructure user

  useEffect(() => {
    loadEventos();
    loadCategorias();
  }, [user]);

  const loadCategorias = async () => {
    const res = await getCategorias();
    if (res.success) {
      setCategorias(res.data);
    } else {
      console.error("Error cargando categorías:", res.error);
    }
  };

  const loadEventos = async () => {
    if (user?.rol === "ADMIN") {
      const res = await getEventos();
      if (res.success) setEventos(res.data);
    } else if (user?.rol === "ORGANIZACION" && user?.idUsuario) {
      const orgData = await getOrganizacionByUsuarioId(Number(user.idUsuario));
      setOrganizacionId(orgData.idOrganizacion);
      const res = await getEventos(orgData.idOrganizacion);
      if (res.success) setEventos(res.data);
    } else {
      setEventos([]);
    }
    setLoading(false);
  };


  const handleFormSubmit = async (data: EventoFormData) => {
    setEventFormError(null);
    try {
      const parsedCapacidadMax = typeof data.capacidadMax === 'number' ? data.capacidadMax : parseInt(String(data.capacidadMax), 10) || 0;
      const totalTicketsCapacity = tipoTickets.reduce((acc, t) => acc + t.cantMaxPorTipo, 0);

      if (totalTicketsCapacity > parsedCapacidadMax) {
        setEventFormError("La suma de la capacidad de los tipos de tickets no puede exceder la capacidad máxima del evento.");
        setLoading(false);
        return;
      }

      // Create a type-safe copy of the event data
      const eventoData: EventoFormData = {
        ...data,
        capacidadMax: parsedCapacidadMax,
        idCategoria: typeof data.idCategoria === 'number' ? data.idCategoria : parseInt(String(data.idCategoria), 10) || 1,
        idOrganizacion: organizacionId || 1, // Using the correct org ID from state
        fechaCreacion: data.fechaCreacion || new Date().toISOString(), // Inject current date if absent
        tipoTickets: tipoTickets
      };

      const res = await createEvento(eventoData);
      if (res.success) {
        setEventos((prev) => [...prev, res.data]);
        setSuccessEvent(res.data);
        setTimeout(() => setSuccessEvent(null), 10000);
        setTipoTickets([]);
        await loadEventos();
      } else {
        setEventFormError(res.error);
      }
    } catch (error) {
      console.error("Error en el formulario de evento:", error);
      setEventFormError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // When adding new ticket types
  const handleTipoTicketSubmit = (newTipoTicket: TipoTicketFormData) => {
    // Ensure numeric values are properly typed
    const typedTicket: TipoTicketFormData = {
      ...newTipoTicket,
      precio: typeof newTipoTicket.precio === 'number' ?
        newTipoTicket.precio :
        parseFloat(String(newTipoTicket.precio)) || 0,
      cantMaxPorTipo: typeof newTipoTicket.cantMaxPorTipo === 'number' ?
        newTipoTicket.cantMaxPorTipo :
        parseInt(String(newTipoTicket.cantMaxPorTipo), 10) || 0
    };

    setTipoTickets(prev => [...prev, typedTicket]);
    setShowTicketModal(false); // Close modal on submit
  };

  const handleRemoveTicket = (index: number) => {
    if (window.confirm("¿Estás seguro que deseas eliminar este tipo de ticket?")) {
      setTipoTickets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleCambiarFecha = async (id: number, nuevaFecha: string) => {
    setLoading(true);
    try {
      const res = await cambiarFechaEvento(id, nuevaFecha);
      if (res.success) {
        await loadEventos();
      } else {
        alert(res.error);
      }
    } catch (error) {
      console.error("Error cambiando fecha:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;
    setLoading(true);
    const res = await deleteEvento(id);
    if (res.success) {
      setEventos((prev) => prev.filter((ev) => ev.idEvento !== id));
    } else {
      alert(res.error);
    }
    setLoading(false);
  };



  const handleCancelEvento = async (id: number) => {
    if (!confirm("¿Estás seguro de cancelar este evento? Esto reembolsará todos los tickets pagados y el evento no será visible como activo.")) return;
    setLoading(true);
    const res = await cancelarEvento(id);
    if (res.success) {
      await loadEventos();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <RoleGuard allowedRoles={["ORGANIZACION", "ADMIN"]}>
      <div className="p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <CalendarDays className="h-6 w-6" /> Gestión de Eventos
        </h1>

        {successEvent && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm animate-in fade-in duration-500">
            <h3 className="text-green-800 font-bold flex items-center gap-2 mb-2">
              ✓ ¡Evento creado con éxito!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                <p><strong>Nombre:</strong> {successEvent.nombre}</p>
                <p><strong>Fecha:</strong> {new Date(successEvent.fechaHoraEvento).toLocaleString()}</p>
                <p><strong>Categoría:</strong> {categorias.find(c => c.idCategoria === successEvent.idCategoria)?.nombreCategoria || successEvent.idCategoria}</p>
              </div>
              <div className="flex justify-center md:justify-end">
                {successEvent.foto ? (
                  <img src={successEvent.foto} alt="Evento" className="h-20 w-32 object-cover rounded shadow" />
                ) : (
                  <div className="h-20 w-32 bg-gray-200 flex items-center justify-center rounded text-gray-400">Sin foto</div>
                )}
              </div>
            </div>
            <button
              onClick={() => setSuccessEvent(null)}
              className="mt-3 text-xs text-green-600 hover:text-green-800 font-medium"
            >
              Cerrar aviso
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4">
            <EventoForm
              isEditing={false}
              onSubmit={handleFormSubmit}
              loading={loading}
              tipoTickets={tipoTickets}
              onRemoveTicket={handleRemoveTicket}
              serverError={eventFormError}
            />

            <button
              onClick={() => setShowTicketModal(true)}
              className="mt-4 w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors font-medium flex items-center justify-center gap-2"
            >
              + Agregar Tipo de Ticket
            </button>

            {showTicketModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-800">Cargar Nuevo Ticket</h3>
                    <button
                      onClick={() => setShowTicketModal(false)}
                      className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4">
                    <TipoTicketForm
                      isEditing={false}
                      onSubmit={handleTipoTicketSubmit}
                      loading={loading}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="col-span-12 md:col-span-8">
            <EventoTable
              eventos={eventos}
              categorias={categorias}
              loading={loading}
              onChangeDate={handleCambiarFecha}
              onDelete={handleDelete}
              onCancel={handleCancelEvento}
            />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
