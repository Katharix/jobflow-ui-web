// src/app/shared/toast/toast.service.ts
import { Injectable, inject } from '@angular/core';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ToastOptions, ToastKind } from './toast.models';
import { ToastRef } from './toast-ref';
import { ToastContainerComponent } from './toast-container.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private overlay = inject(Overlay);
  private overlayRef = this.overlay.create(this.overlayConfig());
  private portal = new ComponentPortal(ToastContainerComponent);
  private containerRef = this.overlayRef.attach(this.portal);
  private list: ToastOptions[] = [];

private overlayConfig(): OverlayConfig {
  return {
    hasBackdrop: false,
    panelClass: ['app-toast-overlay'],   // ⬅ add this
    scrollStrategy: this.overlay.scrollStrategies.noop(),
    positionStrategy: this.overlay.position().global().top('0').right('0'),
  };
}

  private push(toast: ToastOptions): ToastRef {
    toast.id = toast.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    // defaults
    if (toast.autoCloseMs === undefined) toast.autoCloseMs = 3500;
    if (toast.dismissible === undefined) toast.dismissible = true;

    // limit stack (e.g., 5)
    this.list = [toast, ...this.list].slice(0, 5);
    this.containerRef.instance.setToasts(this.list);

    const ref = new ToastRef();
    if (toast.autoCloseMs! > 0) {
      const id = toast.id;
      const timer = setTimeout(() => {
        this.list = this.list.filter(t => t.id !== id);
        this.containerRef.instance.setToasts(this.list);
        ref.close();
      }, toast.autoCloseMs);
      ref.afterClosed().subscribe(() => clearTimeout(timer));
    }
    return ref;
  }

  show(message: string, title?: string, kind: ToastKind = 'info', opts?: Partial<ToastOptions>) {
    return this.push({ message, title, kind, ...opts });
  }
  success(message: string, title?: string, opts?: Partial<ToastOptions>) { return this.show(message, title, 'success', opts); }
  info(message: string, title?: string, opts?: Partial<ToastOptions>)    { return this.show(message, title, 'info', opts); }
  warning(message: string, title?: string, opts?: Partial<ToastOptions>) { return this.show(message, title, 'warning', opts); }
  error(message: string, title?: string, opts?: Partial<ToastOptions>)   { return this.show(message, title, 'error', opts); }
}
