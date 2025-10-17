// src/app/shared/toast/toast-container.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastOptions } from './toast.models';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080;">
    <div *ngFor="let t of toasts()" class="toast show mb-2 border-0 shadow"
         [ngClass]="kindClass(t.kind)" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header border-0">
        <strong class="me-auto">{{ t.title || titleFor(t.kind) }}</strong>
        <small class="text-muted">{{ now }}</small>
        <button *ngIf="t.dismissible !== false" type="button" class="btn-close ms-2 mb-1" (click)="dismiss(t.id!)"></button>
      </div>
      <div class="toast-body" *ngIf="t.message">{{ t.message }}</div>
    </div>
  </div>
  `,
})
export class ToastContainerComponent {
  // signals store
  private _toasts = signal<ToastOptions[]>([]);
  toasts = computed(() => this._toasts());

  // crude timestamp label (keeps static per render)
  now = new Date().toLocaleTimeString();

  setToasts(list: ToastOptions[]) { this._toasts.set(list); }

  dismiss(id: string) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  kindClass(kind: ToastOptions['kind']) {
    switch (kind) {
      case 'success': return 'bg-success text-white';
      case 'info':    return 'bg-primary text-white';
      case 'warning': return 'bg-warning';
      case 'error':   return 'bg-danger text-white';
      default:        return 'bg-light';
    }
  }

  titleFor(kind: ToastOptions['kind']) {
    switch (kind) {
      case 'success': return 'Success';
      case 'info':    return 'Info';
      case 'warning': return 'Warning';
      case 'error':   return 'Error';
      default:        return 'Notice';
    }
  }
}
