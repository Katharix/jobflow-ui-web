import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'preferredLanguage';

@Injectable({ providedIn: 'root' })
export class LocalizationService {
  private readonly translate = inject(TranslateService);
  private readonly supported = ['en', 'es', 'fr', 'pt', 'de', 'it'];

  init(): void {
    const stored = this.getStoredLanguage();
    const browser = this.resolveBrowserLanguage();
    const initial = stored ?? browser ?? 'en';
    this.setLanguage(initial, false);
  }

  setLanguage(lang: string, persist = true): void {
    const normalized = this.normalizeLanguage(lang);
    this.translate.use(normalized);

    if (persist) {
      localStorage.setItem(STORAGE_KEY, normalized);
    }
  }

  getCurrentLanguage(): string {
    return this.translate.currentLang ?? this.translate.defaultLang ?? 'en';
  }

  private normalizeLanguage(lang: string | null | undefined): string {
    if (!lang) return 'en';
    const lower = lang.toLowerCase();

    if (this.supported.includes(lower)) return lower;

    const base = lower.split('-')[0];
    return this.supported.includes(base) ? base : 'en';
  }

  private getStoredLanguage(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  private resolveBrowserLanguage(): string | null {
    const browserLang = this.translate.getBrowserLang();
    return this.normalizeLanguage(browserLang ?? undefined);
  }
}
