// loading-service.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  isLoading$ = this._loading.asObservable();

  private loadingCount = 0;

  show() {
    this.loadingCount++;
    console.log('Show spinner. Loading count:', this.loadingCount);
    this._loading.next(true);
  }

  hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    console.log('Hide spinner. Loading count:', this.loadingCount);
    if (this.loadingCount === 0) {
      this._loading.next(false);
    }
  }
}
