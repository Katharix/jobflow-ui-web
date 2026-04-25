import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HelpPanelService } from '../../services/shared/help-panel.service';
import { HelpContentService } from '../../services/shared/help-content.service';
import { HelpArticle, HELP_CATEGORY_LABELS, HELP_CATEGORY_ICONS } from '../../models/help-content';
import { JobflowDrawerComponent } from '../jobflow-drawer/jobflow-drawer.component';

@Component({
  selector: 'app-help-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, JobflowDrawerComponent],
  templateUrl: './help-panel.component.html',
  styleUrl: './help-panel.component.scss',
})
export class HelpPanelComponent implements OnInit {
  private helpPanel = inject(HelpPanelService);
  private helpContent = inject(HelpContentService);
  private destroyRef = inject(DestroyRef);

  readonly isOpen = this.helpPanel.isOpen;
  readonly contextCategory = this.helpPanel.contextCategory;

  searchTerm = signal('');
  articles = signal<HelpArticle[]>([]);
  loading = signal(true);
  showAllCategories = signal(false);
  expandedIds = signal<Set<string>>(new Set());

  readonly panelTitle = computed(() => {
    const cat = this.contextCategory();
    return HELP_CATEGORY_LABELS[cat] ?? 'Help';
  });

  readonly contextIcon = computed(() => {
    const cat = this.contextCategory();
    return HELP_CATEGORY_ICONS[cat] ?? 'ti ti-help';
  });

  readonly filteredArticles = computed(() => {
    const all = this.articles();
    const q = this.searchTerm().trim().toLowerCase();
    const cat = this.contextCategory();
    const showAll = this.showAllCategories();

    let result = showAll || q ? all : all.filter(a => a.category === cat);

    if (q) {
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.summary ?? '').toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q),
      );
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  ngOnInit(): void {
    this.helpContent.getPublishedArticles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.articles.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  close(): void {
    this.helpPanel.close();
  }

  toggleExpanded(id: string): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  getCategoryLabel(article: HelpArticle): string {
    return HELP_CATEGORY_LABELS[article.category] ?? article.category;
  }
}
