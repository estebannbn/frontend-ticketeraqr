// UI Improvement - Enhanced Error Highlighting and Visibility System
import { useEffect, useState } from "react";
import { EventoFormData } from "@/types/evento";
import { Categoria } from "@/types/categoria";
import { getCategorias } from "@/app/services/categoriaService";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getPoliticaActual } from "@/app/services/politicaService";
import { Politica } from "@/types/politica";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Argentina/Buenos_Aires";

const eventoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
  ubicacion: z.string().min(1, "La ubicación es requerida"),
  foto: z.string().min(1, "La foto es requerida"),
  fechaHoraEvento: z.string().min(1, "La fecha del evento es requerida"),
  fechaCreacion: z.string().min(1, "La fecha de creación es requerida"),
  capacidadMax: z.preprocess((val) => Number(val), z.number().min(1, "La capacidad debe ser al menos 1")),
  idCategoria: z.preprocess((val) => Number(val), z.number().min(1, "Seleccione una categoría")),
  idOrganizacion: z.preprocess((val) => Number(val), z.number().min(1, "Seleccione una organización")),
  idEvento: z.number().optional(),
  tipoTickets: z.array(z.any()).default([]),
});

interface EventoFormProps {
  initialData?: EventoFormData;
  isEditing: boolean;
  onSubmit: (data: EventoFormData) => void;
  onCancel?: () => void;
  loading: boolean;
  tipoTickets: { tipo: string; acceso: string; precio: number; cantMaxPorTipo: number }[];
  onRemoveTicket?: (index: number) => void;
  serverError?: string | null;
}

