export const passwordMessage = "La contraseña debe tener al menos 6 caracteres"

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) return passwordMessage
  return null
}
