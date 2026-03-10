"use client";

import { useState, useEffect } from "react";
import { getEstadisticasEventos } from "@/app/services/estadisticaService";
import { getCategorias } from "@/app/services/categoriaService";
import { getOrganizacionByUsuarioId } from "@/app/services/organizacionService";
import { useAuth } from "@/context/AuthContext";
import { Categoria } from "@/types/categoria";
import { EstadisticasResponse, EstadisticaEvento } from "@/types/evento";
import EventoEstadisticasTable from "@/app/components/eventoEstadisticasTable";
import VentasChart from "@/app/components/VentasChart";
import { getVentasReport, ReporteHora } from "@/app/services/eventosService";

export default function EstadisticasPage() {
  const { user } = useAuth();
  const [allData, setAllData] = useState<EstadisticasResponse | null>(null);
  const [filteredEventos, setFilteredEventos] = useState<EstadisticaEvento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ventasHora, setVentasHora] = useState<ReporteHora[]>([]);
  const [idOrganizacion, setIdOrganizacion] = useState<number | undefined>(undefined);

  const [search, setSearch] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [categoria, setCategoria] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      let idOrg;
      if (user?.rol === "ORGANIZACION" && user.idUsuario) {
        const orgData = await getOrganizacionByUsuarioId(Number(user.idUsuario));
        idOrg = orgData.idOrganizacion;
        setIdOrganizacion(idOrg);
      }

      const [statsRes, catsRes, ventasRes] = await Promise.all([
        getEstadisticasEventos(idOrg),
        getCategorias(),
        getVentasReport({ idOrganizacion: idOrg })
      ]);
      const actualStats = (statsRes as any).data || statsRes;
      setAllData(actualStats);
      setFilteredEventos(actualStats.eventos || []);
      
      if (catsRes.success) setCategorias(catsRes.data);
      if (ventasRes.success) setVentasHora(ventasRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!allData) return;

    let eventosFiltrados = allData.eventos || [];

    if (search) {
      eventosFiltrados = eventosFiltrados.filter((e) =>
        e.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      eventosFiltrados = eventosFiltrados.filter(
        (e) => new Date(e.fecha) >= inicio && new Date(e.fecha) <= fin
      );
    }

    if (categoria) {
      eventosFiltrados = eventosFiltrados.filter(
        (e) => e.idCategoria === categoria
      );
    }

    setFilteredEventos(eventosFiltrados);

    const fetchFilteredChart = async () => {
      const res = await getVentasReport({
        idOrganizacion,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        idCategoria: categoria ? categoria.toString() : undefined
      });
      if (res.success) {
        setVentasHora(res.data);
      }
    };
    fetchFilteredChart();
  }, [search, fechaInicio, fechaFin, categoria, allData, idOrganizacion]);

  if (!allData)
    return (
      <p className="text-center text-blue-600 mt-10 text-lg">
        Cargando estadísticas...
      </p>
    );

  const totalVendidos = filteredEventos.reduce((a, e) => a + e.vendidos, 0);
  const totalReembolsados = filteredEventos.reduce(
    (a, e) => a + e.reembolsados,
    0
  );
  const totalRecaudacion = filteredEventos.reduce(
    (a, e) => a + e.recaudacion,
    0
  );

  const resumen = {
    totalVendidos,
    promedioVendidos: filteredEventos.length
      ? totalVendidos / filteredEventos.length
      : 0,
    totalReembolsados,
    porcReembolsados: totalVendidos
      ? (totalReembolsados / totalVendidos) * 100
      : 0,
    recaudacionTotal: totalRecaudacion,
    recaudacionPromedio: filteredEventos.length
      ? totalRecaudacion / filteredEventos.length
      : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-blue-800 text-center">
          📊 Estadísticas de Eventos
        </h1>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="🔍 Buscar evento..."
            className="border border-blue-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="date"
            className="border border-blue-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            value={fechaInicio}
            max={fechaFin}
            onKeyDown={(e) => e.preventDefault()}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <input
            type="date"
            className="border border-blue-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            value={fechaFin}
            min={fechaInicio}
            onKeyDown={(e) => e.preventDefault()}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <select
            className="border border-blue-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            value={categoria ?? ""}
            onChange={(e) =>
              setCategoria(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.idCategoria} value={cat.idCategoria}>
                {cat.nombreCategoria}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen general */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            📌 Resumen General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-blue-800 font-bold text-lg">
                🎟️ {resumen.totalVendidos}
              </p>
              <p className="text-gray-600">Total Vendidos</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-blue-800 font-bold text-lg">
                {resumen.promedioVendidos.toFixed(2)}
              </p>
              <p className="text-gray-600">Promedio Vendidos</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-blue-800 font-bold text-lg">
                💰 ${resumen.recaudacionTotal}
              </p>
              <p className="text-gray-600">Recaudación Total</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-blue-800 font-bold text-lg">
                ↩️ {resumen.totalReembolsados}
              </p>
              <p className="text-gray-600">Reembolsados</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-blue-800 font-bold text-lg">
                {resumen.porcReembolsados.toFixed(2)}%
              </p>
              <p className="text-gray-600">% Reembolsados</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-blue-800 font-bold text-lg">
                ${resumen.recaudacionPromedio.toFixed(2)}
              </p>
              <p className="text-gray-600">Recaudación Promedio</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Ventas */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">📈 Ventas por Hora</h2>
          <VentasChart data={ventasHora} type="cantidad" />
        </div>

        {/* Tabla de eventos */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">📅 Eventos</h2>
          <EventoEstadisticasTable
            eventos={filteredEventos}
            totalEventos={allData.eventos?.length || 0}
            categorias={categorias}
          />
        </div>
      </div>
    </div>
  );
}
