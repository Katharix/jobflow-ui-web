import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-support-hub-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './support-hub-auth-layout.component.html',
  styleUrl: './support-hub-auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubAuthLayoutComponent {}
