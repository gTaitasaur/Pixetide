import { ExtractedSwatch } from '../types/color';

const SWATCH_NAMES: Record<string, string> = {
  Vibrant: 'Vibrante',
  DarkVibrant: 'Vibrante Oscuro',
  LightVibrant: 'Vibrante Claro',
  Muted: 'Tenue',
  DarkMuted: 'Tenue Oscuro',
  LightMuted: 'Tenue Claro',
};

/**
 * Extrae la paleta de colores de una imagen usando node-vibrant y culori.
 * Ambas librerías se cargan dinámicamente (lazy loading) para no impactar
 * el peso inicial de la aplicación.
 */
export const extractColorsFromImage = async (imageUrl: string): Promise<ExtractedSwatch[]> => {
  // Lazy loading
  const { Vibrant } = await import('node-vibrant/browser');
  const culori: any = await import('culori');

  // Extraer paleta
  const palette = await Vibrant.from(imageUrl).getPalette();
  const swatches: ExtractedSwatch[] = [];

  // Los 6 slots estándar de node-vibrant
  const keys = ['Vibrant', 'LightVibrant', 'DarkVibrant', 'Muted', 'LightMuted', 'DarkMuted'];

  for (const key of keys) {
    const swatch = palette[key];
    if (!swatch) continue; // Si node-vibrant no encontró un color para este slot, lo omitimos silenciosamente

    const [r, g, b] = swatch.rgb;
    
    // Crear objeto color de culori (rango 0-1)
    const baseColor = { mode: 'rgb' as const, r: r / 255, g: g / 255, b: b / 255 };

    // Conversiones usando culori
    const hex = culori.formatHex(baseColor) || '#000000';
    const rgbStr = culori.formatRgb(baseColor) || `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    const hslStr = culori.formatHsl(baseColor) || '';
    
    // Oklch string manual basado en culori object
    const oklchObj = culori.converter('oklch')(baseColor);
    let oklchStr = '';
    if (oklchObj) {
      const l = Math.round((oklchObj.l || 0) * 100);
      const c = (oklchObj.c || 0).toFixed(3);
      const h = Math.round(oklchObj.h || 0);
      oklchStr = `oklch(${l}% ${c} ${h})`;
    }

    // Luminancia para decidir el color del texto
    const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
    const textColor = luminance > 0.65 ? '#1f2937' : '#ffffff'; // Texto oscuro si es muy claro

    swatches.push({
      name: SWATCH_NAMES[key] || key,
      hex: hex.toUpperCase(),
      rgb: rgbStr,
      hsl: hslStr,
      oklch: oklchStr,
      textColor
    });
  }

  return swatches;
};

/**
 * Genera armonías cromáticas basadas en un color HEX usando el espacio OKLCH y chroma-js para escalas.
 */
export const generateHarmonies = async (baseHex: string): Promise<import('../types/color').HarmonicColor[]> => {
  const culori: any = await import('culori');
  const chromaModule = await import('chroma-js');
  const chroma = chromaModule.default || chromaModule;

  const baseColor = culori.parse(baseHex);
  if (!baseColor) return [];

  const oklch = culori.converter('oklch')(baseColor);
  const { c, h } = oklch;
  const hue = h || 0;

  const rotate = (angle: number) => (hue + angle + 360) % 360;

  const types = [
    { name: 'Complementario', angle: 180 },
    { name: 'Análogo 1', angle: 30 },
    { name: 'Análogo 2', angle: -30 },
    { name: 'Triádico 1', angle: 120 },
    { name: 'Triádico 2', angle: 240 },
  ];

  return types.map(t => {
    // Generamos el color central armónico manteniendo la misma luminosidad del base y croma
    // Aquí es clave OKLCH, ya que nos da un color equilibrado
    const newColor = { mode: 'oklch', l: oklch.l, c, h: rotate(t.angle) };
    const hexCenter = culori.formatHex(newColor) || '#000000';
    
    // Generamos una escala de 7 colores (Blanco -> Color Central -> Negro)
    const scale = chroma.scale(['#ffffff', hexCenter, '#000000']).mode('oklch').colors(7);
    
    // Descartamos los extremos (blanco puro y negro puro) para quedarnos con 5
    const selectedColors = scale.slice(1, 6);

    const colors = selectedColors.map((hex: string) => {
      const parsed = culori.parse(hex);
      const colorOklch = culori.converter('oklch')(parsed);
      const textL = colorOklch?.l || 0;
      const textColor = textL > 0.65 ? '#1f2937' : '#ffffff';

      // Formatear RGB
      const rgb = culori.converter('rgb')(parsed);
      const rgbStr = `rgb(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)})`;

      // Formatear HSL
      const hsl = culori.converter('hsl')(parsed);
      const hslStr = `hsl(${Math.round(hsl.h || 0)}°, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;

      // Formatear OKLCH (el string para mostrar)
      const oklchStr = `oklch(${colorOklch.l.toFixed(2)}, ${colorOklch.c.toFixed(2)}, ${Math.round(colorOklch.h || 0)}°)`;

      return {
        hex: hex.toUpperCase(),
        rgb: rgbStr,
        hsl: hslStr,
        oklch: oklchStr,
        textColor
      };
    });

    return {
      type: t.name,
      colors
    };
  });
};
