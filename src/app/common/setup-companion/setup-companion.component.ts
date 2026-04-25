import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { SetupCompanionApiService } from '../../services/shared/setup-companion-api.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';

export interface CompanionAnswer {
  key: string;
  label: string;
  next?: string;
}

export interface CompanionNode {
  key: string;
  question?: string;
  answer?: string;
  terminal?: boolean;
  answers?: CompanionAnswer[];
}

export interface HistoryEntry {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-setup-companion',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './setup-companion.component.html',
  styleUrl: './setup-companion.component.scss',
})
export class SetupCompanionComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(SetupCompanionApiService);
  private orgContext = inject(OrganizationContextService);
  private destroyRef = inject(DestroyRef);

  isOpen = signal(false);
  currentNode = signal<CompanionNode | null>(null);
  history = signal<HistoryEntry[]>([]);
  visible = signal(false);

  private tree: Record<string, CompanionNode> = {};
  private sessionId = crypto.randomUUID();
  private orgId: string | null = null;

  ngOnInit(): void {
    this.orgContext.org$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(org => {
        this.orgId = org?.id ?? null;
        this.visible.set(!!this.orgId && org?.onboardingComplete === true);
      });

    this.http.get<Record<string, CompanionNode>>('/assets/setup-companion/questions.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tree => {
        this.tree = tree;
        this.currentNode.set(tree['root'] ?? null);
      });
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.history().length === 0) {
      this.currentNode.set(this.tree['root'] ?? null);
    }
  }

  selectAnswer(answer: CompanionAnswer): void {
    const node = this.currentNode();
    if (!node || !node.question) return;

    // Track event
    if (this.orgId) {
      this.apiService.trackEvent({
        sessionId: this.sessionId,
        questionKey: node.key,
        answerKey: answer.key,
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    // Append to history
    this.history.update(h => [...h, { question: node.question!, answer: answer.label }]);

    // Navigate to next node
    const next = answer.next ? this.tree[answer.next] : null;
    this.currentNode.set(next ?? null);
  }

  restart(): void {
    this.history.set([]);
    this.currentNode.set(this.tree['root'] ?? null);
    this.sessionId = crypto.randomUUID();
  }

  close(): void {
    this.isOpen.set(false);
  }
}
