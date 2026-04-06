"use server";

import { Categoria, CategoriaFormData } from "@/types/categoria";

export interface ApiResponse<T> {
  data: T;
  error: boolean;
  message: string;
}

const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export type ServiceResult<T> = 
    | { success: true; data: T; message?: string }
    | { success: false; error: string };

export async function getCategorias(): Promise<ServiceResult<Categoria[]>> {
  try {
    const res = await fetch(`${baseUrl}/api/categorias`);
    if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.message || "Error al obtener categorías" };
    }
    const json = (await res.json()) as ApiResponse<Categoria[]>;
    return { success: true, data: json.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createCategoria(
  data: CategoriaFormData
): Promise<ServiceResult<Categoria>> {
  try {
    const res = await fetch(`${baseUrl}/api/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.message || "Error al crear categoría" };
    }
    const json = (await res.json()) as ApiResponse<Categoria>;
    return { success: true, data: json.data, message: json.message };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCategoria(id: number): Promise<ServiceResult<null>> {
  try {
    const res = await fetch(`${baseUrl}/api/categorias/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.message || "Error al eliminar categoría" };
    }
    const json = (await res.json()) as ApiResponse<null>;
    return { success: true, data: json.data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
