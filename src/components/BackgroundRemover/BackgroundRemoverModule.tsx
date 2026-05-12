import React, { useState, useEffect, useRef } from 'react';
import { DragAndDrop } from '../DragAndDrop/DragAndDrop';
import { ImageComparisonSlider } from './ImageComparisonSlider';
// @ts-ignore
import BgWorker from '../../workers/bgRemoval.worker?worker';
import { MaskEditor } from './MaskEditor';
import { ToolError } from '../Errors/ToolError';
import { ImagePreviewCanvas } from '../UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { useLocale } from '../../i18n/useLocale';
import './BackgroundRemoverModule.css';

type ProcessingState = 'idle' | 'ready_to_process' | 'downloading_model' | 'processing' | 'done' | 'editing_mask' | 'error';

export const BackgroundRemoverModule: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { t } = useLocale();

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
          if (prev === 'processing') return 'downloading_model';
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
        setErrorMessage(message || t('shared.errorProcessing'));
        setStatus('error');
      }
    };

    // Iniciar preload silenciosamente en el worker
    workerRef.current!.postMessage({ action: 'preload' });

    return () => { 
      workerRef.current?.terminate(); 
    };
  }, [t]);

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

  const handleSaveMask = (newBlob: Blob) => {
    const url = URL.createObjectURL(newBlob);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(url);
    setStatus('done');
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
      <DragAndDrop onImageSelected={handleImageSelected} />
    );
  }

  return (
    <div className="bgrm-main-layout fade-in">
      
      {status !== 'editing_mask' && (
        <>
          {/* Lado Izquierdo: Workspace Visual */}
          <div className="bgrm-workspace">
            {status === 'ready_to_process' && originalUrl && (
              <div className="bgrm-preview-card fade-in">
                <ImagePreviewCanvas 
                  imageUrl={originalUrl} 
                  maxHeight="60vh"
                />
              </div>
            )}

            {(status === 'downloading_model' || status === 'processing') && originalUrl && (
              <div className="bgrm-preview-card bgrm-loading-preview fade-in">
                <ImagePreviewCanvas 
                  imageUrl={originalUrl} 
                  maxHeight="60vh"
                  className="blur-effect"
                />
              </div>
            )}

            {status === 'error' && (
              <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                <ToolError 
                  title={t('bgrm.errorTitle')}
                  message={errorMessage} 
                  onRetry={() => setStatus('ready_to_process')} 
                />
              </div>
            )}

            {status === 'done' && originalUrl && resultUrl && (
              <div className="bgrm-result-state fade-in">
                <div className="bgrm-preview-card">
                  <ImageComparisonSlider originalSrc={originalUrl} resultSrc={resultUrl} />
                </div>
                <div className="bgrm-slider-hints">
                  <span className="bgrm-hint-left">{t('bgrm.before')}</span>
                  <span className="bgrm-hint-right">{t('bgrm.after')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Lado Derecho: Controles Sidebar */}
          <aside className="bgrm-sidebar">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileInputChange} 
            />

            <div className="bgrm-controls-section">
              <h4 className="bgrm-control-title">{t('bgrm.title')}</h4>
              
              {status === 'ready_to_process' && (
                <div className="bgrm-actions-panel fade-in">
                  <button className="btn-download-primary" onClick={startProcessing}>
                    {t('bgrm.removeNow')}
                  </button>
                  
                  <button className="btn-text-action" onClick={() => fileInputRef.current?.click()} style={{ justifyContent: 'center' }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" />
                    </svg>
                    {t('shared.chooseAnother')}
                  </button>
                </div>
              )}

              {(status === 'downloading_model' || status === 'processing') && (
                <div className="bgrm-sidebar-loading fade-in">
                  <div className="spinner" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent', margin: '0 auto 20px', width: '40px', height: '40px' }}></div>
                  <h3 className="bgrm-loading-title">
                    {status === 'downloading_model' ? t('bgrm.downloadingAI') : t('bgrm.removingBg')}
                  </h3>
                  <p className="bgrm-loading-desc">
                    {status === 'downloading_model' 
                      ? t('bgrm.downloadingDesc') 
                      : t('bgrm.removingDesc')}
                  </p>
                </div>
              )}

              {status === 'done' && (
                <div className="bgrm-actions-panel fade-in">
                  <button className="btn-download-primary" onClick={handleDownload}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24" style={{ marginRight: '8px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" />
                    </svg>
                    {t('shared.downloadPng')}
                  </button>
                  
                  <button className="btn-text-action" onClick={() => setStatus('editing_mask')} style={{ justifyContent: 'center', marginTop: '10px' }}>
                    {t('bgrm.refineCut')}
                  </button>
                  
                  <button className="btn-text-action" onClick={() => fileInputRef.current?.click()} style={{ justifyContent: 'center' }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" />
                    </svg>
                    {t('shared.uploadAnother')}
                  </button>
                </div>
              )}
            </div>
            
            <p className="bgrm-legal-hint">{t('shared.privacyLocal')}</p>
          </aside>
        </>
      )}

      {/* Editor Interactivo (Comparte el Layout Principal internamente) */}
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
