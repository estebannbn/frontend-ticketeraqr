import { useState } from "react";
import { Politica } from "@/types/politica";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PoliticaTableProps {
    politicas: Politica[];
    loading: boolean;
}

export const PoliticaTable: React.FC<PoliticaTableProps> = ({
    politicas,
    loading,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    if (loading) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-center text-gray-500">Cargando políticas...</p>
            </div>
        );
    }

    if (politicas.length === 0) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-center text-gray-500">No hay políticas registradas</p>
            </div>
        );
    }

    const politicasOrdenadas = [...politicas].sort(
        (a, b) =>
            new Date(b.fechaVigencia).getTime() - new Date(a.fechaVigencia).getTime()
    );

    const idPoliticaActual = politicasOrdenadas[0]?.fechaVigencia;

    // Pagination logic
    const totalPages = Math.ceil(politicasOrdenadas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPoliticas = politicasOrdenadas.slice(startIndex, startIndex + itemsPerPage);

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-full">
            <div className="overflow-x-auto flex-grow">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Días de Reembolso
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha de Vigencia
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedPoliticas.map((politica, index) => {
                            const esActual = politica.fechaVigencia === idPoliticaActual;
                            return (
                                <tr
                                    key={politica.fechaVigencia || startIndex + index}
                                    className={esActual ? "bg-blue-50" : "hover:bg-gray-50"}
                                >
                                    <td className="px-4 py-3 text-sm">
                                        <span className="font-semibold text-blue-600">
                                            {politica.diasReembolso} días
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {new Date(politica.fechaVigencia).toLocaleString("es-AR", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {esActual ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✓ Vigente
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                Histórica
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-auto rounded-b-lg">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Anterior
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Siguiente
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{startIndex + 1}</span> a{" "}
                                <span className="font-medium">
                                    {Math.min(startIndex + itemsPerPage, politicasOrdenadas.length)}
                                </span>{" "}
                                de <span className="font-medium">{politicasOrdenadas.length}</span> resultados
                            </p>
                        </div>
                        <div>
                            <nav
                                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                aria-label="Pagination"
                            >
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="sr-only">Anterior</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                {/* Paginación Numérica Simplificada */}
                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={handleNext}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="sr-only">Siguiente</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PoliticaTable;
