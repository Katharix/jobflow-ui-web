// src/app/shared/toast/toast.models.ts
export type ToastKind = 'success' | 'info' | 'warning' | 'error';

export interface ToastOptions {
  title?: string;
  message?: string;
  kind?: ToastKind;
  autoCloseMs?: number;   // default 3500
  dismissible?: boolean;  // default true
  id?: string;            // internal
}
