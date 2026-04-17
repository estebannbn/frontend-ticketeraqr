"use server";

import { Evento, EventoFormData } from "@/types/evento";

export interface ApiResponse<T> {
  data: T;
  error: boolean;
  message: string;
}

const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export type ServiceResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string };

// Obtener todos los eventos
export async function getEventos(idOrganizacion?: number, includeAll: boolean = false): Promise<ServiceResult<Evento[]>> {
  try {
    const params = new URLSearchParams();
    if (idOrganizacion) params.append("idOrganizacion", idOrganizacion.toString());
    if (includeAll) params.append("todo", "true");

    const url = `${baseUrl}/api/eventos?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.message || "Error al obtener eventos" };
    }
    const json = (await res.json()) as ApiResponse<Evento[]>;
    return { success: true, data: json.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Obtener un evento por ID
export async function getEventoById(id: number): Promise<ServiceResult<Evento>> {
  try {
    const res = await fetch(`${baseUrl}/api/eventos/${id}`);
    if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.message || "Error al obtener evento" };
    }
    const json = (await res.json()) as ApiResponse<Evento>;
    return { success: true, data: json.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Crear evento
export async function createEvento(data: EventoFormData): Promise<ServiceResult<Evento>> {
  try {
    const res = await fetch(`${baseUrl}/api/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.message || "Error al crear evento" };
    }
    const json = (await res.json()) as ApiResponse<Evento>;
    return { success: true, data: json.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Actualizar fecha evento
export async function cambiarFechaEvento(id: number, fechaHoraEvento: string): Promise<ServiceResult<Evento>> {
  try {
    const res = await fetch(`${baseUrl}/api/eventos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fechaHoraEvento }),
    });
    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.message || "Error al actualizar la fecha del evento" };
    }
    const json = (await res.json()) as ApiResponse<Evento>;
    return { success: true, data: json.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Eliminar evento
export async function deleteEvento(id: number): Promise<ServiceResult<void>> {
  try {
    const res = await fetch(`${baseUrl}/api/eventos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.message || "Error al eliminar evento" };
    }
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export interface ReporteHora {
  hora: string;
  cantidad: number;
  recaudacion: number;
}

export async function getVentasReport(filters: { fechaInicio?: string; fechaFin?: string; idCategoria?: string; idEvento?: string; idTipoTicket?: string; idOrganizacion?: number | string }): Promise<ServiceResult<ReporteHora[]>> {
  try {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.idCategoria) params.append("idCategoria", filters.idCategoria);
    if (filters.idEvento) params.append("idEvento", filters.idEvento);
    if (filters.idTipoTicket) params.append("idTipoTicket", filters.idTipoTicket);
    if (filters.idOrganizacion) params.append("idOrganizacion", filters.idOrganizacion.toString());

    const res = await fetch(`${baseUrl}/api/eventos/ventas-hora?${params.toString()}`);
    if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.message || "Error al obtener reporte" };
    }

    const json = await res.json();
    return { success: true, data: json.data || [] };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Cancelar evento
export async function cancelarEvento(id: number): Promise<ServiceResult<void>> {
  try {
    const res = await fetch(`${baseUrl}/api/eventos/${id}/cancelar`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.message || "Error al cancelar evento" };
    }
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
