import { OverlayConfig } from '@angular/cdk/overlay';

export interface ModalConfig<TData = unknown> {
  data?: TData;
  backdropClosable?: boolean; // default true
  hasBackdrop?: boolean;      // default true
  panelClass?: string | string[];
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  position?: OverlayConfig['positionStrategy'];
}