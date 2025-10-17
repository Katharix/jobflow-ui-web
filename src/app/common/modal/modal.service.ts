import { Injectable, Injector, Type, inject } from '@angular/core';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MODAL_DATA } from './modal.tokens';
import { ModalConfig } from './modal-config';
import { ModalRef } from './modal-ref';
import { ModalContainerComponent } from './modal-container.component';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private overlay = inject(Overlay);

  open<TComponent, TResult = unknown, TData = unknown>(
    component: Type<TComponent>,
    config: ModalConfig<TData> = {}
  ): ModalRef<TResult> {
    const hasBackdrop = config.hasBackdrop ?? true;
    const backdropClosable = config.backdropClosable ?? true;

    // Normalize panelClass for OverlayConfig
    const baseClasses = ['d-flex', 'justify-content-center', 'align-items-center'];
    const normalizedPanelClass = Array.isArray(config.panelClass)
      ? [...baseClasses, ...config.panelClass]
      : [...baseClasses, ...(config.panelClass ? [config.panelClass] : [])];

    const overlayConfig: OverlayConfig = {
      hasBackdrop,
      // keep this to ONE token; we’ll add bootstrap classes manually
      backdropClass: 'cdk-overlay-dark-backdrop',
      panelClass: normalizedPanelClass,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: config.width,
      height: config.height,
      maxWidth: config.maxWidth ?? '90vw',
      maxHeight: config.maxHeight ?? '85vh',
      positionStrategy: config.position ?? this.overlay.position().global().centerHorizontally().centerVertically(),
    };

    const overlayRef = this.overlay.create(overlayConfig);
    const modalRef = new ModalRef<TResult>();

    // Add Bootstrap backdrop classes individually
    const backdropEl = overlayRef.backdropElement;
    if (backdropEl) ['modal-backdrop', 'fade', 'show'].forEach(cls => backdropEl.classList.add(cls));

    // 1) Attach the container to the overlay
    const containerPortal = new ComponentPortal(ModalContainerComponent);
    const containerRef = overlayRef.attach(containerPortal);

    // 2) Build injector for CONTENT (ModalRef + Data)
    const contentInjector = Injector.create({
      parent: containerRef.injector,
      providers: [
        { provide: ModalRef, useValue: modalRef },
        { provide: MODAL_DATA, useValue: config.data }
      ]
    });

    // 3) Attach the CONTENT portal into the container’s outlet
    const contentPortal = new ComponentPortal(component, null, contentInjector);
    containerRef.instance.attach(contentPortal);

    // Close on backdrop click + ESC
    if (overlayConfig.hasBackdrop && backdropClosable) {
      overlayRef.backdropClick().subscribe(() => modalRef._close());
    }
    overlayRef.keydownEvents().subscribe(evt => {
      if (evt.key === 'Escape') modalRef._close();
    });

    // Cleanup
    const sub = modalRef.afterClosed().subscribe(() => {
      sub.unsubscribe();
      overlayRef.dispose();
    });

    Promise.resolve().then(() => modalRef._emitOpened());
    return modalRef;
  }
}
