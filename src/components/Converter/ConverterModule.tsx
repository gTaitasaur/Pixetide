import React, { useState, useEffect, useRef } from 'react';
import { ConverterFile, TargetFormat, FallbackColor, FORMAT_LABELS } from '../../types/converter';
import { MultiDragAndDrop } from '../DragAndDrop/MultiDragAndDrop';
import { detectTransparency, convertImage, packageZip } from '../../utils/formatConverter';
import { useLocale } from '../../i18n/useLocale';
import './ConverterModule.css';

interface ConverterModuleProps {
  files: File[];
  onAddFiles: (files: File[]) => void;
  onClearAll: () => void;
}

/** Umbral a partir del cual mostramos advertencia de rendimiento */
const PERFORMANCE_WARNING_THRESHOLD = 20;

export const ConverterModule: React.FC<ConverterModuleProps> = ({ files, onAddFiles, onClearAll }) => {
  const [conversionList, setConversionList] = useState<ConverterFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [globalFormat, setGlobalFormat] = useState<TargetFormat>('image/jpeg');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const addFilesInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  /**
   * FIX CRÍTICO: Usamos un Set de refs para rastrear qué objetos File
   * ya fueron procesados. Esto elimina el problema de "closure stale"
   * porque useRef NO se congela entre renderizados como sí lo hace useState.
   */
  const processedFilesRef = useRef<Set<File>>(new Set());

  // Sincronizar el prop "files" externo con nuestro estado interno
  useEffect(() => {
    const addNewFiles = async () => {
      // Filtrar usando la ref (siempre actualizada) en lugar del state (potencialmente stale)
      const newFiles = files.filter(f => !processedFilesRef.current.has(f));

      if (newFiles.length === 0) return;

      // Marcar como procesados INMEDIATAMENTE para evitar duplicados
      newFiles.forEach(f => processedFilesRef.current.add(f));

      // Creamos entradas preliminares con el formato global actual
      const newEntries: ConverterFile[] = newFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        hasTransparency: false,
        targetFormat: globalFormat,
        fallbackColor: '#FFFFFF',
        status: 'idle' as const
      }));

      // Usamos functional update (prev =>) para no depender de estado capturado
      setConversionList(prev => [...prev, ...newEntries]);

      // Calculamos transparencia asíncronamente en background
      for (const entry of newEntries) {
        const hasTransp = await detectTransparency(entry.previewUrl);
        setConversionList(prev =>
          prev.map(item => item.id === entry.id ? { ...item, hasTransparency: hasTransp } : item)
        );
      }
    };

    addNewFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Limpieza de URLs si un archivo es borrado
  const handleRemoveItem = (id: string) => {
    setConversionList(prev => {
      const removed = prev.find(i => i.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        processedFilesRef.current.delete(removed.file); // Limpiar la ref también
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleUpdateFormat = (id: string, format: TargetFormat) => {
    setConversionList(prev => prev.map(item => item.id === id ? { ...item, targetFormat: format, status: 'idle' as const } : item));
  };

  const handleUpdateColor = (id: string, color: FallbackColor) => {
    setConversionList(prev => prev.map(item => item.id === id ? { ...item, fallbackColor: color } : item));
  };

  /** Cambia el formato de TODAS las imágenes cargadas de una sola vez */
  const handleGlobalFormatChange = (format: TargetFormat) => {
    setGlobalFormat(format);
    setConversionList(prev => prev.map(item => ({ ...item, targetFormat: format, status: 'idle' as const })));
  };

  const handleProcessBatch = async () => {
    setIsProcessing(true);

    /**
     * FIX CRÍTICO: Solo procesamos items con status === 'idle'.
     * Los que ya están 'done' no se tocan. Esto soluciona el bug
     * de re-conversión al agregar un segundo lote.
     */
    const itemsToProcess = conversionList.filter(item => item.status === 'idle');

    if (itemsToProcess.length === 0) {
      setIsProcessing(false);
      return;
    }

    const zipPayload: { blob: Blob, filename: string }[] = [];

    for (const item of itemsToProcess) {
      // Marcar como procesando usando functional update (nunca sobreescribe items nuevos)
      setConversionList(prev => prev.map(p => p.id === item.id ? { ...p, status: 'processing' as const } : p));

      try {
        const resultBlob = await convertImage(item.file, item.targetFormat, item.fallbackColor);

        // Construir nuevo nombre
        const ext = FORMAT_LABELS[item.targetFormat].toLowerCase();
        const baseName = item.file.name.replace(/\.[^/.]+$/, "");
        const newName = `${baseName}_converted.${ext}`;

        zipPayload.push({ blob: resultBlob, filename: newName });

        // FIX: Usamos functional update para actualizar SOLO este item sin tocar el resto del estado
        setConversionList(prev => prev.map(p => p.id === item.id ? { ...p, status: 'done' as const, resultBlob } : p));
      } catch (err) {
        console.error(err);
        setConversionList(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error' as const } : p));
      }
    }

    // Si hubo éxito, empaquetar en ZIP y descargar
    if (zipPayload.length > 0) {
      if (zipPayload.length === 1) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipPayload[0].blob);
        a.download = zipPayload[0].filename;
        a.click();
      } else {
        const zipBlob = await packageZip(zipPayload);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `Pixetide_Conversiones_${Date.now()}.zip`;
        a.click();
      }
    }

    setIsProcessing(false);
  };

  // Si no hay archivos, inyectamos el MultiDragAndDrop al 100%
  if (conversionList.length === 0) {
    return (
      <MultiDragAndDrop onFilesSelected={onAddFiles} />
    );
  }

  const handleClearInternal = () => {
    conversionList.forEach(c => URL.revokeObjectURL(c.previewUrl));
    processedFilesRef.current.clear(); // Limpiar el registro de archivos procesados
    setConversionList([]);
    onClearAll();
  };

  const showPerformanceWarning = conversionList.length >= PERFORMANCE_WARNING_THRESHOLD;
  const idleCount = conversionList.filter(i => i.status === 'idle').length;

  /** Trunca un nombre de archivo preservando la extensión */
  const truncateFileName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    const extIndex = name.lastIndexOf('.');
    if (extIndex === -1) return name.slice(0, maxLength) + '...';

    const ext = name.slice(extIndex);
    const base = name.slice(0, extIndex);
    const available = maxLength - ext.length - 3;

    return available > 0
      ? base.slice(0, available) + '...' + ext
      : base.slice(0, 10) + '...' + ext;
  };

  return (
    <div className={`converter-main-layout ${isDragOver ? 'drag-active' : ''}`}>
      {/* Lado Izquierdo: Lista de Archivos */}
      <div
        className="converter-workspace"
        onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (isProcessing) return;
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const validFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (validFiles.length > 0) onAddFiles(validFiles);
            e.dataTransfer.clearData();
          }
        }}
      >
        <div className="converter-header-row">
          <h3 className="converter-title">{t('conv.filesLoaded')} ({conversionList.length})</h3>
          <button
            className="btn-text-action"
            onClick={() => addFilesInputRef.current?.click()}
            disabled={isProcessing}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('shared.uploadMore')}
          </button>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={addFilesInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddFiles(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />
        </div>

        <div className="converter-cards-list">
          {conversionList.map(item => {
            const targetBreaksTransparency = ['image/jpeg', 'image/bmp'].includes(item.targetFormat);
            const showTransparencyWarning = item.hasTransparency && targetBreaksTransparency;

            return (
              <div key={item.id} className={`converter-file-card ${item.status === 'done' ? 'is-done' : ''}`}>
                <div className="card-main">
                  <div className="card-preview">
                    <img src={item.previewUrl} alt="Preview" />
                  </div>

                  <div className="card-info">
                    <span className="file-name" title={item.file.name}>
                      {truncateFileName(item.file.name)}
                    </span>
                    <div className="file-meta">
                      <span className="meta-badge">{item.file.type.split('/')[1]?.toUpperCase()}</span>
                      <span className="meta-size">{(item.file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <div className="format-picker">
                      <span className="format-arrow">→</span>
                      <select
                        className="card-format-select"
                        value={item.targetFormat}
                        onChange={(e) => handleUpdateFormat(item.id, e.target.value as TargetFormat)}
                        disabled={isProcessing}
                      >
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                        <option value="image/avif">AVIF</option>
                        <option value="image/gif">GIF</option>
                        <option value="image/bmp">BMP</option>
                        <option value="image/tiff">TIFF</option>
                        <option value="image/x-icon">ICO</option>
                        <option value="image/vnd.adobe.photoshop">PSD</option>
                        <option value="application/postscript">EPS</option>
                      </select>
                    </div>

                    <button className="btn-card-remove" onClick={() => handleRemoveItem(item.id)} disabled={isProcessing} title={t('conv.remove')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {showTransparencyWarning && (
                  <div className="card-transparency-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{FORMAT_LABELS[item.targetFormat]} {t('conv.noTransparency')}</span>
                    <div className="color-pills">
                      <button
                        className={`color-pill ${item.fallbackColor === '#FFFFFF' ? 'active' : ''}`}
                        onClick={() => handleUpdateColor(item.id, '#FFFFFF')}
                        disabled={isProcessing}
                      > {t('conv.white')} </button>
                      <button
                        className={`color-pill ${item.fallbackColor === '#000000' ? 'active' : ''}`}
                        onClick={() => handleUpdateColor(item.id, '#000000')}
                        disabled={isProcessing}
                      > {t('conv.black')} </button>
                    </div>
                  </div>
                )}

                {item.status !== 'idle' && (
                  <div className={`card-status-bar status-${item.status}`}>
                    {item.status === 'processing' && <div className="status-loader"></div>}
                    <span>{item.status === 'processing' ? t('conv.converting') : item.status === 'done' ? t('conv.done') : t('conv.error')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lado Derecho: Controles Globales */}
      <aside className="converter-sidebar">
        <div className="sidebar-section">
          <h4 className="section-title">{t('conv.globalSettings')}</h4>
          <p className="section-desc">{t('conv.globalDesc')}</p>

          <div className="global-format-card">
            <label>{t('conv.convertTo')}</label>
            <select
              className="global-format-select"
              value={globalFormat}
              onChange={(e) => handleGlobalFormatChange(e.target.value as TargetFormat)}
              disabled={isProcessing}
            >
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
              <option value="image/avif">AVIF</option>
              <option value="image/gif">GIF</option>
              <option value="image/bmp">BMP</option>
              <option value="image/tiff">TIFF</option>
              <option value="image/x-icon">ICO</option>
              <option value="image/vnd.adobe.photoshop">PSD</option>
              <option value="application/postscript">EPS</option>
            </select>
          </div>
        </div>

        {showPerformanceWarning && (
          <div className="sidebar-alert warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{t('conv.performanceWarning').replace('{count}', conversionList.length.toString())}</p>
          </div>
        )}

        <div className="sidebar-actions">
          <button
            className="btn-download-primary"
            onClick={handleProcessBatch}
            disabled={isProcessing || idleCount === 0}
          >
            {isProcessing ? (
              <>
                <div className="btn-spinner"></div>
                {t('shared.processing')}
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {idleCount === conversionList.length ? t('conv.convertAll') : t('conv.convertPending')}
              </>
            )}
          </button>

          <button className="btn-clear-all" onClick={handleClearInternal} disabled={isProcessing}>
            {t('conv.clearAll')}
          </button>
        </div>

        <p className="privacy-hint">{t('conv.privacyHint')}</p>
      </aside>
    </div>
  );
};
