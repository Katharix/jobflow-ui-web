import { Injectable, inject } from '@angular/core';
import { MessageService, ToastMessageOptions } from 'primeng/api';
import { ToastOptions, ToastKind } from './toast.models';
import { ToastRef } from './toast-ref';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageService = inject(MessageService);
  private readonly toastKey = 'app-toast';

  private push(toast: ToastOptions): ToastRef {
    toast.id = toast.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    if (toast.autoCloseMs === undefined) toast.autoCloseMs = 3500;
    if (toast.dismissible === undefined) toast.dismissible = true;

    const ref = new ToastRef();

    this.messageService.add(this.toPrimeMessage(toast));

    if (toast.autoCloseMs! > 0) {
      const timer = setTimeout(() => ref.close(), toast.autoCloseMs);
      ref.afterClosed().subscribe(() => clearTimeout(timer));
    }

    return ref;
  }

  private toPrimeMessage(toast: ToastOptions): ToastMessageOptions {
    const sticky = (toast.autoCloseMs ?? 0) <= 0;

    return {
      id: toast.id,
      key: this.toastKey,
      severity: this.mapSeverity(toast.kind ?? 'info'),
      summary: toast.title,
      detail: toast.message,
      life: sticky ? undefined : toast.autoCloseMs,
      sticky,
      closable: toast.dismissible,
    };
  }

  private mapSeverity(kind: ToastKind): string {
    return kind === 'warning' ? 'warn' : kind;
  }

  show(message: string, title?: string, kind: ToastKind = 'info', opts?: Partial<ToastOptions>) {
    return this.push({ message, title, kind, ...opts });
  }
  success(message: string, title?: string, opts?: Partial<ToastOptions>) { return this.show(message, title, 'success', opts); }
  info(message: string, title?: string, opts?: Partial<ToastOptions>)    { return this.show(message, title, 'info', opts); }
  warning(message: string, title?: string, opts?: Partial<ToastOptions>) { return this.show(message, title, 'warning', opts); }
  error(message: string, title?: string, opts?: Partial<ToastOptions>)   { return this.show(message, title, 'error', opts); }
}
