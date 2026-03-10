"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft } from "lucide-react";
import { PoliticaForm } from "@/app/components/PoliticaForm";
import RoleGuard from "@/app/components/RoleGuard";
import { PoliticaTable } from "@/app/components/PoliticaTable";
import {
    getPoliticaActual,
    getPoliticas,
    createPolitica,
} from "@/app/services/politicaService";
import { Politica, PoliticaFormData } from "@/types/politica";

export default function PoliticasPage() {
    const router = useRouter();
    const [politicas, setPoliticas] = useState<Politica[]>([]);
    const [politicaActual, setPoliticaActual] = useState<Politica | null>(null);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState<{
        tipo: "success" | "error";
        texto: string;
    } | null>(null);

    useEffect(() => {
        loadPoliticas();
    }, []);

    const loadPoliticas = async () => {
        const [actualRes, todasRes] = await Promise.all([
            getPoliticaActual(),
            getPoliticas(),
        ]);
        
        if (actualRes.success) setPoliticaActual(actualRes.data);
        if (todasRes.success) setPoliticas(todasRes.data);
        
        if (!actualRes.success || !todasRes.success) {
            setMensaje({
                tipo: "error",
                texto: "Error al cargar las políticas",
            });
        }
        setLoading(false);
    };

    const handleFormSubmit = async (data: PoliticaFormData) => {
        setLoading(true);
        setMensaje(null);
        const res = await createPolitica(data);
        if (res.success) {
            setPoliticas((prev) => [res.data, ...prev]);
            setPoliticaActual(res.data);
            setMensaje({
                tipo: "success",
                texto: `✓ Política creada exitosamente. Ahora el plazo de reembolso es de ${res.data.diasReembolso} días.`,
            });
        } else {
            setMensaje({
                tipo: "error",
                texto: res.error,
            });
        }
        setLoading(false);
    };



    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <div className="p-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" /> Establecer Políticas
                    </h1>
                </div>

                {mensaje && (
                    <div
                        className={`mb-4 p-4 rounded-lg ${mensaje.tipo === "success"
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-red-50 border border-red-200 text-red-800"
                            }`}
                    >
                        {mensaje.texto}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                        <PoliticaForm
                            politicaActual={politicaActual}
                            onSubmit={handleFormSubmit}
                            loading={loading}
                        />
                    </div>
                    <div className="col-span-12 md:col-span-8">
                        <PoliticaTable
                            politicas={politicas}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
