import React, { useState, useEffect, useCallback } from 'react';
import { ToastEvent } from './toastManager';
import './Toast.css';

interface ToastItem extends ToastEvent {
  id: number;
  isExiting: boolean;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );

    // Esperar a que termine la animación de salida antes de eliminar del DOM
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 400);
  }, []);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const { message, type, duration = 4000 } = (e as CustomEvent<ToastEvent>).detail;
      const id = Date.now();

      const newToast: ToastItem = { id, message, type, duration, isExiting: false };
      setToasts((current) => [...current, newToast]);

      // Auto-eliminación tras el tiempo especificado
      setTimeout(() => {
        removeToast(id);
      }, duration);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type} ${toast.isExiting ? 'toast--exit' : ''}`}
        >
          <div className="toast__icon">
            {toast.type === 'error' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <div className="toast__message">{toast.message}</div>
        </div>
      ))}
    </div>
  );
};
