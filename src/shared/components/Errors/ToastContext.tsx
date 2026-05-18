import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import './Errors.css';

import { showToast as triggerToast } from '../UI/Toast/toastManager';

interface ToastContextType {
  showToast: (message: string, type?: 'error' | 'success') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    triggerToast(message, type);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
};
