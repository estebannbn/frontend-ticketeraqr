// src/services/eventoService.ts
const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
export async function getEstadisticasEventos(idOrganizacion?: number, fechaInicio?: string, fechaFin?: string) {
  const params = new URLSearchParams();
  if (idOrganizacion) params.append('idOrganizacion', idOrganizacion.toString());
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);

  const url = `${baseUrl}/api/eventos/estadisticas?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Error al obtener estadísticas");
  }

  return res.json();
}

