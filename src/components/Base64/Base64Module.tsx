import React, { useState, useRef } from 'react';
import { DragAndDrop } from '../DragAndDrop/DragAndDrop';
import './Base64Module.css';

type TabMode = 'encode' | 'decode';
type CopyFormat = 'raw' | 'html' | 'css';

export const Base64Module: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('encode');

  // ── Estado para CODIFICAR ──
  const [base64String, setBase64String] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Estado para DECODIFICAR ──
  const [decodeInput, setDecodeInput] = useState<string>('');
  const [decodePreview, setDecodePreview] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedFormat, setDecodedFormat] = useState<string>('png');

  // ── Estado general ──
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  // ══════════════════════════════════════════
  // MODO 1: CODIFICAR (Imagen → Base64)
  // ══════════════════════════════════════════

  const handleImageSelected = (_url: string, file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64String(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChangeImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      handleImageSelected(url, file);
      e.target.value = '';
    }
  };

  const getFormattedCode = (format: CopyFormat): string => {
    if (!base64String) return '';
    switch (format) {
      case 'raw':
        return base64String;
      case 'html':
        return `<img src="${base64String}" alt="${fileName}" />`;
      case 'css':
        return `background-image: url('${base64String}');`;
    }
  };

  const handleCopy = (format: CopyFormat) => {
    const text = getFormattedCode(format);
    navigator.clipboard.writeText(text).then(() => {
      const labels: Record<CopyFormat, string> = {
        raw: 'Base64 copiado',
        html: 'HTML copiado',
        css: 'CSS copiado',
      };
      setCopiedLabel(labels[format]);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopiedLabel(null), 2000);
    });
  };

  const handleDownloadTxt = () => {
    if (!base64String) return;
    const blob = new Blob([base64String], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    a.download = `${baseName}_base64.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ══════════════════════════════════════════
  // MODO 2: DECODIFICAR (Base64 → Imagen)
  // ══════════════════════════════════════════

  const handleDecodeInput = (value: string) => {
    setDecodeInput(value);
    setDecodeError(null);
    setDecodePreview(null);

    if (!value.trim()) return;

    // Normalizar: si el usuario pegó solo la cadena sin el prefijo data:...
    let fullString = value.trim();
    if (!fullString.startsWith('data:')) {
      fullString = `data:image/png;base64,${fullString}`;
    }

    // Extraer formato del encabezado (data:image/png;base64,...)
    const formatMatch = fullString.match(/^data:image\/(\w+);base64,/);
    if (!formatMatch) {
      setDecodeError('El texto no parece ser una imagen en Base64 válida. Asegúrate de que comience con "data:image/..." o sea una cadena Base64 pura.');
      return;
    }

    setDecodedFormat(formatMatch[1]);

    // Validar que el Base64 sea legítimo intentando renderizarlo
    const img = new Image();
    img.onload = () => {
      setDecodePreview(fullString);
      setDecodeError(null);
    };
    img.onerror = () => {
      setDecodeError('No se pudo decodificar la imagen. Verifica que el código Base64 esté completo y sea válido.');
      setDecodePreview(null);
    };
    img.src = fullString;
  };

  const handleDownloadDecoded = () => {
    if (!decodePreview) return;
    const a = document.createElement('a');
    a.href = decodePreview;
    a.download = `imagen_decodificada.${decodedFormat}`;
    a.click();
  };

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  return (
    <div className="b64-stage fade-in">
      {/* Pestañas */}
      <div className="b64-tabs">
        <button
          className={`b64-tab ${activeTab === 'encode' ? 'active' : ''}`}
          onClick={() => setActiveTab('encode')}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Imagen → Base64
        </button>
        <button
          className={`b64-tab ${activeTab === 'decode' ? 'active' : ''}`}
          onClick={() => setActiveTab('decode')}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l4 4m0 0l4-4m-4 4V4" />
          </svg>
          Base64 → Imagen
        </button>
      </div>

      {/* ── MODO CODIFICAR ── */}
      {activeTab === 'encode' && (
        <div className="b64-content fade-in">
          {!base64String ? (
            <DragAndDrop onImageSelected={handleImageSelected} />
          ) : (
            <>
              {/* Preview + Info */}
              <div className="b64-encode-header">
                <div className="b64-preview-thumb">
                  <img src={previewUrl!} alt="Preview" />
                </div>
                <div className="b64-file-info">
                  <span className="b64-filename">{fileName}</span>
                  <span className="b64-filesize">Tamaño original: {formatBytes(fileSize)}</span>
                  <span className="b64-filesize">Tamaño Base64: {formatBytes(base64String.length)}</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />
                  <button className="b64-btn-change" onClick={handleChangeImage}>
                    Cambiar Imagen
                  </button>
                </div>
              </div>

              {/* Textarea con el código */}
              <div className="b64-output-area">
                <textarea
                  className="b64-textarea"
                  readOnly
                  value={base64String}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>

              {/* Botones de copiado */}
              <div className="b64-actions">
                <button className="b64-btn-copy" onClick={() => handleCopy('raw')}>
                  📋 Copiar Base64
                </button>
                <button className="b64-btn-copy" onClick={() => handleCopy('html')}>
                  {'</>'} Copiar HTML
                </button>
                <button className="b64-btn-copy" onClick={() => handleCopy('css')}>
                  🎨 Copiar CSS
                </button>
                <button className="b64-btn-download" onClick={handleDownloadTxt}>
                  💾 Descargar .txt
                </button>
              </div>

              {/* Feedback de copiado */}
              {copiedLabel && (
                <div className="b64-copied-toast fade-in">
                  ✅ ¡{copiedLabel}!
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MODO DECODIFICAR ── */}
      {activeTab === 'decode' && (
        <div className="b64-content fade-in">
          <label className="b64-decode-label">
            Pega tu código Base64 aquí:
          </label>
          <textarea
            className="b64-textarea b64-decode-input"
            placeholder={'data:image/png;base64,iVBORw0KGgo...'}
            value={decodeInput}
            onChange={(e) => handleDecodeInput(e.target.value)}
          />

          {decodeError && (
            <div className="b64-decode-error fade-in">
              ⚠️ {decodeError}
            </div>
          )}

          {decodePreview && (
            <div className="b64-decode-result fade-in">
              <h3 className="b64-decode-result-title">
                ✅ Imagen decodificada ({decodedFormat.toUpperCase()})
              </h3>
              <div className="b64-decode-preview">
                <img src={decodePreview} alt="Imagen decodificada" />
              </div>
              <button className="b64-btn-download" onClick={handleDownloadDecoded}>
                💾 Descargar Imagen (.{decodedFormat})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
