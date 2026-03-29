import { Evento } from "@/types/evento";
import { useState, useMemo } from "react";
import { Categoria } from "@/types/categoria";

interface EventoTableProps {
  eventos: Evento[];
  categorias: Categoria[];
  loading: boolean;
  onChangeDate: (id: number, nuevaFecha: string) => Promise<void>;
  onDelete: (id: number) => void;
  onCancel: (id: number) => void;
}

export const EventoTable: React.FC<EventoTableProps> = ({
  eventos,
  categorias,
  loading,
  onChangeDate,
  onDelete,
  onCancel,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [errorFecha, setErrorFecha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // filtros
  const [nombreFiltro, setNombreFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  // paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const openDateModal = (evento: Evento) => {
    setSelectedEvento(evento);
    setNuevaFecha(new Date(evento.fechaHoraEvento).toISOString().slice(0, 16));
    setErrorFecha("");
    setModalOpen(true);
  };

  const handleDateChangeSubmit = async () => {
    if (selectedEvento && nuevaFecha) {
      const selectedDate = new Date(nuevaFecha);
      const today = new Date();

      if (selectedDate < today) {
        setErrorFecha("La fecha del evento no puede ser previa a la fecha y hora actual");
        return;
      }

      setErrorFecha("");
      setIsSubmitting(true);
      try {
        await onChangeDate(selectedEvento.idEvento, nuevaFecha);
        setModalOpen(false);
      } catch (error) {
        setErrorFecha(
          (error as Error).message || "Ha ocurrido un error al cambiar la fecha"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const now = new Date();
  const argentinaTime = new Date(now.getTime() - 3 * 3600000);
  const minDateTime = argentinaTime.toISOString().slice(0, 16);

  // filtro eventos (optimizados con useMemo)
  const { eventosPaginados, totalItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const filtrados = eventos.filter((evento) => {
      const coincideNombre = evento.nombre
        .toLowerCase()
        .includes(nombreFiltro.toLowerCase());

      const coincideCategoria =
        categoriaFiltro === "" ||
        evento.idCategoria === Number(categoriaFiltro);

      return coincideNombre && coincideCategoria;
    });

    const total = filtrados.length;
    const paginas = Math.ceil(total / itemsPerPage);
    const inicio = (currentPage - 1) * itemsPerPage;
    const fin = inicio + itemsPerPage;
    const paginados = filtrados.slice(inicio, fin);

    return {
      eventosPaginados: paginados,
      totalItems: total,
      totalPages: Math.max(1, paginas),
      startIndex: inicio,
      endIndex: fin,
    };
  }, [eventos, nombreFiltro, categoriaFiltro, currentPage]);

  return (
    <div>

      {/* FILTROS */}

      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={nombreFiltro}
          onChange={(e) => {
            setNombreFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="border rounded-lg px-3 py-2 w-64"
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => {
            setCategoriaFiltro(e.target.value);
            setCurrentPage(1);
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.idCategoria} value={cat.idCategoria}>
              {cat.nombreCategoria}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Foto</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Descripción</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Ubicación</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Fecha Evento</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Capacidad</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Categoría</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Tickets</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Acciones</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {eventosPaginados.length > 0 ? (
              eventosPaginados.map((evento) => (
                <tr key={evento.idEvento}>
                  <td className="px-4 py-3 font-semibold">{evento.nombre}</td>

                  <td className="px-4 py-3">
                    {evento.foto ? (
                      <img
                        src={evento.foto}
                        alt={evento.nombre}
                        className="h-12 w-20 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-20 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">
                        Sin foto
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${evento.estado === "CANCELADO"
                        ? "bg-red-100 text-red-700"
                        : evento.estado === "FINALIZADO"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-green-100 text-green-700"
                        }`}
                    >
                      {evento.estado || "ACTIVO"}
                    </span>
                  </td>

                  <td className="px-4 py-3">{evento.descripcion || "—"}</td>

                  <td className="px-4 py-3">
                    {evento.ubicacion || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(evento.fechaHoraEvento).toLocaleString()}
                  </td>

                  <td className="px-4 py-3">{evento.capacidadMax}</td>

                  <td className="px-4 py-3">
                    {categorias.find(
                      (c) => c.idCategoria === evento.idCategoria
                    )?.nombreCategoria || evento.idCategoria}
                  </td>

                  <td className="px-4 py-3">
                    <ul className="list-disc pl-4">
                      {(evento.tipoTickets || []).map((ticket) => (
                        <li key={ticket.idTipoTicket || ticket.tipo}>
                          {ticket.tipo} (${ticket.precio}) - {ticket.acceso}
                        </li>
                      ))}
                    </ul>
                  </td>

                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {evento.estado === "ACTIVO" || !evento.estado ? (
                      <>
                        <button
                          onClick={() => openDateModal(evento)}
                          className="text-blue-600 hover:text-blue-800 mr-2 font-medium"
                        >
                          Cambiar fecha
                        </button>

                        <button
                          onClick={() => onCancel(evento.idEvento)}
                          className="text-orange-600 hover:text-orange-800 mr-2 font-medium"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : evento.estado === "CANCELADO" ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onDelete(evento.idEvento)}
                          className="text-red-500 hover:text-red-700 font-medium text-sm border border-red-200 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic text-sm">
                        Sin acciones
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">
                        {eventos.length === 0 
                          ? "Aún no has creado ningún evento" 
                          : "No hay eventos que coincidan con los filtros aplicados"}
                      </p>
                      <p className="text-sm">
                        {eventos.length === 0 
                          ? "¡Comienza creando tu primer evento usando el formulario!" 
                          : "Prueba ajustando el nombre o la categoría de búsqueda"}
                      </p>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {loading && (
          <div className="p-4 text-center text-gray-500">Cargando...</div>
        )}

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de <span className="font-medium">{totalItems}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === idx + 1
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Siguiente</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}

      {modalOpen && selectedEvento && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">
              Cambiar Fecha del Evento
            </h3>

            <div className="mb-4 flex flex-col items-center">
              {selectedEvento.foto ? (
                <img
                  src={selectedEvento.foto}
                  alt={selectedEvento.nombre}
                  className="h-32 w-full object-cover rounded mb-2"
                />
              ) : (
                <div className="h-32 w-full bg-gray-100 flex items-center justify-center text-gray-400 rounded mb-2">
                  Sin foto
                </div>
              )}

              <span className="font-semibold text-center">
                {selectedEvento.nombre}
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Fecha y Hora
              </label>

              <input
                type="datetime-local"
                min={minDateTime}
                onKeyDown={(e) => e.preventDefault()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errorFecha ? "border-red-500" : ""
                  }`}
                value={nuevaFecha}
                onChange={(e) => {
                  setNuevaFecha(e.target.value);
                  if (errorFecha) setErrorFecha("");
                }}
              />

              {errorFecha && (
                <p className="mt-1 text-sm text-red-600 font-medium">
                  {errorFecha}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleDateChangeSubmit}
                disabled={isSubmitting || !nuevaFecha}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};