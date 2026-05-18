/**
 * Utilidades para el manejo de archivos.
 * Aplicamos principios de OWASP validando el tamaño y tipo mime.
 */

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB como límite heurístico

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ValidationResult => {
  // Validación de tipo (OWASP: evitar scripts u otros binarios maliciosos)
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'El archivo seleccionado no es una imagen válida. Usa formatos como JPG, PNG o WebP.',
    };
  }

  // Validación de peso para no sobrecargar el navegador de usuarios
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'La imagen es muy pesada. Por favor selecciona una imagen de menos de 20MB.',
    };
  }

  return { isValid: true };
};
