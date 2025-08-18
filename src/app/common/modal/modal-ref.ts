import { Subject, Observable } from 'rxjs';

export class ModalRef<TResult = unknown> {
  private readonly _afterClosed = new Subject<TResult | undefined>();
  private readonly _afterOpened = new Subject<void>();

  afterClosed(): Observable<TResult | undefined> { return this._afterClosed.asObservable(); }
  afterOpened(): Observable<void> { return this._afterOpened.asObservable(); }

  /** @internal */ _emitOpened() { this._afterOpened.next(); this._afterOpened.complete(); }
  /** @internal */ _close(result?: TResult) { this._afterClosed.next(result); this._afterClosed.complete(); }
}
