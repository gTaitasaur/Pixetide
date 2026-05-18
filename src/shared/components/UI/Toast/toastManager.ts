type ToastType = 'success' | 'error' | 'info';

export interface ToastEvent {
  message: string;
  type: ToastType;
  duration?: number;
}

// Sistema de eventos simple para disparar Toasts desde cualquier lugar (Worker, Utils, Hooks)
export const showToast = (message: string, type: ToastType = 'info', duration: number = 4000) => {
  const event = new CustomEvent<ToastEvent>('show-toast', {
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};
