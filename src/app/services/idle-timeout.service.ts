import { Injectable, NgZone } from '@angular/core';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserSessionService } from './user-session.service';

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private userActivityEvents = ['mousemove', 'keydown', 'click', 'touchstart'];
  private idleTime = 15 * 60 * 1000; // 15 minutes in ms
  private timeoutSub?: Subscription;

  constructor(
    private router: Router,
    private zone: NgZone,
    private session: UserSessionService
  ) {}

  startWatching() {
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        ...this.userActivityEvents.map(event =>
          fromEvent(document, event)
        )
      );

      this.timeoutSub = activity$
        .pipe(
          switchMap(() => timer(this.idleTime))
        )
        .subscribe(() => {
          this.zone.run(() => this.logout());
        });
    });
  }

  stopWatching() {
    this.timeoutSub?.unsubscribe();
  }

  resetTimer() {
    this.stopWatching();
    this.startWatching();
  }

  private logout() {
    this.session.clearSession();
    this.router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
  }
}
