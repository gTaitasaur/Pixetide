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
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    '.svg', '.heic', '.heif', '.tiff', '.tif', '.bmp'
  ];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  // Validación de tipo (OWASP: evitar scripts u otros binarios maliciosos)
  const isImageMime = file.type.startsWith('image/');
  const isAllowedExt = allowedExtensions.includes(ext);

  if (!isImageMime && !isAllowedExt) {
    return {
      isValid: false,
      error: 'El archivo seleccionado no es un formato de imagen soportado. Usa JPG, PNG, WebP, GIF, SVG, HEIC, HEIF o BMP.',
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
