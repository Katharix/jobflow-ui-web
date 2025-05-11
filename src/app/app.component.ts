import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './services/idle-timeout.service';
import { UserSessionService } from './services/user-session.service'; // adjust path if needed

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'job-flow-ui-web';

  constructor(
    private session: UserSessionService,
    private idleService: IdleTimeoutService
  ) {}

  ngOnInit(): void {
    if (this.session.isLoggedIn) {
      this.idleService.startWatching();
    }
  }
}