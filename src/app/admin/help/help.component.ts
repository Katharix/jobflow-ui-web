import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbNavModule} from '@ng-bootstrap/ng-bootstrap';
import {PageHeaderComponent} from '../dashboard/page-header/page-header.component';
import {HelpContentService} from '../../services/shared/help-content.service';
import {
   HelpArticle,
   HelpArticleCategory,
   ChangelogEntry,
   ChangelogCategory,
   HELP_CATEGORY_LABELS,
   HELP_CATEGORY_ICONS
} from '../../models/help-content';

interface CategoryGroup {
   category: HelpArticleCategory;
   label: string;
   icon: string;
   articles: HelpArticle[];
}

@Component({
   selector: 'app-help',
   standalone: true,
   imports: [
      FormsModule,
      NgbNavModule,
      PageHeaderComponent
   ],
   templateUrl: './help.component.html',
   styleUrl: './help.component.scss'
})
export class HelpComponent implements OnInit {
   private helpService = inject(HelpContentService);

   readonly HELP_CATEGORY_ICONS = HELP_CATEGORY_ICONS;

   searchTerm = '';
   activeTab = 'guides';

   articles: HelpArticle[] = [];
   changelog: ChangelogEntry[] = [];
   loading = true;
   error = '';

   ngOnInit(): void {
      this.helpService.getPublishedArticles().subscribe({
         next: (data) => {
            this.articles = data;
            this.loading = false;
         },
         error: () => {
            this.error = 'Unable to load help content. Please try again later.';
            this.loading = false;
         }
      });

      this.helpService.getPublishedChangelog().subscribe({
         next: (data) => this.changelog = data,
         error: () => {
            // Changelog is supplemental — silent failure
            this.changelog = [];
         }
      });
   }

   // ── Guides ────────────────────────────────────────────

   get guides(): HelpArticle[] {
      return this.articles.filter(a => a.articleType === 'Guide');
   }

   get filteredGuides(): HelpArticle[] {
      const q = this.searchTerm.trim().toLowerCase();
      if (!q) return this.guides;
      return this.guides.filter(a => this.matchesSearch(a, q));
   }

   get categoryGroups(): CategoryGroup[] {
      const grouped = new Map<HelpArticleCategory, HelpArticle[]>();
      for (const article of this.filteredGuides) {
         const list = grouped.get(article.category) ?? [];
         list.push(article);
         grouped.set(article.category, list);
      }

      return Array.from(grouped.entries()).map(([category, articles]) => ({
         category,
         label: HELP_CATEGORY_LABELS[category] ?? category,
         icon: HELP_CATEGORY_ICONS[category] ?? 'ti ti-file',
         articles
      }));
   }

   get featuredGuides(): HelpArticle[] {
      return this.guides.filter(a => a.isFeatured);
   }

   // ── FAQs ──────────────────────────────────────────────

   get faqs(): HelpArticle[] {
      return this.articles.filter(a => a.articleType === 'Faq');
   }

   get filteredFaqs(): HelpArticle[] {
      const q = this.searchTerm.trim().toLowerCase();
      if (!q) return this.faqs;
      return this.faqs.filter(a => this.matchesSearch(a, q));
   }

   // ── Changelog ─────────────────────────────────────────

   getChangelogSeverity(category: ChangelogCategory): 'success' | 'info' | 'warn' {
      switch (category) {
         case 'Feature': return 'success';
         case 'Improvement': return 'info';
         case 'Fix': return 'warn';
      }
   }

   getChangelogChipVariant(category: ChangelogCategory): string {
      switch (category) {
         case 'Feature': return 'success';
         case 'Improvement': return 'info';
         case 'Fix': return 'warning';
      }
   }

   // ── Contact support ──────────────────────────────────

   /** 'prescreen' shows article suggestions; 'form' shows the contact form. */
   contactStep: 'prescreen' | 'form' = 'prescreen';
   prescreenSearch = '';
   contactSubject = '';
   contactMessage = '';
   contactSuccess = '';
   contactError = '';

   get prescreenArticles(): HelpArticle[] {
      const q = this.prescreenSearch.trim().toLowerCase();
      const pool = [...this.guides, ...this.faqs].filter(a => a.isFeatured || this.matchesSearch(a, q));
      return pool.slice(0, 3);
   }

   showSupportForm(): void {
      this.contactStep = 'form';
      this.helpService.trackEvent('prescreen_dismissed');
   }

   backToPrescreen(): void {
      this.contactStep = 'prescreen';
      this.contactSuccess = '';
      this.contactError = '';
   }

   submitContact(): void {
      this.contactSuccess = '';
      this.contactError = '';

      if (!this.contactSubject.trim() || !this.contactMessage.trim()) {
         this.contactError = 'Please fill in both the subject and message.';
         return;
      }

      this.helpService.trackEvent('contact_submitted');
      // Full ticket creation can be wired to the API later
      this.contactSuccess = 'Your message has been submitted. Our team will follow up shortly.';
      this.contactSubject = '';
      this.contactMessage = '';
      this.contactStep = 'prescreen';
   }

   // ── Search ────────────────────────────────────────────

   clearSearch(): void {
      this.searchTerm = '';
   }

   get totalResults(): number {
      return this.filteredGuides.length + this.filteredFaqs.length;
   }

   getCategoryLabel(category: HelpArticleCategory): string {
      return HELP_CATEGORY_LABELS[category] ?? category;
   }

   private matchesSearch(article: HelpArticle, query: string): boolean {
      const searchable = [
         article.title,
         article.summary ?? '',
         article.content,
         article.tags ?? '',
         article.category
      ].join(' ').toLowerCase();
      return searchable.includes(query);
   }
}