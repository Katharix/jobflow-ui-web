import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './services/idle-timeout.service';
import { UserSessionService } from './services/user-session.service'; // adjust path if needed
import { LogoutService } from './services/logout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'job-flow-ui-web';
  private sessionCheckInterval: any;
  private excludedRoutes = [
    '/',                // homepage
    '/about',
    '/pricing',
    '/contact',
    '/features',
    '/subscribe',
    '/invoice/view'     // dynamic segment: /invoice/view/:id
  ];



  constructor(
    private session: UserSessionService,
    private idleService: IdleTimeoutService,
    private logoutService: LogoutService,
    private router: Router,
  ) { }

  ngOnInit() {
    if (this.shouldCheckSession()) {
      if (this.session.isSessionExpired()) {
        this.logoutService.logout();
      }

      this.sessionCheckInterval = setInterval(() => {
        if (this.session.isSessionExpired()) {
          this.logoutService.logout();
        }
      }, 60 * 1000);
    }
  }


  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  onUserActivity() {
    this.session.updateActivity();
  }

  private shouldCheckSession(): boolean {
    const currentUrl = this.router.url.split('?')[0];
    return !this.excludedRoutes.some(route => currentUrl.startsWith(route));
  }
}