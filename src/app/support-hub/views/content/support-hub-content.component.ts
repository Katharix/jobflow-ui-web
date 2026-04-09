import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { HelpContentService } from '../../../services/shared/help-content.service';
import {
  HelpArticle,
  HelpArticleCreateRequest,
  HelpArticleUpdateRequest,
  HelpArticleCategory,
  HelpArticleType,
  ChangelogEntry,
  ChangelogEntryCreateRequest,
  ChangelogEntryUpdateRequest,
  ChangelogCategory,
  HELP_CATEGORY_LABELS
} from '../../../models/help-content';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';

type EditorMode = 'create' | 'edit';

@Component({
  selector: 'app-support-hub-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    ButtonModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    TabsModule,
    TagModule,
    CheckboxModule,
    InputNumberModule
  ],
  templateUrl: './support-hub-content.component.html',
  styleUrl: './support-hub-content.component.scss'
})
export class SupportHubContentComponent implements OnInit {
  private helpService = inject(HelpContentService);
  private cdr = inject(ChangeDetectorRef);

  activeTab = '0';

  // ── Articles ──────────────────────────────────────────
  articles: HelpArticle[] = [];
  articlesLoading = true;
  articleError = '';
  articleSuccess = '';
  showArticleEditor = false;
  articleEditorMode: EditorMode = 'create';
  editingArticle: HelpArticleUpdateRequest | null = null;

  newArticle: HelpArticleCreateRequest = this.emptyArticle();

  readonly categoryOptions = Object.entries(HELP_CATEGORY_LABELS).map(([value, label]) => ({
    label,
    value: value as HelpArticleCategory
  }));

  readonly typeOptions: { label: string; value: HelpArticleType }[] = [
    { label: 'Guide', value: 'Guide' },
    { label: 'FAQ', value: 'Faq' }
  ];

  // ── Changelog ─────────────────────────────────────────
  changelog: ChangelogEntry[] = [];
  changelogLoading = true;
  changelogError = '';
  changelogSuccess = '';
  showChangelogEditor = false;
  changelogEditorMode: EditorMode = 'create';
  editingChangelog: ChangelogEntryUpdateRequest | null = null;

  newChangelog: ChangelogEntryCreateRequest = this.emptyChangelog();

  readonly changelogCategoryOptions: { label: string; value: ChangelogCategory }[] = [
    { label: 'Feature', value: 'Feature' },
    { label: 'Improvement', value: 'Improvement' },
    { label: 'Fix', value: 'Fix' }
  ];

  ngOnInit(): void {
    this.loadArticles();
    this.loadChangelog();
  }

  // ── Article Methods ───────────────────────────────────

