// loading-service.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this._loading.asObservable().pipe(
    debounceTime(100),            // ✅ Avoids flicker from quick toggles
    distinctUntilChanged()        // ✅ Avoids repeated same values
  );

  private loadingCount = 0;

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

  reset() {
    this.loadingCount = 0;
    this._loading.next(false);
  }
}
