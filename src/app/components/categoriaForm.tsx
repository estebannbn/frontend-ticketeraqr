import { useEffect, useState } from "react";
import { Categoria } from "@/types/categoria";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categoriaSchema = z.object({
  idCategoria: z.number(),

  nombreCategoria: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(50, "El nombre no puede superar los 50 caracteres.")
    .refine((value) => value.length > 0, {
      message: "El nombre de la categoría es obligatorio.",
    }),
});

interface CategoriaFormProps {
  onSubmit: (data: Categoria) => Promise<void> | void;
  loading: boolean;
}

export const CategoriaForm: React.FC<CategoriaFormProps> = ({
  onSubmit,
  loading,
}) => {
  const [generalError, setGeneralError] = useState("");

  // Helper para detectar si un campo tiene error (local o del servidor)
  const hasError = (fieldName: string, keywords: string[] = []): boolean => {
    if (errors[fieldName as keyof Categoria]) return true;
    if (!generalError) return false;
    const lowerError = generalError.toLowerCase();
    const allKeywords = [fieldName.toLowerCase(), ...keywords.map(k => k.toLowerCase())];
    return allKeywords.some(kw => lowerError.includes(kw));
  };

  const getLabelStyle = (fieldName: string, keywords: string[] = []) => {
    return `block mb-2 text-sm font-semibold transition-colors ${hasError(fieldName, keywords) ? 'text-red-600 flex items-center gap-1' : 'text-gray-700'}`;
  };

  const getInputStyle = (fieldName: string, baseClass: string, keywords: string[] = []) => {
    return `${baseClass} transition-all ${hasError(fieldName, keywords) ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:border-blue-500'}`;
  };

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<Categoria>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      idCategoria: 0,
      nombreCategoria: "",
    },
  });

  const onFormSubmit = async (data: Categoria) => {
    try {
      setGeneralError("");
      await onSubmit(data);
    } catch (err: any) {
      console.error("Error al crear categoría:", err);
      let parsedError: any = null;
      let errorMsg = err?.message || "Ocurrió un error inesperado. Intente nuevamente.";

      try {
        parsedError = JSON.parse(err.message);
      } catch (e) {
        // Not a JSON error string
      }

      const isValidation = parsedError?.isValidationError || err.isValidationError || errorMsg.includes("validación");
      const details = parsedError?.details || err.details;

      if (isValidation && details) {
        let isHandled = false;
        details.forEach((issue: { path: string; message: string }) => {
          if (issue.path === "body.nombreCategoria" || issue.path === "nombreCategoria") {
            setError("nombreCategoria", {
              type: "backend",
              message: issue.message || "Ya existe una categoría con ese nombre.",
            });
            isHandled = true;
          }
        });
        if (!isHandled) {
          setGeneralError(errorMsg);
        }
      } else {
        setGeneralError(errorMsg);
      }
    } finally {
      setValue("nombreCategoria", "");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-4 p-4 bg-white rounded-lg shadow w-full max-w-md"
    >

      {generalError && (
        <div className="p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
          {generalError}
        </div>
      )}

      <div>
        <label htmlFor="nombreCategoria" className={getLabelStyle("nombreCategoria", ["categoría", "nombre"])}>
          {hasError("nombreCategoria", ["categoría", "nombre"]) && <span>⚠️</span>} Nombre de la Categoría
        </label>

        <input
          type="text"
          id="nombreCategoria"
          placeholder="Ej: Recitales, Deportes, Conferencias..."
          {...register("nombreCategoria")}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.value.length > 0) {
              target.value = target.value.charAt(0).toUpperCase() + target.value.slice(1).toLowerCase();
            }
          }}
          className={getInputStyle("nombreCategoria", "w-full p-2 border rounded outline-none transition", ["categoría", "nombre"])}
        />

        {errors.nombreCategoria && (
          <p className="text-red-500 text-sm mt-1">
            {errors.nombreCategoria.message}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? "Guardando..." : "Crear Categoría"}
        </button>
      </div>
    </form>
  );
};

export default CategoriaForm;