  loadArticles(): void {
    this.articlesLoading = true;
    this.articleError = '';
    this.helpService.getAllArticles().subscribe({
      next: (data) => {
        this.articles = data;
        this.articlesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.articleError = 'Failed to load articles.';
        this.articlesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateArticle(): void {
    this.articleEditorMode = 'create';
    this.newArticle = this.emptyArticle();
    this.editingArticle = null;
    this.showArticleEditor = true;
  }

  openEditArticle(article: HelpArticle): void {
    this.articleEditorMode = 'edit';
    this.editingArticle = {
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      articleType: article.articleType,
      category: article.category,
      tags: article.tags,
      isFeatured: article.isFeatured,
      isPublished: article.isPublished,
      sortOrder: article.sortOrder
    };
    this.showArticleEditor = true;
  }

  cancelArticleEditor(): void {
    this.showArticleEditor = false;
    this.editingArticle = null;
  }

  saveArticle(): void {
    this.articleError = '';
    this.articleSuccess = '';

    if (this.articleEditorMode === 'create') {
      this.helpService.createArticle(this.newArticle).subscribe({
        next: () => {
          this.articleSuccess = 'Article created.';
          this.showArticleEditor = false;
          this.loadArticles();
          this.cdr.detectChanges();
        },
        error: () => {
          this.articleError = 'Failed to create article.';
          this.cdr.detectChanges();
        }
      });
    } else if (this.editingArticle) {
      this.helpService.updateArticle(this.editingArticle).subscribe({
        next: () => {
          this.articleSuccess = 'Article updated.';
          this.showArticleEditor = false;
          this.editingArticle = null;
          this.loadArticles();
          this.cdr.detectChanges();
        },
        error: () => {
          this.articleError = 'Failed to update article.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteArticle(article: HelpArticle): void {
    this.articleError = '';
    this.articleSuccess = '';
    this.helpService.deleteArticle(article.id).subscribe({
      next: () => {
        this.articleSuccess = 'Article deleted.';
        this.loadArticles();
        this.cdr.detectChanges();
      },
      error: () => {
        this.articleError = 'Failed to delete article.';
        this.cdr.detectChanges();
      }
    });
  }

  getCategoryLabel(category: HelpArticleCategory): string {
    return HELP_CATEGORY_LABELS[category] ?? category;
  }

  getArticleTypeSeverity(type: HelpArticleType): 'info' | 'warn' {
    return type === 'Guide' ? 'info' : 'warn';
  }

  // ── Changelog Methods ─────────────────────────────────

  loadChangelog(): void {
    this.changelogLoading = true;
    this.changelogError = '';
    this.helpService.getAllChangelog().subscribe({
      next: (data) => {
        this.changelog = data;
        this.changelogLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.changelogError = 'Failed to load changelog.';
        this.changelogLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateChangelog(): void {
    this.changelogEditorMode = 'create';
    this.newChangelog = this.emptyChangelog();
    this.editingChangelog = null;
    this.showChangelogEditor = true;
  }

  openEditChangelog(entry: ChangelogEntry): void {
    this.changelogEditorMode = 'edit';
    this.editingChangelog = {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      version: entry.version,
      category: entry.category,
      isPublished: entry.isPublished
    };
    this.showChangelogEditor = true;
  }

  cancelChangelogEditor(): void {
    this.showChangelogEditor = false;
    this.editingChangelog = null;
  }

  saveChangelog(): void {
    this.changelogError = '';
    this.changelogSuccess = '';

    if (this.changelogEditorMode === 'create') {
      this.helpService.createChangelogEntry(this.newChangelog).subscribe({
        next: () => {
          this.changelogSuccess = 'Changelog entry created.';
          this.showChangelogEditor = false;
          this.loadChangelog();
          this.cdr.detectChanges();
        },
        error: () => {
          this.changelogError = 'Failed to create changelog entry.';
          this.cdr.detectChanges();
        }
      });
    } else if (this.editingChangelog) {
      this.helpService.updateChangelogEntry(this.editingChangelog).subscribe({
        next: () => {
          this.changelogSuccess = 'Changelog entry updated.';
          this.showChangelogEditor = false;
          this.editingChangelog = null;
          this.loadChangelog();
          this.cdr.detectChanges();
        },
        error: () => {
          this.changelogError = 'Failed to update changelog entry.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteChangelog(entry: ChangelogEntry): void {
    this.changelogError = '';
    this.changelogSuccess = '';
    this.helpService.deleteChangelogEntry(entry.id).subscribe({
      next: () => {
        this.changelogSuccess = 'Changelog entry deleted.';
        this.loadChangelog();
        this.cdr.detectChanges();
      },
      error: () => {
        this.changelogError = 'Failed to delete changelog entry.';
        this.cdr.detectChanges();
      }
    });
  }

  getChangelogSeverity(category: ChangelogCategory): 'success' | 'info' | 'warn' {
    switch (category) {
      case 'Feature': return 'success';
      case 'Improvement': return 'info';
      case 'Fix': return 'warn';
    }
  }

  // ── Helpers ───────────────────────────────────────────

  get currentArticleForm(): HelpArticleCreateRequest | HelpArticleUpdateRequest {
    return this.articleEditorMode === 'edit' && this.editingArticle
      ? this.editingArticle
      : this.newArticle;
  }

  get currentChangelogForm(): ChangelogEntryCreateRequest | ChangelogEntryUpdateRequest {
    return this.changelogEditorMode === 'edit' && this.editingChangelog
      ? this.editingChangelog
      : this.newChangelog;
  }

  private emptyArticle(): HelpArticleCreateRequest {
    return {
      title: '',
      summary: '',
      content: '',
      articleType: 'Guide',
      category: 'GettingStarted',
      tags: '',
      isFeatured: false,
      isPublished: false,
      sortOrder: 0
    };
  }

  private emptyChangelog(): ChangelogEntryCreateRequest {
    return {
      title: '',
      description: '',
      version: '',
      category: 'Feature',
      isPublished: false
    };
  }
}
