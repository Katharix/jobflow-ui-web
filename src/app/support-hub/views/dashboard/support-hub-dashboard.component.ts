import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { SupportHubTicket } from '../../models/support-hub-ticket';
import { SupportHubSession } from '../../models/support-hub-session';
import { OrganizationService } from '../../../services/shared/organization.service';
import { OrganizationDto } from '../../../models/organization';
import { HelpContentService } from '../../../services/shared/help-content.service';
import { HelpArticle, ChangelogEntry } from '../../../models/help-content';
import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-support-hub-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './support-hub-dashboard.component.html',
  styleUrl: './support-hub-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubDashboardComponent implements OnInit {
  private dataService = inject(SupportHubDataService);
  private orgService = inject(OrganizationService);
  private helpService = inject(HelpContentService);
  private cdr = inject(ChangeDetectorRef);

  tickets: SupportHubTicket[] = [];
  sessions: SupportHubSession[] = [];
  organizations: OrganizationDto[] = [];
  articles: HelpArticle[] = [];
  changelog: ChangelogEntry[] = [];
  isLoading = true;

  get openTickets(): number {
    return this.tickets.filter(t => t.status !== 'Resolved').length;
  }

  get urgentTickets(): number {
    return this.tickets.filter(t => t.status === 'Urgent').length;
  }

  get liveSessions(): number {
    return this.sessions.filter(s => s.status === 'Live').length;
  }

  get queuedSessions(): number {
    return this.sessions.filter(s => s.status === 'Queued').length;
  }

  get publishedArticles(): number {
    return this.articles.filter(a => a.isPublished).length;
  }

  get recentTickets(): SupportHubTicket[] {
    return [...this.tickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  get activeSessions(): SupportHubSession[] {
    return this.sessions.filter(s => s.status === 'Live' || s.status === 'Queued');
  }

  ngOnInit(): void {
    forkJoin({
      tickets: this.dataService.getTickets().pipe(catchError(e => { console.error('[SH] tickets failed', e); return of([] as SupportHubTicket[]); })),
      sessions: this.dataService.getSessions().pipe(catchError(e => { console.error('[SH] sessions failed', e); return of([] as SupportHubSession[]); })),
      organizations: this.orgService.getAllOrganizations().pipe(catchError(e => { console.error('[SH] organizations failed', e); return of([] as OrganizationDto[]); })),
      articles: this.helpService.getAllArticles().pipe(catchError(e => { console.error('[SH] articles failed', e); return of([] as HelpArticle[]); })),
      changelog: this.helpService.getAllChangelog().pipe(catchError(e => { console.error('[SH] changelog failed', e); return of([] as ChangelogEntry[]); })),
    }).subscribe({
      next: (data) => {
        this.tickets = data.tickets ?? [];
        this.sessions = data.sessions ?? [];
        this.organizations = (data.organizations ?? []) as OrganizationDto[];
        this.articles = data.articles ?? [];
        this.changelog = data.changelog ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Urgent': return 'sh-badge sh-badge--red';
      case 'High': return 'sh-badge sh-badge--orange';
      case 'Normal': return 'sh-badge sh-badge--blue';
      case 'Low': return 'sh-badge sh-badge--green';
      case 'Resolved': return 'sh-badge sh-badge--gray';
      case 'Live': return 'sh-badge sh-badge--green';
      case 'Queued': return 'sh-badge sh-badge--blue';
      default: return 'sh-badge sh-badge--gray';
    }
  }
}
