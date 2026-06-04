import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../../core/i18n/useLocale';

/**
 * Footer rediseñado por completo desde cero con Tailwind CSS v4.
 * 
 * Alineación Total con el Prototipo:
 * - Copia el 100% de la densidad, estética y estructura en tres columnas (Producto, Legal, Comunidad).
 * - Utiliza placeholders (href="#") para links no implementados para futura expansión.
 * - Integra los enlaces reales del proyecto (GitHub y Ko-fi).
 * - Incorpora el logo oficial pixelado "Núcleo Púrpura" a escala reducida (size-6, text-2xl) para correcta jerarquía visual.
 * - Incluye los tres botones de redes sociales (GitHub, X, Ko-fi) con sus respectivos SVGs.
 * - Localización bilingüe de textos y barra legal inferior de privacidad.
 */
export const Footer: React.FC = () => {
  const { t, locale } = useLocale();

  const homePath = locale === 'es' ? '/es/' : '/';

  const taglineText = locale === 'es' ? (
    <>
      Creado para quienes quieren editar imágenes sin entregar sus archivos. Pixetide procesa todo localmente en tu navegador.
      <br /><br />
      Gratis, sin publicidad y sostenido por la comunidad.
    </>
  ) : (
    <>
      Created for those who want to edit images without giving up their files. Pixetide processes everything locally in your browser.
      <br /><br />
      Free, no ads, and supported by the community.
    </>
  );

  const bottomMessage = locale === 'es'
    ? 'Nada sale de tu 💻 computador'
    : 'Nothing leaves your 💻 computer';

  return (
    <footer className="w-full bg-white pt-24 pb-12 border-t border-gray-100 mt-24 relative z-10">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-16 md:gap-x-12 mb-24">

          {/* Columna 1: Brand & Tagline */}
          <div className="md:col-span-5 lg:col-span-6 flex flex-col items-start">
            <Link
              to={homePath}
              className="group flex items-center gap-2.5 text-3xl font-serif font-medium text-primary tracking-tight mb-6 hover:opacity-90 transition-opacity select-none"
            >
              {/* Logo Pixelado Miniaturizado ("Núcleo Púrpura") con Rotación Diamante */}
              <div className="size-6 flex items-center justify-center rotate-45 transition-transform duration-500 ease-out group-hover:scale-120">
                <svg className="size-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Píxeles Negros Exteriores */}
                  <rect x="6" y="6" width="4" height="4" fill="black" />
                  <rect x="14" y="6" width="4" height="4" fill="black" />
                  <rect x="6" y="14" width="4" height="4" fill="black" />
                  <rect x="14" y="14" width="4" height="4" fill="black" />
                  {/* Núcleo Púrpura Central */}
                  <rect x="10" y="10" width="4" height="4" fill="#a855f7" />
                </svg>
              </div>
              <span className="translate-y-[0px]">Pixetide.</span>
            </Link>

            <p className="font-sans text-lg text-neutral-700 max-w-sm leading-relaxed font-light mb-8">
              {taglineText}
            </p>

            {/* Botones de Redes Sociales (GitHub, X, Ko-fi) */}
            <div className="flex gap-4">
              {/* GitHub */}
              <a
                href="https://github.com/gTaitasaur"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-primary hover:bg-neutral-50 transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href="#"
                title="Twitter / X"
                onClick={(e) => e.preventDefault()}
                className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-primary hover:bg-neutral-50 transition-colors cursor-not-allowed"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Ko-fi */}
              <a
                href="https://ko-fi.com/pixetide"
                target="_blank"
                rel="noopener noreferrer"
                title={t('nav.support')}
                className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-primary hover:bg-neutral-50 transition-colors"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 10.128 11.169 9.8 11.169 9.8s9.324.224 10.666-8.204c.486-3.058.461-7.146.461-7.146h1.272c1.785 0 2.242-1.554 2.242-1.554a3.84 3.84 0 00-.728-2.585l.096.096zm-4.708 3.52c-.187 3.141-2.906 3.104-2.906 3.104H4.189c-.656 0-.626-.694-.626-.694V7.47c0-.756.702-.746.702-.746h11.211s2.242.062 2.456 2.443c.224 2.481.221 3.299.221 3.299h.004zm2.74-1.284H19.23V9.585h2.61v1.599z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Columnas de Links */}
          <div className="md:col-span-7 lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-8">

            {/* Columna: Producto */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary select-none">
                {locale === 'es' ? 'Producto' : 'Product'}
              </h3>
              <div className="flex flex-col gap-3">
                <Link
                  to={`${homePath}#tools-grid-section`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {locale === 'es' ? 'Herramientas' : 'Tools'}
                </Link>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-muted-foreground/50 hover:text-primary/60 transition-colors cursor-not-allowed"
                >
                  {locale === 'es' ? 'Documentación' : 'Documentation'}
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-muted-foreground/50 hover:text-primary/60 transition-colors cursor-not-allowed"
                >
                  Release Notes
                </a>
              </div>
            </div>

            {/* Columna: Legal */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary select-none">
                Legal
              </h3>
              <div className="flex flex-col gap-3">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-muted-foreground/50 hover:text-primary/60 transition-colors cursor-not-allowed"
                >
                  {locale === 'es' ? 'Privacidad' : 'Privacy'}
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-muted-foreground/50 hover:text-primary/60 transition-colors cursor-not-allowed"
                >
                  {locale === 'es' ? 'Términos' : 'Terms'}
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-muted-foreground/50 hover:text-primary/60 transition-colors cursor-not-allowed"
                >
                  {locale === 'es' ? 'Seguridad' : 'Security'}
                </a>
              </div>
            </div>

            {/* Columna: Comunidad */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary select-none">
                {locale === 'es' ? 'Comunidad' : 'Community'}
              </h3>
              <div className="flex flex-col gap-3">
                <a
                  href="https://github.com/gTaitasaur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-muted-foreground/50 hover:text-primary/60 transition-colors cursor-not-allowed"
                >
                  Twitter / X
                </a>
                <a
                  href="https://ko-fi.com/pixetide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Ko-fi
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-muted-foreground/50 hover:text-primary/60 transition-colors cursor-not-allowed"
                >
                  {locale === 'es' ? 'Contacto' : 'Contact'}
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 select-none">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span className="text-xs text-muted-foreground font-mono">
              © {new Date().getFullYear()} Pixetide
            </span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-neutral-200"></span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
              {bottomMessage}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
