import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

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

const TURNSTILE_SCRIPT_ID = 'jobflow-turnstile-api';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise: Promise<void> | null = null;

function ensureTurnstileScriptLoaded(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Turnstile requires a browser environment.'));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Turnstile script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script.'));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

@Component({
  selector: 'jobflow-turnstile',
  standalone: true,
  template: '<div #container></div>'
})
export class TurnstileWidgetComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) siteKey = '';
  @Input() action = 'submit';

  @Output() resolved = new EventEmitter<string | null>();
  @Output() expired = new EventEmitter<void>();
  @Output() errored = new EventEmitter<void>();

  @ViewChild('container', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  private widgetId: TurnstileWidgetId | null = null;
  private viewReady = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.renderWidget();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) {
      return;
    }

    if (changes['siteKey'] || changes['action']) {
      this.removeWidget();
      void this.renderWidget();
    }
  }

  ngOnDestroy(): void {
    this.removeWidget();
  }

  private async renderWidget(): Promise<void> {
    if (!this.siteKey) {
      return;
    }

    try {
      await ensureTurnstileScriptLoaded();

      if (!window.turnstile) {
        this.zone.run(() => this.errored.emit());
        return;
      }

      this.widgetId = window.turnstile.render(this.containerRef.nativeElement, {
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
    } catch {
      this.zone.run(() => this.errored.emit());
    }
  }

  private removeWidget(): void {
    if (this.widgetId === null || !window.turnstile) {
      return;
    }

    window.turnstile.remove(this.widgetId);
    this.widgetId = null;
  }
}
