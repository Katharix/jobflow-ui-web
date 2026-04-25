import { Injectable, inject } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import {
  HelpArticle,
  HelpArticleCreateRequest,
  HelpArticleUpdateRequest,
  ChangelogEntry,
  ChangelogEntryCreateRequest,
  ChangelogEntryUpdateRequest
} from '../../models/help-content';

@Injectable({ providedIn: 'root' })
export class HelpContentService {
  private api = inject(BaseApiService);
  private apiUrl = 'help-content';

  // ── Published (org-facing) ────────────────────────────

  getPublishedArticles(): Observable<HelpArticle[]> {
    return this.api.get<HelpArticle[]>(`${this.apiUrl}/articles/published`);
  }

  getPublishedChangelog(): Observable<ChangelogEntry[]> {
    return this.api.get<ChangelogEntry[]>(`${this.apiUrl}/changelog/published`);
  }

  // ── Admin (Support Hub) ───────────────────────────────

  getAllArticles(): Observable<HelpArticle[]> {
    return this.api.get<HelpArticle[]>(`${this.apiUrl}/articles`);
  }

  getArticle(id: string): Observable<HelpArticle> {
    return this.api.get<HelpArticle>(`${this.apiUrl}/articles/${id}`);
  }

  createArticle(request: HelpArticleCreateRequest): Observable<HelpArticle> {
    return this.api.post<HelpArticle>(`${this.apiUrl}/articles`, request);
  }

  updateArticle(request: HelpArticleUpdateRequest): Observable<HelpArticle> {
    return this.api.put<HelpArticle>(`${this.apiUrl}/articles`, request);
  }

  deleteArticle(id: string): Observable<void> {
    return this.api.delete<void>(`${this.apiUrl}/articles/${id}`);
  }

  getAllChangelog(): Observable<ChangelogEntry[]> {
    return this.api.get<ChangelogEntry[]>(`${this.apiUrl}/changelog`);
  }

  createChangelogEntry(request: ChangelogEntryCreateRequest): Observable<ChangelogEntry> {
    return this.api.post<ChangelogEntry>(`${this.apiUrl}/changelog`, request);
  }

  updateChangelogEntry(request: ChangelogEntryUpdateRequest): Observable<ChangelogEntry> {
    return this.api.put<ChangelogEntry>(`${this.apiUrl}/changelog`, request);
  }

  deleteChangelogEntry(id: string): Observable<void> {
    return this.api.delete<void>(`${this.apiUrl}/changelog/${id}`);
  }

  /** Fire-and-forget analytics event. Errors are silently swallowed. */
  trackEvent(eventType: string): void {
    this.api.post<void>(`${this.apiUrl}/events`, { eventType })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }
}
