import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';

type TurnstileWidgetId = string | number;

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): TurnstileWidgetId;
  reset(widgetId?: TurnstileWidgetId): void;
  remove(widgetId: TurnstileWidgetId): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

@Component({
  selector: 'app-jobflow-turnstile',
  standalone: true,
  template: '<div #container></div>'
})
export class TurnstileWidgetComponent implements AfterViewInit, OnChanges, OnDestroy {
  private zone = inject(NgZone);

  @Input({ required: true }) siteKey = '';
  @Input() action = 'submit';

  @Output() resolved = new EventEmitter<string | null>();
  @Output() expired = new EventEmitter<void>();
  @Output() errored = new EventEmitter<void>();

  @ViewChild('container', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  private widgetId: TurnstileWidgetId | null = null;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderWidget();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) {
      return;
    }

    if (changes['siteKey'] || changes['action']) {
      this.removeWidget();
      this.renderWidget();
    }
  }

  ngOnDestroy(): void {
    this.removeWidget();
  }

  private renderWidget(): void {
    if (!this.siteKey || !window.turnstile) {
      this.errored.emit();
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.widgetId = window.turnstile!.render(this.containerRef.nativeElement, {
        sitekey: this.siteKey,
        action: this.action,
        callback: (token: string) => {
          this.zone.run(() => this.resolved.emit(token));
        },
        'expired-callback': () => {
          this.zone.run(() => this.expired.emit());
        },
        'error-callback': () => {
          this.zone.run(() => this.errored.emit());
        }
      });
    });
  }

  private removeWidget(): void {
    if (this.widgetId === null || !window.turnstile) {
      return;
    }

    window.turnstile.remove(this.widgetId);
    this.widgetId = null;
  }
}
