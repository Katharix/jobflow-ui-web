// src/app/shared/toast/toast-ref.ts
import { Subject, Observable } from 'rxjs';

export class ToastRef {
  private closed$ = new Subject<void>();
  close() { this.closed$.next(); this.closed$.complete(); }
  afterClosed(): Observable<void> { return this.closed$.asObservable(); }
}
