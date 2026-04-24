import React, { useState, useEffect, useRef } from 'react';
import { ConverterFile, TargetFormat, FallbackColor, FORMAT_LABELS } from '../../types/converter';
import { MultiDragAndDrop } from '../DragAndDrop/MultiDragAndDrop';
import { detectTransparency, convertImage, packageZip } from '../../utils/formatConverter';
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
  const addFilesInputRef = useRef<HTMLInputElement>(null);

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
        a.download = `PixelTools_Conversiones_${Date.now()}.zip`;
        a.click();
      }
    }

    setIsProcessing(false);
  };

  // Si no hay archivos, inyectamos el MultiDragAndDrop al 100%
  if (conversionList.length === 0) {
    return (
      <div className="converter-stage" style={{ backgroundColor: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
        <MultiDragAndDrop onFilesSelected={onAddFiles} />
      </div>
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

  return (
    <div className="converter-stage">
      <div className="converter-hero">
        <div className="converter-header-actions">
          {/* Selector Global de Formato */}
          <div className="global-format-control">
            <label className="global-format-label">Convertir todo a:</label>
            <select 
              className="format-select global-format-select"
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
          
          <div className="converter-header-buttons">
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
            <button 
              className="btn-add-more" 
              onClick={() => addFilesInputRef.current?.click()} 
              disabled={isProcessing}
              title="Agregar más imágenes"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Agregar
            </button>
            <button className="btn-clear-all" onClick={handleClearInternal} disabled={isProcessing}>
              Borrar Todo
            </button>
          </div>
        </div>

        {/* Advertencia de rendimiento */}
        {showPerformanceWarning && (
          <div className="performance-warning">
            <span>⚠️</span>
            <span>
              Tienes <strong>{conversionList.length}</strong> imágenes cargadas. 
              La conversión podría tardar un poco más de lo habitual.
            </span>
          </div>
        )}

        <div className="converter-file-list">
          {conversionList.map(item => {
            const targetBreaksTransparency = item.targetFormat === 'image/jpeg';
            const showTransparencyWarning = item.hasTransparency && targetBreaksTransparency;

            return (
              <div key={item.id} className="converter-file-row">
                <div className="converter-row-top">
                  <img src={item.previewUrl} className="file-preview-thumb" alt="thumb" />
                  
                  <div className="file-info">
                    <span className="file-name" title={item.file.name}>{item.file.name}</span>
                    <span className="file-meta">
                      Original: {item.file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="conversion-controls">
                    <span style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-handwriting)' }}>→</span>
                    <select 
                      className="format-select"
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

                    <button className="btn-remove-row" onClick={() => handleRemoveItem(item.id)} disabled={isProcessing} title="Quitar">
                      <svg className="remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {item.status !== 'idle' && (
                      <span className={`row-status-badge status-${item.status}`}>
                        {item.status === 'processing' ? 'Procesando' : item.status === 'done' ? 'Listo' : 'Error'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Zona Condicional de Transparencia */}
                {showTransparencyWarning && (
                  <div className="transparency-options">
                    <strong>⚠️ Transparencia detectada:</strong>
                    <span>Rellenar fondo con:</span>
                    <div className="color-radio-group">
                      <label className="color-radio">
                        <input 
                          type="radio" 
                          name={`color-${item.id}`} 
                          checked={item.fallbackColor === '#FFFFFF'}
                          onChange={() => handleUpdateColor(item.id, '#FFFFFF')}
                          disabled={isProcessing}
                        />
                        Blanco
                      </label>
                      <label className="color-radio">
                        <input 
                          type="radio" 
                          name={`color-${item.id}`} 
                          checked={item.fallbackColor === '#000000'}
                          onChange={() => handleUpdateColor(item.id, '#000000')}
                          disabled={isProcessing}
                        />
                        Negro
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>


      </div>

      <div className="converter-actions">
        <button 
          className="btn-convert-action" 
          onClick={handleProcessBatch}
          disabled={isProcessing || idleCount === 0}
        >
          {isProcessing 
            ? 'Procesando...' 
            : idleCount === conversionList.length
              ? `Convertir ${conversionList.length} Archivo${conversionList.length > 1 ? 's' : ''}`
              : idleCount > 0
                ? `Convertir ${idleCount} Pendiente${idleCount > 1 ? 's' : ''}`
                : 'Todas las imágenes están convertidas ✓'
          }
        </button>
      </div>
    </div>
  );
};
