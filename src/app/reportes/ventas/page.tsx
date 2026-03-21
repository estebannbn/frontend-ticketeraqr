"use client";

import { useState, useEffect } from "react";
import Footer from "@/app/components/footer";
import VentasChart from "@/app/components/VentasChart";
import PieChart from "@/app/components/PieChart";
import { getVentasReport, ReporteHora } from "@/app/services/eventosService";
import { getCategorias } from "@/app/services/categoriaService";
import { getEventos } from "@/app/services/eventosService";
import { getOrganizacionByUsuarioId } from "@/app/services/organizacionService";
import { useAuth } from "@/context/AuthContext";
import { Categoria } from "@/types/categoria";
import { Evento } from "@/types/evento";

export default function VentasReportePage() {
    const { user } = useAuth();
    const [data, setData] = useState<ReporteHora[]>([]);
    const [loading, setLoading] = useState(true);

    // Catalogos
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);

    // Filtros
    const [filters, setFilters] = useState({
        fechaInicio: "",
        fechaFin: "",
        idCategoria: "",
        idEvento: "",
        idTipoTicket: "",
        idOrganizacion: ""
    });

    // Cargar categorias al inicio
    useEffect(() => {
        const loadCatalogs = async () => {
            const catsRes = await getCategorias();
            if (catsRes.success) setCategorias(catsRes.data);
        };
        loadCatalogs();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            let idOrg = filters.idOrganizacion;
            if (!idOrg && user?.rol === "ORGANIZACION" && user.idUsuario) {
                const orgData = await getOrganizacionByUsuarioId(Number(user.idUsuario));
                idOrg = orgData.idOrganizacion.toString();
                setFilters(prev => ({ ...prev, idOrganizacion: idOrg }));
            }

            console.log("Fetching report with filters:", { ...filters, idOrganizacion: idOrg });

            const [res, evtsRes] = await Promise.all([
                getVentasReport({ ...filters, idOrganizacion: idOrg }),
                getEventos(idOrg ? Number(idOrg) : undefined)
            ]);

            if (evtsRes.success) setEventos(evtsRes.data);

            if (res.success) {
                console.log("Report data received:", res.data);
                setData(res.data);
            } else {
                console.error("Error fetching report:", res.error);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === "idCategoria") {
            setFilters(prev => ({ ...prev, idCategoria: value, idEvento: "", idTipoTicket: "" }));
        } else if (name === "idEvento") {
            setFilters(prev => ({ ...prev, idEvento: value, idTipoTicket: "" }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    // Filtrar eventos por categoría seleccionada
    const filteredEventos = filters.idCategoria
        ? eventos.filter(e => e.idCategoria === Number(filters.idCategoria))
        : eventos;

    // Obtener tipos de ticket del evento seleccionado
    const selectedEvento = eventos.find(e => e.idEvento === Number(filters.idEvento));
    const tiposTicket = selectedEvento?.tipoTickets || [];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 uppercase">
            <main className="container mx-auto px-4 py-8 flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Reporte de Ventas por Hora</h1>

                {/* Filtros */}
                <form onSubmit={handleApplyFilters} className="bg-white p-6 rounded-xl shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        return (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                                    <input 
                                        type="date" 
                                        name="fechaInicio" 
                                        value={filters.fechaInicio} 
                                        max={filters.fechaFin || today} 
                                        onChange={handleFilterChange} 
                                        onKeyDown={(e) => e.preventDefault()} 
                                        className="w-full border rounded-lg p-2 text-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                                    <input 
                                        type="date" 
                                        name="fechaFin" 
                                        value={filters.fechaFin} 
                                        min={filters.fechaInicio} 
                                        max={today} 
                                        onChange={handleFilterChange} 
                                        onKeyDown={(e) => e.preventDefault()} 
                                        className="w-full border rounded-lg p-2 text-sm" 
                                    />
                                </div>
                            </>
                        );
                    })()}

                    {/* Filtro Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select name="idCategoria" onChange={handleFilterChange} className="w-full border rounded-lg p-2 text-sm" value={filters.idCategoria}>
                            <option value="">Todas</option>
                            {categorias.map(c => (
                                <option key={c.idCategoria} value={c.idCategoria}>{c.nombreCategoria}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Evento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
                        <select name="idEvento" onChange={handleFilterChange} className="w-full border rounded-lg p-2 text-sm" value={filters.idEvento}>
                            <option value="">Todos</option>
                            {filteredEventos.map(e => (
                                <option key={e.idEvento} value={e.idEvento}>{e.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Tipo Ticket (Solo si hay evento seleccionado) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Entrada</label>
                        <select
                            name="idTipoTicket"
                            onChange={handleFilterChange}
                            className="w-full border rounded-lg p-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                            disabled={!filters.idEvento}
                            value={filters.idTipoTicket}
                        >
                            <option value="">Todas</option>
                            {tiposTicket.map(t => (
                                <option key={t.idTipoTicket} value={t.idTipoTicket}>{t.tipo} (${t.precio})</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition h-10 w-full md:w-auto">
                        Filtrar
                    </button>
                </form>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Cargando reporte...</div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Gráfico Ventas */}
                        <div className="grid grid-cols-1 gap-8">
                            <VentasChart data={data} type="cantidad" />
                        </div>

                        {/* Gráfico Recaudación */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <PieChart
                                title="Recaudación por Hora ($)"
                                data={data
                                    .filter(d => d.recaudacion > 0)
                                    .map(d => ({ label: d.hora, value: d.recaudacion }))
                                }
                            />
                        </div>

                        {/* Resumen */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Tickets Vendidos</p>
                                    <p className="text-3xl font-bold text-indigo-600">{data.reduce((a, b) => a + b.cantidad, 0)}</p>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Recaudación Total</p>
                                    <p className="text-3xl font-bold text-emerald-600">${data.reduce((a, b) => a + b.recaudacion, 0).toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Detalle */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                            <h3 className="text-lg font-bold text-gray-800 p-6 border-b">Detalle por Hora</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-semibold text-sm">
                                        <tr>
                                            <th className="p-4">Hora</th>
                                            <th className="p-4">Tickets Vendidos</th>
                                            <th className="p-4">Recaudación Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.map((row) => (
                                            <tr key={row.hora} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium">{row.hora}</td>
                                                <td className="p-4">{row.cantidad}</td>
                                                <td className="p-4 text-emerald-600 font-semibold">${row.recaudacion}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
