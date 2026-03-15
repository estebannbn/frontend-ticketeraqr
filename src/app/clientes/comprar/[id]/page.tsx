/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Evento, TipoTicket } from "@/types/evento";
import { getEventoById } from "@/app/services/eventosService";
import { getClienteByUsuarioId } from "@/app/services/clientService";
import { crearTicket } from "@/app/services/ticketService";
import Footer from "@/app/components/footer";
import { Calendar, MapPin, Ticket as TicketIcon, CheckCircle, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import Link from "next/link";
import TicketQr from "../../../components/ticketsQR";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/app/components/ui/AuthModal";

export default function PurchasePage() {
    const { user, isAuthenticated } = useAuth();
    const { id } = useParams();
    const router = useRouter();
    const fetchingPreferenceFor = useRef<number | null>(null);
    const [evento, setEvento] = useState<Evento | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTipo, setSelectedTipo] = useState<TipoTicket | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [purchasedTicket, setPurchasedTicket] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        const res = await getEventoById(Number(id));
        if (res.success) {
            setEvento(res.data);
            if (res.data.tipoTickets.length > 0) {
                const primerTicketConStock = res.data.tipoTickets.find(t => (t._count?.tickets || 0) < t.cantMaxPorTipo) || res.data.tipoTickets[0];
                setSelectedTipo(primerTicketConStock);
            }
        } else {
            setError(res.error || "No se pudo cargar la información del evento.");
        }
        setLoading(false);
    };

    // Removes automatic handlePurchase on selection to prevent overselling
    // User must now explicitly click "Comprar Entrada"

    const handlePurchase = async () => {
        if (!selectedTipo || !evento || purchasing) return;

        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
            return;
        }



        try {
            setPurchasing(true);
            setError(null);

            const idUsuario = user?.idUsuario || (user as { id?: number }).id;
            if (!idUsuario) {
                setIsAuthModalOpen(true);
                setPurchasing(false);
                return;
            }

            // Get the client ID for this user
            let cliente;
            try {
                cliente = await getClienteByUsuarioId(Number(idUsuario));
            } catch (err) {
                console.warn("Cliente no encontrado:", err);
                setError("Tu usuario no tiene un perfil de cliente asociado. Por favor contacta soporte.");
                setPurchasing(false);
                return;
            }

            const response = await crearTicket({
                idCliente: cliente.idCliente,
                idTipoTicket: selectedTipo.idTipoTicket
            });

            if (response.data.init_point) {
                // Redirección directa al checkout de MercadoPago
                window.location.href = response.data.init_point;
            } else {
                setError("Error al iniciar el pago con Mercado Pago.");
                setPurchasing(false);
            }
        } catch (err: unknown) {
            setError((err as Error).message || "Error al procesar la compra. Por favor, reintenta.");
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Cargando detalles del evento...</p>
            </div>
        );
    }

    if (!evento) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-red-500 font-bold text-xl mb-4">Evento no encontrado</p>
                <Link href="/" className="text-blue-600 hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                </Link>
            </div>
        );
    }

    if (purchasedTicket) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 uppercase">
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-green-100 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Compra exitosa!</h2>
                        <p className="text-gray-600 mb-8">Tu entrada para <span className="font-semibold">{evento.nombre}</span> ha sido generada.</p>

                        <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                            <TicketQr ticket={purchasedTicket} qr={purchasedTicket.qr} />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/clientes/mis-tickets"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
                            >
                                Ver Mis Tickets
                            </Link>
                            <Link
                                href="/"
                                className="w-full text-gray-500 font-medium hover:text-gray-900 transition"
                            >
                                Volver al Inicio
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Event Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <img
                                src={evento.foto || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200"}
                                alt={evento.nombre}
                                className="w-full h-80 object-cover"
                            />
                            <div className="p-8">
                                <h1 className="text-4xl font-extrabold text-gray-900 mb-6">{evento.nombre}</h1>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <div className="p-3 bg-blue-100 rounded-xl">
                                            <Calendar className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">Fecha y Hora</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {new Date(evento.fechaHoraEvento).toLocaleDateString("es-AR", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                })}
                                            </p>
                                            <p className="text-gray-600">
                                                {new Date(evento.fechaHoraEvento).toLocaleTimeString("es-AR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })} hs
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                                        <div className="p-3 bg-purple-100 rounded-xl">
                                            <MapPin className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-bold uppercase tracking-wider">Lugar</p>
                                            <p className="text-lg font-semibold text-gray-900">{evento.ubicacion}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-blue max-w-none">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Sobre el evento</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">
                                        {evento.descripcion || "No hay una descripción disponible para este evento. Pero seguro será una experiencia inolvidable."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Sidebar */}
                    <div className="lg:col-span-1">
                        {(() => {
                            const totalVendidos = evento.tipoTickets.reduce((acc, t) => acc + (t._count?.tickets || 0), 0);
                            const eventoAgotado = totalVendidos >= evento.capacidadMax;

                            if (evento.estado === 'CANCELADO') {
                                return (
                                    <div className="bg-red-50 rounded-3xl shadow-xl border border-red-100 p-8 sticky top-8 text-center">
                                        <h3 className="text-2xl font-bold text-red-700 mb-4">Evento Cancelado</h3>
                                        <p className="text-red-600 font-medium">Este evento ha sido cancelado por la organización y la venta de entradas de este evento se ha cerrado. Se realizarán reembolsos automáticos.</p>
                                    </div>
                                );
                            }

                            if (eventoAgotado) {
                                return (
                                    <div className="bg-gray-50 rounded-3xl shadow-xl border border-gray-200 p-8 sticky top-8 text-center">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Evento Agotado</h3>
                                        <p className="text-gray-600 font-medium">Se han vendido todas las entradas disponibles para este evento. ¡Gracias por el interés!</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <TicketIcon className="w-6 h-6 text-blue-600" />
                                        Seleccionar Entradas
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        {evento.tipoTickets.map((tipo) => {
                                            const tipoAgotado = (tipo._count?.tickets || 0) >= tipo.cantMaxPorTipo;
                                            const isSelected = selectedTipo?.idTipoTicket === tipo.idTipoTicket;

                                            return (
                                                <button
                                                    key={tipo.idTipoTicket}
                                                    onClick={() => {
                                                        if (!tipoAgotado) {
                                                            setSelectedTipo(tipo);
                                                        }
                                                    }}
                                                    disabled={tipoAgotado}
                                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${tipoAgotado
                                                            ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                                            : isSelected
                                                                ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-50"
                                                                : "border-gray-100 hover:border-blue-200"
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-gray-900">{tipo.tipo}</span>
                                                        <div className="flex items-center gap-3">
                                                            {tipoAgotado && (
                                                                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg uppercase tracking-wide">
                                                                    Sin stock
                                                                </span>
                                                            )}
                                                            <span className="text-xl font-extrabold text-blue-600">${tipo.precio}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                                        <span>{tipo.acceso}</span>
                                                        {tipo.sector && <span className="italic">Sector: {tipo.sector}</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-6 flex items-start gap-2">
                                            <span className="font-bold">Error:</span> {error}
                                        </div>
                                    )}

                                    <div className="space-y-6 pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-center text-lg mb-4">
                                            <span className="text-gray-600">Total</span>
                                            <span className="text-3xl font-black text-gray-900">${selectedTipo?.precio || 0}</span>
                                        </div>

                                        <div className="w-full">
                                            {purchasing ? (
                                                <div className="flex items-center justify-center py-6 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                                                    <span className="text-gray-500 font-medium">Comunicando con sistema de autorización de tarjeta...</span>
                                                </div>
                                            ) : !isAuthenticated ? (
                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => setIsAuthModalOpen(true)}
                                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200"
                                                    >
                                                        Inicia Sesión para Comprar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={handlePurchase}
                                                        disabled={!selectedTipo}
                                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Comprar Entrada
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-center text-xs text-gray-400 mt-6">
                                            Al confirmar, aceptás nuestras políticas de reembolso y términos de servicio.
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
