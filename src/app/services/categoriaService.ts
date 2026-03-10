"use server";

import { Categoria, CategoriaFormData } from "@/types/categoria";

export interface ApiResponse<T> {
  data: T;
  error: boolean;
  message: string;
}

const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/['"]/g, "");

export async function getCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${baseUrl}/api/categorias`);
  if (!res.ok) throw new Error("Error al obtener categorías");
  const json = (await res.json()) as ApiResponse<Categoria[]>;
  return json.data;
}

export async function createCategoria(
  data: CategoriaFormData
): Promise<Categoria> {
  const res = await fetch(`${baseUrl}/api/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    if (error.details && Array.isArray(error.details)) {
      throw new Error(JSON.stringify({ isValidationError: true, details: error.details }));
    }
    throw new Error(error.message || "Error al crear categoría");
  }
  const json = (await res.json()) as ApiResponse<Categoria>;
  return json.data;
}



export async function deleteCategoria(id: number): Promise<null> {
  const res = await fetch(`${baseUrl}/api/categorias/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar categoría");
  const json = (await res.json()) as ApiResponse<null>;
  return json.data;
}
