export type HelpArticleType = 'Guide' | 'Faq';

export type HelpArticleCategory =
  | 'GettingStarted'
  | 'Jobs'
  | 'Invoicing'
  | 'Estimates'
  | 'Clients'
  | 'Employees'
  | 'Dispatch'
  | 'Messaging'
  | 'Billing'
  | 'Branding'
  | 'Subscription'
  | 'Settings';

export type ChangelogCategory = 'Feature' | 'Improvement' | 'Fix';

export interface HelpArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  articleType: HelpArticleType;
  category: HelpArticleCategory;
  tags: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
}

export interface HelpArticleCreateRequest {
  title: string;
  summary?: string | null;
  content: string;
  articleType: HelpArticleType;
  category: HelpArticleCategory;
  tags?: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface HelpArticleUpdateRequest extends HelpArticleCreateRequest {
  id: string;
}

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string | null;
  version: string | null;
  category: ChangelogCategory;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface ChangelogEntryCreateRequest {
  title: string;
  description?: string | null;
  version?: string | null;
  category: ChangelogCategory;
  isPublished: boolean;
}

export interface ChangelogEntryUpdateRequest extends ChangelogEntryCreateRequest {
  id: string;
}

export const HELP_CATEGORY_LABELS: Record<HelpArticleCategory, string> = {
  GettingStarted: 'Getting Started',
  Jobs: 'Jobs',
  Invoicing: 'Invoicing',
  Estimates: 'Estimates',
  Clients: 'Clients',
  Employees: 'Employees',
  Dispatch: 'Dispatch',
  Messaging: 'Messaging',
  Billing: 'Billing',
  Branding: 'Branding',
  Subscription: 'Subscription',
  Settings: 'Settings'
};

export const HELP_CATEGORY_ICONS: Record<HelpArticleCategory, string> = {
  GettingStarted: 'ti ti-rocket',
  Jobs: 'ti ti-briefcase',
  Invoicing: 'ti ti-file-invoice',
  Estimates: 'ti ti-calculator',
  Clients: 'ti ti-users',
  Employees: 'ti ti-user-check',
  Dispatch: 'ti ti-map-pin',
  Messaging: 'ti ti-message-circle',
  Billing: 'ti ti-credit-card',
  Branding: 'ti ti-palette',
  Subscription: 'ti ti-star',
  Settings: 'ti ti-settings'
};
