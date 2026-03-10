import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LoadingService {

  private _loading = new BehaviorSubject<boolean>(false);
  private _forceLoading = new BehaviorSubject<boolean>(false);

  private loadingCount = 0;

  isLoading$ = combineLatest([
    this._loading,
    this._forceLoading
  ]).pipe(
    map(([loading, force]) => loading || force),
    distinctUntilChanged()
  );

  constructor(private router: Router) {

    // Automatically clear forced loading when navigation finishes
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.reset();
      }
    });

  }

  show() {
    this.loadingCount++;
    this._loading.next(true);
  }

  hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);

    if (this.loadingCount === 0) {
      this._loading.next(false);
    }
  }

  /**
   * Forces loader to stay visible until Angular navigation occurs.
   * Useful for redirects (Stripe, OAuth, etc.)
   */
  forceShowUntilNavigation() {
    this._forceLoading.next(true);
    this._loading.next(true);
  }

  reset() {
    this.loadingCount = 0;
    this._loading.next(false);
    this._forceLoading.next(false);
  }
}