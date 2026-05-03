import React, { useState, useEffect, useRef } from 'react';
import { DragAndDrop } from '../DragAndDrop/DragAndDrop';
import { ImageComparisonSlider } from './ImageComparisonSlider';
// @ts-ignore
import BgWorker from '../../workers/bgRemoval.worker?worker';
import './BackgroundRemoverModule.css';

type ProcessingState = 'idle' | 'ready_to_process' | 'downloading_model' | 'processing' | 'done' | 'error';

export const BackgroundRemoverModule: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

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
        // Si la herramienta estaba descargando porque el usuario ya apretó "Quitar fondo",
        // pasamos automáticamente a "procesando" ya que la descarga terminó.
        setStatus(prev => {
          if (prev === 'downloading_model') return 'processing';
          return prev;
        });
      } 
      else if (type === 'progress') {
        // Si estábamos en 'processing', significa que el usuario apretó "Quitar fondo" 
        // pero la IA aún se estaba descargando en segundo plano. Cambiamos la vista
        // a "Descargando modelo de IA...".
        setStatus(prev => {
          if (prev === 'processing' || prev === 'ready_to_process') return 'downloading_model';
          return prev;
        });
      }
      else if (type === 'result') {
        isModelPreloaded.current = true; // Por si acaso
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setStatus('done');
      }
      else if (type === 'error') {
        console.error("Error desde el worker:", message);
        setErrorMessage(message || 'Ocurrió un error inesperado al procesar la imagen.');
        setStatus('error');
      }
    };

    // Iniciar preload silenciosamente en el worker
    workerRef.current!.postMessage({ action: 'preload' });

    return () => { 
      workerRef.current?.terminate(); 
    };
  }, []);

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

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const baseName = file?.name.substring(0, file.name.lastIndexOf('.')) || 'imagen';
    a.download = `${baseName}_sin_fondo.png`;
    a.click();
  };

  // ── RENDER ──

  if (!file) {
    return (
      <div className="bgrm-stage fade-in">
        <DragAndDrop onImageSelected={handleImageSelected} />
        {/* Spinner silencioso opcional si está precargando, pero lo mantendremos muy sutil */}
        {!isModelPreloaded.current && (
          <div className="bgrm-silent-preload">
            <span className="bgrm-silent-text">Cargando motor de IA en segundo plano...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bgrm-stage bgrm-active fade-in">
      <div className="bgrm-top-bar">
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileInputChange} 
        />
        <button className="bgrm-btn-change" onClick={() => fileInputRef.current?.click()}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Cambiar Foto
        </button>
      </div>

      <div className="bgrm-workspace">
        {status === 'ready_to_process' && originalUrl && (
          <div className="bgrm-ready-state fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="bgrm-preview-container" style={{ maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e5e5' }}>
              <img src={originalUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
            </div>
            <button className="bgrm-btn-primary" onClick={startProcessing} style={{ fontSize: '1.4rem', padding: '15px 30px', backgroundColor: 'var(--color-accent)' }}>
              ✨ Quitar Fondo Ahora
            </button>
          </div>
        )}

        {status === 'downloading_model' && (
          <div className="bgrm-loading-state fade-in">
            <div className="spinner" style={{ width: '50px', height: '50px', margin: '0 auto 20px', borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
            <h3 className="bgrm-loading-title">Preparando la herramienta por primera vez...</h3>
            <p className="bgrm-loading-desc">Descargando modelo de Inteligencia Artificial de alta calidad. Espere un momento.</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="bgrm-loading-state fade-in">
            <div className="spinner" style={{ width: '50px', height: '50px', margin: '0 auto 20px', borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
            <h3 className="bgrm-loading-title">Quitando fondo...</h3>
            <p className="bgrm-loading-desc">La IA está analizando los bordes de tu imagen localmente, no cierres esta ventana.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bgrm-loading-state bgrm-error fade-in">
            <h3>❌ Error</h3>
            <p>{errorMessage}</p>
            <button className="bgrm-btn-primary" onClick={() => setStatus('ready_to_process')}>Volver a intentar</button>
          </div>
        )}

        {status === 'done' && originalUrl && resultUrl && (
          <div className="bgrm-result-state fade-in">
            <div className="bgrm-slider-wrapper">
              <ImageComparisonSlider originalSrc={originalUrl} resultSrc={resultUrl} />
              <div className="bgrm-slider-hints">
                <span className="bgrm-hint-left">Antes</span>
                <span className="bgrm-hint-right">Después</span>
              </div>
            </div>
            
            <div className="bgrm-actions">
              <button className="bgrm-btn-download" onClick={handleDownload}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" />
                </svg>
                Descargar PNG Transparente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
