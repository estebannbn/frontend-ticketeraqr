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
      reset({ nombreCategoria: "" });
    } catch (err: any) {
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(err.message);
      } catch (e) {
        // Not a JSON error string
      }

      const isValidation = parsedError?.isValidationError || err.isValidationError;
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
          setGeneralError("Revise los datos ingresados e intente nuevamente.");
        }
      } else {
        const errorMsg = err?.message || (err?.isValidationError ? "Por favor, revise los errores indicados." : "Ocurrió un error inesperado. Intente nuevamente.");
        setGeneralError(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
      }
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
        <label htmlFor="nombreCategoria" className="block mb-2 text-sm font-medium">
          Nombre de la Categoría
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
          className={`w-full p-2 border rounded outline-none transition 
          ${errors.nombreCategoria
              ? "border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-300 focus:ring-2 focus:ring-blue-200"
            }`}
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