export const EventoForm: React.FC<EventoFormProps> = ({
  initialData,
  isEditing,
  onSubmit,
  onCancel,
  loading,
  tipoTickets,
  onRemoveTicket,
  serverError: externalError,
}) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [politica, setPolitica] = useState<Politica | null>(null);
  const [localServerError, setLocalServerError] = useState<string | null>(null);

  const serverError = externalError || localServerError;

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Helper para detectar si un campo tiene error (local o del servidor)
  const hasError = (fieldName: keyof EventoFormData, keywords: string[] = []): boolean => {
    if (errors[fieldName]) return true;
    if (!serverError) return false;
    const lowerError = serverError.toLowerCase();
    // Siempre incluimos el nombre del campo en minúsculas como palabra clave
    const allKeywords = [fieldName.toString().toLowerCase(), ...keywords.map(k => k.toLowerCase())];
    return allKeywords.some(kw => lowerError.includes(kw));
  };

  const getLabelStyle = (fieldName: keyof EventoFormData, keywords: string[] = []) => {
    return `block mb-2 text-sm font-semibold transition-colors ${hasError(fieldName, keywords) ? 'text-red-600 flex items-center gap-1' : 'text-gray-700'}`;
  };

  const getInputStyle = (fieldName: keyof EventoFormData, baseClass: string, keywords: string[] = []) => {
    return `${baseClass} transition-all ${hasError(fieldName, keywords) ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:border-blue-500'}`;
  };

  // Obtener fecha y hora actual en Argentina (UTC-3)
  const getMinDateTime = () => {
    const diasReembolso = politica?.diasReembolso || 0;
    const fechaMinima = dayjs().tz(TIMEZONE).startOf('day').add(diasReembolso, 'day');
    // El input datetime-local espera formato "YYYY-MM-DDTHH:mm" sin Z
    return fechaMinima.format('YYYY-MM-DDTHH:mm');
  };

  const minDateTime = getMinDateTime();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema) as unknown as Resolver<EventoFormData>,
    defaultValues: initialData || {
      nombre: "",
      fechaCreacion: new Date().toISOString().slice(0, 16),
      fechaHoraEvento: "",
      descripcion: "",
      ubicacion: "",
      foto: "",
      capacidadMax: "" as unknown as number,
      tipoTickets: [],
      idCategoria: 1,
      idOrganizacion: 1,
    },
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [catRes, polRes] = await Promise.all([
          getCategorias(),
          getPoliticaActual()
        ]);

        if (catRes.success) {
          setCategorias(catRes.data);
        } else {
          console.error("Error cargando categorías:", catRes.error);
        }

        if (polRes.success) {
          setPolitica(polRes.data);
        }
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as keyof EventoFormData, value);
      });
    }
  }, [initialData, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadUrl = "/api/upload";

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir la imagen");

      const data = await res.json();
      setValue("foto", data.url || data.secure_url || data.fileUrl);

    } catch (error) {
      console.error("Error subiendo imagen:", error);
      setImageError("No se pudo subir la imagen. Intenta nuevamente.");
      const tempUrl = URL.createObjectURL(file);
      setValue("foto", tempUrl);
    } finally {
      setUploadingImage(false);
    }
  };

  const onFormSubmit = (data: EventoFormData) => {
    setLocalServerError(null);
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-4 p-4 bg-white rounded-lg shadow"
    >
      <div>
        <label className={getLabelStyle("nombre")}>
          {hasError("nombre") && <span>⚠️</span>} Nombre
        </label>
        <input
          type="text"
          {...register("nombre")}
          className={getInputStyle("nombre", "w-full p-2 border rounded")}
        />
        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className={getLabelStyle("descripcion")}>
          {hasError("descripcion") && <span>⚠️</span>} Descripción
        </label>
        <textarea
          {...register("descripcion")}
          className={getInputStyle("descripcion", "w-full p-2 border rounded")}
          rows={3}
        />
        {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
      </div>

      <div>
        <label className={getLabelStyle("ubicacion")}>
          {hasError("ubicacion") && <span>⚠️</span>} Ubicación
        </label>
        <input
          type="text"
          {...register("ubicacion")}
          className={getInputStyle("ubicacion", "w-full p-2 border rounded")}
        />
        {errors.ubicacion && <p className="text-red-500 text-xs mt-1">{errors.ubicacion.message}</p>}
      </div>

      <div>
        <label className={getLabelStyle("foto")}>
          {hasError("foto") && <span>⚠️</span>} Foto del Evento
        </label>
        <div className="flex gap-4 items-start">
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className={getInputStyle("foto", "w-full p-2 border text-sm rounded bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100")}
            />

            <input type="hidden" {...register("foto")} />

            {uploadingImage && <p className="text-blue-600 text-xs mt-1">Subiendo imagen...</p>}
            {imageError && <p className="text-red-500 text-xs mt-1">{imageError}</p>}
            {errors.foto && !uploadingImage && <p className="text-red-500 text-xs mt-1">{errors.foto.message}</p>}
          </div>

          {watch("foto") && (
            <div className="h-24 w-36 shrink-0 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative shadow-sm">
              <img
                src={watch("foto")}
                alt="Vista previa"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={(e) => {
                  (e.target as HTMLImageElement).style.display = 'block';
                }}
              />
              <button
                type="button"
                onClick={() => setValue("foto", "")}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-75 hover:opacity-100 transition-opacity"
                title="Quitar foto"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className={getLabelStyle("fechaHoraEvento", ["fecha", "minutos", "horas", "política", "días", "anticipación"])}>
            {hasError("fechaHoraEvento", ["fecha", "minutos", "horas", "política", "días", "anticipación"]) && <span>⚠️</span>} Fecha y Hora del Evento
          </label>
          <input
            type="datetime-local"
            {...register("fechaHoraEvento")}
            min={minDateTime}
            onKeyDown={(e) => e.preventDefault()}
            className={getInputStyle("fechaHoraEvento", "w-full p-2 border rounded", ["fecha", "minutos", "horas", "política", "días", "anticipación"])}
          />
          {errors.fechaHoraEvento && <p className="text-red-500 text-xs mt-1">{errors.fechaHoraEvento.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={getLabelStyle("capacidadMax", ["capacidad", "cupos"])}>
            {hasError("capacidadMax", ["capacidad", "cupos"]) && <span>⚠️</span>} Capacidad Máxima
          </label>
          <input
            type="number"
            {...register("capacidadMax")}
            className={getInputStyle("capacidadMax", "w-full p-2 border rounded", ["capacidad", "cupos"])}
          />
          {errors.capacidadMax && <p className="text-red-500 text-xs mt-1">{errors.capacidadMax.message}</p>}
        </div>

        <div>
          <label className={getLabelStyle("idCategoria", ["categoría", "categoria"])}>
            {hasError("idCategoria", ["categoría", "categoria"]) && <span>⚠️</span>} Categoría
          </label>
          <select
            {...register("idCategoria")}
            className={getInputStyle("idCategoria", "w-full p-2.5 border rounded-lg bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block", ["categoría", "categoria"])}
          >
            <option value="">Seleccione...</option>
            {categorias.map(cat => (
              <option key={cat.idCategoria} value={cat.idCategoria}>
                {cat.nombreCategoria}
              </option>
            ))}
          </select>
          {errors.idCategoria && <p className="text-red-500 text-xs mt-1">{errors.idCategoria.message}</p>}
        </div>
      </div>

      {tipoTickets && tipoTickets.length > 0 && (
        <div className="mt-4 p-4 border border-blue-100 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-bold text-blue-900 mb-2">Tipos de Ticket Agregados:</h4>
          <ul className="space-y-2">
            {tipoTickets.map((ticket, index) => (
              <li key={index} className="text-sm flex justify-between items-center bg-white px-3 py-2 rounded shadow-sm">
                <div>
                  <span className="font-semibold text-gray-700">{ticket.tipo} ({ticket.acceso})</span>
                  <span className="text-green-600 font-bold ml-2">${ticket.precio}</span>
                  <span className="text-gray-500 text-xs ml-2">Cant: {ticket.cantMaxPorTipo}</span>
                </div>
                {onRemoveTicket && (
                  <button
                    type="button"
                    onClick={() => onRemoveTicket(index)}
                    className="text-red-500 hover:text-red-700 p-1 font-bold text-lg"
                    title="Eliminar ticket"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-bold flex items-center gap-2 animate-pulse">
            ⚠️ {serverError}
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
        </button>

        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};