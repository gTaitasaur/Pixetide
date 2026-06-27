import React, { useState, useEffect, useRef } from 'react';
import { ImageComparisonSlider } from './ImageComparisonSlider';
// @ts-expect-error - Vite Web Worker import syntax
import BgWorker from './bgRemoval.worker?worker';
import { MaskEditor } from './MaskEditor';
import { ToolError } from '../../shared/components/Errors/ToolError';
import { useLocale } from '../../core/i18n/useLocale';
import { LoaderPrime } from '../../shared/components/UI/Loader/LoaderPrime';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { 
  Trash2, 
  Upload, 
  Download, 
  Sliders, 
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';
import './BackgroundRemoverModule.css';

type ProcessingState = 'idle' | 'ready_to_process' | 'downloading_model' | 'processing' | 'done' | 'editing_mask' | 'error';

export const BackgroundRemoverModule: React.FC = () => {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  const isModelPreloaded = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // ── INICIALIZACIÓN DEL WORKER Y PRECARGA ──
  useEffect(() => {
    workerRef.current = new BgWorker();

    workerRef.current!.onmessage = (e) => {
      const { type, blob, message } = e.data;

      if (type === 'preloaded') {
        isModelPreloaded.current = true;
        setStatus(prev => {
          if (prev === 'downloading_model') return 'processing';
          return prev;
        });
      } 
      else if (type === 'progress') {
        setStatus(prev => {
          if (prev === 'processing') return 'downloading_model';
          return prev;
        });
      }
      else if (type === 'result') {
        isModelPreloaded.current = true;
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setStatus('done');
        showToast(
          locale === 'es' ? 'Fondo eliminado correctamente.' : 'Background successfully removed.', 
          'success'
        );
      }
      else if (type === 'error') {
        console.error("Error desde el worker:", message);
        setErrorMessage(message || t('shared.errorProcessing'));
        setStatus('error');
        showToast(
          locale === 'es' ? 'Ocurrió un error al quitar el fondo.' : 'An error occurred while removing background.', 
          'error'
        );
      }
    };

    workerRef.current!.postMessage({ action: 'preload' });

    return () => { 
      workerRef.current?.terminate(); 
    };
  }, [t, locale, showToast]);

  // Liberar previews ObjectURL para evitar fugas de memoria
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [originalUrl, resultUrl]);

  // ── PROCESAMIENTO INVOCADO POR EL USUARIO ──
  const startProcessing = () => {
    if (!file) return;

    if (!isModelPreloaded.current) {
      setStatus('downloading_model');
    } else {
      setStatus('processing');
    }

    workerRef.current?.postMessage({ action: 'remove', file });
  };

  const handleImageSelected = (url: string, selectedFile: File) => {
    // Validar formato y tamaño básico (OWASP / Performance)
    const validation = validateImageFile(selectedFile);
    if (!validation.isValid) {
      showToast(validation.error || 'Archivo inválido', 'error');
      return;
    }

    // Validar compatibilidad específica con la remoción de fondo (sólo JPG, JPEG, PNG, WebP)
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      showToast(
        locale === 'es'
          ? 'Formato no soportado. Para quitar el fondo, sube una imagen en formato JPG, JPEG, PNG o WebP.'
          : 'Unsupported format. To remove background, please upload a JPG, JPEG, PNG, or WebP image.',
        'error'
      );
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    
    setOriginalUrl(url);
    setResultUrl(null);
    setFile(selectedFile);
    setStatus('ready_to_process');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const url = URL.createObjectURL(selectedFile);
      handleImageSelected(url, selectedFile);
      e.target.value = '';
    }
  };

  const handleSaveMask = (newBlob: Blob) => {
    const url = URL.createObjectURL(newBlob);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(url);
    setStatus('done');
    showToast(
      locale === 'es' ? 'Recorte perfeccionado guardado.' : 'Refined cut successfully saved.', 
      'success'
    );
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const baseName = file?.name.substring(0, file.name.lastIndexOf('.')) || 'imagen';
    const prefix = locale === 'es' ? 'Pixetide_QuitarFondo_' : 'Pixetide_NoBG_';
    a.download = `${prefix}${baseName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(
      locale === 'es' ? 'Imagen descargada correctamente.' : 'Image downloaded successfully.', 
      'success'
    );
  };

  const handleClear = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setFile(null);
    setStatus('idle');
    showToast(
      locale === 'es' ? 'Lienzo limpiado.' : 'Workspace cleared.', 
      'success'
    );
  };

  // Eventos de Drag & Drop para el visualizador
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      const url = URL.createObjectURL(selectedFile);
      handleImageSelected(url, selectedFile);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // ── RENDER ──

  const renderSidebarControls = () => {
    const isRemoveBgDisabled = !file || status === 'downloading_model' || status === 'processing' || status === 'done';
    const isRetouchDisabled = status !== 'done';

    return (
      <div className="space-y-3">
        <button
          onClick={startProcessing}
          disabled={isRemoveBgDisabled}
          className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-neutral-800 text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>
            {status === 'downloading_model' || status === 'processing'
              ? (locale === 'es' ? 'PROCESANDO...' : 'PROCESSING...')
              : (locale === 'es' ? 'QUITAR FONDO' : 'REMOVE BACKGROUND')}
          </span>
        </button>

        <button
          onClick={() => {
            setStatus('editing_mask');
            setIsMobileControlsOpen(false);
          }}
          disabled={isRetouchDisabled}
          className="w-full py-3 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 text-primary font-semibold text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sliders className="size-4 shrink-0" />
          <span>{locale === 'es' ? 'RETOCAR IMAGEN' : 'RETOUCH IMAGE'}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full lg:h-full select-none pb-20 lg:pb-0">
      
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileInputChange} 
      />

      {status !== 'editing_mask' && (
        <>
          {/* ─── COLUMNA IZQUIERDA: VISUALIZADOR Y ENCABEZADO ─── */}
          <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
            
            {/* Cabecera del Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="space-y-1">
                <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
                  {locale === 'es' ? 'Quitar Fondo de Imagen' : 'Remove Image Background'}
                </h2>
                <p className="text-xs text-muted-foreground leading-normal max-w-xl">
                  {locale === 'es' 
                    ? 'Elimina el fondo de tus fotos de forma local en tu navegador con IA. 100% privado, rápido y sin servidores.'
                    : 'Remove backgrounds locally in your browser with AI. 100% private, fast, and serverless.'}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={handleClear}
                  disabled={!file || status === 'downloading_model' || status === 'processing'}
                  className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="size-3.5" />
                  <span>{locale === 'es' ? 'Limpiar' : 'Clear'}</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === 'downloading_model' || status === 'processing'}
                  className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload className="size-3.5" />
                  <span>{locale === 'es' ? 'Subir Nueva' : 'Upload New'}</span>
                </button>
              </div>
            </div>

            {/* Visualizador Principal de Trabajo / Dropzone */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={!file ? handleTriggerUpload : undefined}
              className={cn(
                "flex-1 min-h-[350px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden transition-colors bg-white group",
                !file && "cursor-pointer"
              )}
            >
              {/* Esquinas decorativas estilo visor de cámara */}
              <div className="corner-decorator corner-tl"></div>
              <div className="corner-decorator corner-tr"></div>
              <div className="corner-decorator corner-bl"></div>
              <div className="corner-decorator corner-br"></div>

              {/* Overlay de Carga sobre todo el visualizador */}
              {(status === 'downloading_model' || status === 'processing') && (
                <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-md flex items-center justify-center z-20 animate-fade-in">
                  <LoaderPrime 
                    message={status === 'downloading_model' ? t('bgrm.downloadingAI') : t('bgrm.removingBg')} 
                  />
                </div>
              )}

              {!file ? (
                <div className="flex flex-col items-center justify-center p-8 text-center cursor-pointer group z-10 w-full">
                  <div className="flex flex-col items-center gap-4 max-w-sm bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-border/40 shadow-sm transition-all group-hover:shadow-md animate-fade-in mx-auto w-full">
                    <div className="size-14 rounded-full bg-white flex items-center justify-center border border-border/85 shadow-sm text-muted-foreground">
                      <ImageIcon className="size-6" />
                    </div>
                    <div className="space-y-3 w-full text-center">
                      <div className="space-y-1.5 text-center">
                        <p className="text-sm font-semibold text-primary text-center">
                          {locale === 'es' ? 'Arrastra tu imagen aquí o haz clic' : 'Drag your image here or click'}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-normal text-center">
                          {locale === 'es' 
                            ? 'Procesamiento 100% local en tu navegador. Máximo 20MB por archivo.'
                            : '100% local processing in your browser. Maximum 20MB per file.'}
                        </p>
                      </div>
                      
                      {/* Formatos Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                        {['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].map((fmt) => (
                          <span 
                            key={fmt} 
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200/60"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {status === 'ready_to_process' && originalUrl && (
                    <div className="w-full h-full flex items-center justify-center relative z-10 max-h-[55vh]">
                      <img 
                        src={originalUrl} 
                        alt={file.name}
                        className="max-w-full max-h-full object-contain rounded shadow-sm"
                      />
                    </div>
                  )}

                  {(status === 'downloading_model' || status === 'processing') && originalUrl && (
                    <div className="w-full h-full flex items-center justify-center relative z-10 max-h-[55vh]">
                      <img 
                        src={originalUrl} 
                        alt="Procesando"
                        className="max-w-full max-h-full object-contain rounded filter blur-[3px]"
                      />
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="max-w-md mx-auto z-10 p-6 flex flex-col items-center">
                      <ToolError 
                        title={t('bgrm.errorTitle')}
                        message={errorMessage} 
                        onRetry={() => setStatus('ready_to_process')} 
                      />
                    </div>
                  )}

                  {status === 'done' && originalUrl && resultUrl && (
                    <div className="w-full h-full flex flex-col items-center justify-center relative z-10 max-h-[55vh] fade-in">
                      <div className="w-full h-full max-h-[50vh] flex items-center justify-center">
                        <ImageComparisonSlider originalSrc={originalUrl} resultSrc={resultUrl} />
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>

            {/* Enlaces Editoriales Informativos */}
            <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full">
              <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>
                <div className="space-y-1 z-10">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HelpCircle className="size-3 text-muted-foreground/80" />
                    {locale === 'es' ? 'Guía del usuario' : 'User guide'}
                  </span>
                  <p className="text-sm font-serif text-primary font-medium">
                    {locale === 'es' ? '¿Cómo funciona la remoción de fondo con Inteligencia Artificial?' : 'How does AI background removal work?'}
                  </p>
                </div>
                <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
              </div>

              {/* Separador vertical decorativo | en desktop */}
              <div className="hidden md:flex items-center justify-center text-border/60 text-lg font-light font-sans px-1 pointer-events-none self-center">
                |
              </div>

              <div 
                onClick={() => window.location.href = locale === 'es' ? '/es/herramientas/comprimir-imagen' : '/tools/compress-image'}
                className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-white bg-[#a855f7] px-1.5 py-0.5 rounded-md">
                      {locale === 'es' ? 'RECOMENDADO' : 'RECOMMENDED'}
                    </span>
                  </div>
                  <p className="text-sm font-serif text-primary font-medium">
                    {locale === 'es' ? 'Comprimir peso de la imagen sin perder calidad' : 'Compress image size without losing quality'}
                  </p>
                </div>
                <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
              </div>
            </div>

          </div>

          {/* ─── COLUMNA DERECHA: SIDEBAR DE CONTROLES (DESKTOP) ─── */}
          <div className="hidden lg:flex w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl flex-col lg:h-full overflow-hidden shadow-sm">
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
                {locale === 'es' ? 'Controles de Edición' : 'Edit Controls'}
              </h3>
              
              {renderSidebarControls()}
            </div>

            <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm">
              <button 
                onClick={handleDownload}
                disabled={status !== 'done'}
                className="w-full py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="size-4" />
                <span>{t('conv.download')}</span>
              </button>
            </div>
          </div>

          {/* ─── STICKY BOTTOM BAR MÓVIL ─── */}
          <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border/80 flex items-center justify-between px-6 z-40 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
            <button
              onClick={() => {
                if (file) setIsMobileControlsOpen(prev => !prev);
              }}
              disabled={!file}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                isMobileControlsOpen ? "text-[#a855f7]" : "text-muted-foreground hover:text-primary"
              )}
            >
              <Sliders className="size-5" />
              <span>{locale === 'es' ? 'Ajustes' : 'Settings'}</span>
            </button>

            <div className="h-8 w-[1px] bg-border/60 pointer-events-none mx-2"></div>

            <button
              onClick={!file ? handleTriggerUpload : status === 'done' ? handleDownload : startProcessing}
              disabled={status === 'downloading_model' || status === 'processing'}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
            >
              {!file ? <Upload className="size-4" /> : status === 'done' ? <Download className="size-4" /> : null}
              <span>
                {!file 
                  ? (locale === 'es' ? 'SUBIR IMAGEN' : 'UPLOAD IMAGE')
                  : status === 'done'
                    ? (locale === 'es' ? 'DESCARGAR' : 'DOWNLOAD')
                    : status === 'downloading_model' || status === 'processing'
                      ? (locale === 'es' ? 'PROCESANDO...' : 'PROCESSING...')
                      : (locale === 'es' ? 'QUITAR FONDO' : 'REMOVE BG')}
              </span>
            </button>
          </div>

          {/* ─── DRAWER MÓVIL ─── */}
          <Sheet open={isMobileControlsOpen} onOpenChange={setIsMobileControlsOpen}>
            <SheetContent 
              side="bottom" 
              className="p-0 bg-white rounded-t-3xl border-t border-border max-h-[80vh] overflow-y-auto flex flex-col z-50"
              showCloseButton={true}
            >
              <div className="p-6 pb-20">
                <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
                  {locale === 'es' ? 'Controles de Edición' : 'Edit Controls'}
                </h3>
                
                {renderSidebarControls()}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Editor interactivo de máscara */}
      {status === 'editing_mask' && originalUrl && resultUrl && (
        <MaskEditor 
          originalSrc={originalUrl} 
          resultSrc={resultUrl} 
          onSave={handleSaveMask} 
          onCancel={() => setStatus('done')} 
        />
      )}
    </div>
  );
};
