"use client";

import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { consumirTicket, verificarTicket } from "@/app/services/ticketService";
import { Ticket } from "@/types/tickets";
import RoleGuard from "@/app/components/RoleGuard";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";


export default function QrScanPage() {
    const [mode, setMode] = useState<"verify" | "consume">("verify");
    const [data, setData] = useState<Ticket | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [tokenQr, setTokenQr] = useState<string | null>(null);

    // Reset state when switching modes
    useEffect(() => {
        resetState();
    }, [mode]);

    const resetState = () => {
        setData(null);
        setError(null);
        setSuccessMsg(null);
        setScanning(true);
        setLoading(false);
        setTokenQr(null);
    };

    const handleScan = async (detectedCodes: { rawValue: string }[]) => {
        if (!scanning || detectedCodes.length === 0) return;

        const rawValue = detectedCodes[0].rawValue;
        if (!rawValue) return;

        setScanning(false);
        setLoading(true);
        setError(null);
        setTokenQr(rawValue);

        try {
            const ticketData = await verificarTicket(rawValue);
            setData(ticketData);
        } catch (err: unknown) {
            setError((err as Error).message || "Error al verificar el código QR.");
            setScanning(false); 
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarConsumo = async () => {
        if (!tokenQr) return;
        setLoading(true);
        setError(null);
        try {
            const ticketComsumido = await consumirTicket(tokenQr);
            setData(ticketComsumido);
            setSuccessMsg("Ticket consumido con éxito. ¡Bienvenido!");
        } catch (err: unknown) {
            setError((err as Error).message || "Error al consumir el ticket.");
        } finally {
            setLoading(false);
        }
    };

    const handleError = (error: unknown) => {
        console.error(error);
    };

    return (
        <RoleGuard allowedRoles={["ORGANIZACION"]}>
            <div className="max-w-2xl mx-auto p-4 space-y-6">
                <h1 className="text-2xl font-bold text-center mb-6">Escáner de Tickets</h1>
                <p className="text-center text-gray-600 mb-6">Escanee el código QR para verificar y consumir el ticket.</p>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
                    {scanning ? (
                        <div className="relative aspect-square max-w-sm mx-auto bg-black">
                            <Scanner
                                onScan={handleScan}
                                onError={handleError}
                                components={{
                                    onOff: true,
                                    torch: true,
                                    zoom: true,
                                    finder: true,
                                }}
                                styles={{
                                    container: { width: '100%', height: '100%' }
                                }}
                            />
                            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 p-2">
                                Apunte la cámara al código QR
                            </p>
                        </div>
                    ) : (
                        <div className="p-8 text-center space-y-4">
                            {loading && <p className="text-blue-500 animate-pulse">Procesando...</p>}

                            {!loading && error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                                    <p className="font-semibold">Error</p>
                                    <p>{error}</p>
                                </div>
                            )}

                            {!loading && !error && data && (
                                <div className="space-y-4 text-left">
                                    <div className={`p-3 rounded-lg text-center font-bold text-white ${data.estado === 'consumido' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                        Estado: {data.estado.toUpperCase()}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-gray-500">Cliente:</span>
                                        <span className="font-medium text-right">{data.cliente?.nombre} {data.cliente?.apellido}</span>

                                        <span className="text-gray-500">Documento:</span>
                                        <span className="font-medium text-right">{data.cliente?.tipoDoc} {data.cliente?.nroDoc}</span>

                                        <span className="text-gray-500">Evento:</span>
                                        <span className="font-medium text-right">{data.tipoTicket?.evento?.nombre}</span>

                                        <span className="text-gray-500">Acceso:</span>
                                        <span className="font-medium text-right">{data.tipoTicket?.acceso}</span>

                                        {data.estado === 'consumido' && data.fechaConsumo && (
                                            <>
                                                <span className="text-gray-500">Consumido el:</span>
                                                <span className="font-medium text-right">
                                                    {new Date(data.fechaConsumo).toLocaleString()}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {successMsg && (
                                        <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center gap-3 mt-4">
                                            <CheckCircle className="h-5 w-5" />
                                            <p className="font-bold">{successMsg}</p>
                                        </div>
                                    )}

                                    {!successMsg && data.estado === 'pagado' && (
                                        <button
                                            onClick={handleConfirmarConsumo}
                                            disabled={loading}
                                            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                                            Confirmar Acceso
                                        </button>
                                    )}

                                    {!successMsg && data.estado !== 'pagado' && (
                                        <div className="p-4 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 flex items-center gap-3 mt-4">
                                            <AlertTriangle className="h-5 w-5" />
                                            <p className="font-semibold text-sm">Este ticket no puede ser consumido (Estado: {data.estado})</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={resetState}
                                className="mt-6 px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium w-full"
                            >
                                {scanning ? "Cancelar" : "Escanear otro"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </RoleGuard>
    );
}
