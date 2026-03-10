"use server";

import { Politica, PoliticaFormData } from "@/types/politica";

export interface ApiResponse<T> {
    data: T;
    error: boolean;
    message: string;
}

const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export type ServiceResult<T> = 
    | { success: true; data: T }
    | { success: false; error: string };

export async function getPoliticaActual(): Promise<ServiceResult<Politica | null>> {
    try {
        const res = await fetch(`${baseUrl}/api/politicas/actual`, {
            cache: "no-store",
        });
        
        if (!res.ok) {
            if (res.status === 404) return { success: true, data: null };
            const error = await res.json();
            return { success: false, error: error.message || "Error al obtener política actual" };
        }
        
        const json = (await res.json()) as ApiResponse<Politica>;
        return { success: true, data: json.data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getPoliticas(): Promise<ServiceResult<Politica[]>> {
    try {
        const res = await fetch(`${baseUrl}/api/politicas`, {
            cache: "no-store",
        });
        if (!res.ok) {
            const error = await res.json();
            return { success: false, error: error.message || "Error al obtener políticas" };
        }
        const json = (await res.json()) as ApiResponse<Politica[]>;
        return { success: true, data: json.data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

export async function createPolitica(
    data: PoliticaFormData
): Promise<ServiceResult<Politica>> {
    try {
        const res = await fetch(`${baseUrl}/api/politicas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            return { success: false, error: error.message || "Error al crear política" };
        }
        const json = (await res.json()) as ApiResponse<Politica>;
        return { success: true, data: json.data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

