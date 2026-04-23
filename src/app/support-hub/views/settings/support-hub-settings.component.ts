import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';

interface SupportHubPreferences {
  notifyOnNewTicket: boolean;
  notifyOnEscalation: boolean;
  notifyOnSessionStart: boolean;
  notifyOnChatMessage: boolean;
  defaultTicketPriority: string;
  autoRefreshInterval: number;
}

const PREFS_KEY = 'sh_preferences';

const DEFAULT_PREFS: SupportHubPreferences = {
  notifyOnNewTicket: true,
  notifyOnEscalation: true,
  notifyOnSessionStart: false,
  notifyOnChatMessage: false,
  defaultTicketPriority: 'Normal',
  autoRefreshInterval: 30,
};

@Component({
  selector: 'app-support-hub-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToggleSwitchModule, SelectModule],
  templateUrl: './support-hub-settings.component.html',
  styleUrl: './support-hub-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubSettingsComponent implements OnInit {
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);

  userDisplayName = '';
  userEmail = '';
  userRole = '';
  lastSignIn = '';

  prefs: SupportHubPreferences = { ...DEFAULT_PREFS };

  priorityOptions = [
    { label: 'Urgent', value: 'Urgent' },
    { label: 'High', value: 'High' },
    { label: 'Normal', value: 'Normal' },
    { label: 'Low', value: 'Low' },
  ];

  refreshOptions = [
    { label: 'Off', value: 0 },
    { label: '15 seconds', value: 15 },
    { label: '30 seconds', value: 30 },
    { label: '60 seconds', value: 60 },
  ];

  saved = false;
  activeTab: 'profile' | 'notifications' | 'preferences' = 'profile';

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.userDisplayName = user.displayName ?? user.email?.split('@')[0] ?? 'Staff';
      this.userEmail = user.email ?? '';
      this.lastSignIn = user.metadata?.lastSignInTime ?? '';

      user.getIdTokenResult().then(token => {
        this.userRole = (token.claims['role'] as string) ?? 'Unknown';
        this.cdr.markForCheck();
      });
    }

    this.loadPrefs();
  }

  savePrefs(): void {
    localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
    this.saved = true;
    setTimeout(() => {
      this.saved = false;
      this.cdr.markForCheck();
    }, 2500);
  }

  resetPrefs(): void {
    this.prefs = { ...DEFAULT_PREFS };
    localStorage.removeItem(PREFS_KEY);
  }

  private loadPrefs(): void {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      try {
        this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
      } catch {
        this.prefs = { ...DEFAULT_PREFS };
      }
    }
  }
}
