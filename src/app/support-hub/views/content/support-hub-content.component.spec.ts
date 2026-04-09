import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SupportHubContentComponent } from './support-hub-content.component';
import { HelpContentService } from '../../../services/shared/help-content.service';
import { HelpArticle, ChangelogEntry } from '../../../models/help-content';

describe('SupportHubContentComponent', () => {
  let component: SupportHubContentComponent;
  let fixture: ComponentFixture<SupportHubContentComponent>;
  let helpService: jasmine.SpyObj<HelpContentService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockArticles: HelpArticle[] = [
    { id: 'a1', title: 'Getting Started', summary: 'Intro', content: 'Full guide', articleType: 'Guide', category: 'GettingStarted', tags: null, isFeatured: true, isPublished: true, sortOrder: 1, publishedAt: '2025-01-01', createdAt: '2025-01-01' },
    { id: 'a2', title: 'FAQ', summary: null, content: 'Answer', articleType: 'Faq', category: 'Jobs', tags: 'faq', isFeatured: false, isPublished: false, sortOrder: 2, publishedAt: null, createdAt: '2025-01-02' },
  ];

  const mockChangelog: ChangelogEntry[] = [
    { id: 'c1', title: 'v1.0 Release', description: 'Initial', version: '1.0', category: 'Feature', isPublished: true, publishedAt: '2025-01-01', createdAt: '2025-01-01' },
  ];

  beforeEach(async () => {
    helpService = jasmine.createSpyObj('HelpContentService', [
      'getAllArticles', 'createArticle', 'updateArticle', 'deleteArticle',
      'getAllChangelog', 'createChangelogEntry', 'updateChangelogEntry', 'deleteChangelogEntry',
    ]);
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    helpService.getAllArticles.and.returnValue(of(mockArticles));
    helpService.getAllChangelog.and.returnValue(of(mockChangelog));

    await TestBed.configureTestingModule({
      imports: [SupportHubContentComponent],
      providers: [
        { provide: HelpContentService, useValue: helpService },
        { provide: ChangeDetectorRef, useValue: cdr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubContentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads articles on init', () => {
    fixture.detectChanges();

    expect(helpService.getAllArticles).toHaveBeenCalled();
    expect(component.articles.length).toBe(2);
    expect(component.articlesLoading).toBe(false);
  });

  it('loads changelog on init', () => {
    fixture.detectChanges();

    expect(helpService.getAllChangelog).toHaveBeenCalled();
    expect(component.changelog.length).toBe(1);
    expect(component.changelogLoading).toBe(false);
  });

  it('handles article load error', () => {
    helpService.getAllArticles.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.articleError).toBe('Failed to load articles.');
    expect(component.articlesLoading).toBe(false);
  });

  it('handles changelog load error', () => {
    helpService.getAllChangelog.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.changelogError).toBe('Failed to load changelog.');
    expect(component.changelogLoading).toBe(false);
  });

  it('openCreateArticle resets editor state', () => {
    component.openCreateArticle();

    expect(component.articleEditorMode).toBe('create');
    expect(component.showArticleEditor).toBe(true);
    expect(component.editingArticle).toBeNull();
  });

  it('openEditArticle populates editor with article data', () => {
    component.openEditArticle(mockArticles[0]);

    expect(component.articleEditorMode).toBe('edit');
    expect(component.editingArticle).toBeTruthy();
    expect(component.editingArticle!.id).toBe('a1');
    expect(component.editingArticle!.title).toBe('Getting Started');
    expect(component.showArticleEditor).toBe(true);
  });

  it('cancelArticleEditor hides editor', () => {
    component.showArticleEditor = true;
    component.cancelArticleEditor();

    expect(component.showArticleEditor).toBe(false);
    expect(component.editingArticle).toBeNull();
  });

  it('saveArticle in create mode calls createArticle', () => {
    helpService.createArticle.and.returnValue(of(mockArticles[0]));
    fixture.detectChanges();

    component.articleEditorMode = 'create';
    component.saveArticle();

    expect(helpService.createArticle).toHaveBeenCalled();
  });

  it('saveArticle in edit mode calls updateArticle', () => {
    helpService.updateArticle.and.returnValue(of(mockArticles[0]));
    fixture.detectChanges();

    component.articleEditorMode = 'edit';
    component.editingArticle = { id: 'a1', title: 'Updated', summary: null, content: 'Content', articleType: 'Guide', category: 'GettingStarted', tags: null, isFeatured: false, isPublished: true, sortOrder: 1 };
    component.saveArticle();

    expect(helpService.updateArticle).toHaveBeenCalled();
  });

  it('deleteArticle calls service and reloads', () => {
    helpService.deleteArticle.and.returnValue(of(undefined));
    fixture.detectChanges();
    component.deleteArticle(mockArticles[0]);

    expect(helpService.deleteArticle).toHaveBeenCalledWith('a1');
  });

  it('deleteArticle sets error on failure', () => {
    helpService.deleteArticle.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.deleteArticle(mockArticles[0]);

    expect(component.articleError).toBe('Failed to delete article.');
  });

  it('openCreateChangelog resets editor state', () => {
    component.openCreateChangelog();

    expect(component.changelogEditorMode).toBe('create');
    expect(component.showChangelogEditor).toBe(true);
    expect(component.editingChangelog).toBeNull();
  });

  it('openEditChangelog populates editor', () => {
    component.openEditChangelog(mockChangelog[0]);

    expect(component.changelogEditorMode).toBe('edit');
    expect(component.editingChangelog).toBeTruthy();
    expect(component.editingChangelog!.id).toBe('c1');
    expect(component.showChangelogEditor).toBe(true);
  });

  it('getCategoryLabel returns label for known categories', () => {
    expect(component.getCategoryLabel('GettingStarted')).toBe('Getting Started');
    expect(component.getCategoryLabel('Jobs')).toBe('Jobs');
  });

  it('getArticleTypeSeverity returns correct values', () => {
    expect(component.getArticleTypeSeverity('Guide')).toBe('info');
    expect(component.getArticleTypeSeverity('Faq')).toBe('warn');
  });
});
