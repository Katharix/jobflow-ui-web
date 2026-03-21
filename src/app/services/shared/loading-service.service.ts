import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private router = inject(Router);


  private _loading = new BehaviorSubject<boolean>(false);
  private _forceLoading = new BehaviorSubject<boolean>(false);

  private loadingCount = 0;
  private readonly showDelayMs = 150;
  private readonly minVisibleMs = 250;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private visibleSince: number | null = null;

  isLoading$ = combineLatest([
    this._loading,
    this._forceLoading
  ]).pipe(
    map(([loading, force]) => loading || force),
    distinctUntilChanged()
  );

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.reset();
      }
    });
  }

  show() {
    this.loadingCount++;

    if (this.loadingCount === 1 && !this._forceLoading.getValue()) {
      this.clearHideTimer();
      this.clearShowTimer();

      this.showTimer = setTimeout(() => {
        if (this.loadingCount > 0 || this._forceLoading.getValue()) {
          this.visibleSince = Date.now();
          this._loading.next(true);
        }
      }, this.showDelayMs);
    }
  }

  hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);

    if (this.loadingCount === 0) {
      this.clearShowTimer();

      if (!this._loading.getValue()) {
        this._loading.next(false);
        return;
      }

      const elapsed = this.visibleSince ? Date.now() - this.visibleSince : 0;
      const remaining = Math.max(0, this.minVisibleMs - elapsed);

      this.clearHideTimer();
      this.hideTimer = setTimeout(() => {
        this.visibleSince = null;
        this._loading.next(false);
      }, remaining);
    }
  }

  forceShowUntilNavigation() {
    this.clearShowTimer();
    this.clearHideTimer();
    this.visibleSince = Date.now();
    this._forceLoading.next(true);
    this._loading.next(true);
  }

  reset() {
    this.clearShowTimer();
    this.clearHideTimer();
    this.loadingCount = 0;
    this.visibleSince = null;
    this._loading.next(false);
    this._forceLoading.next(false);
  }

  private clearShowTimer(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  private clearHideTimer(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
