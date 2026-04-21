import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HelpContentService } from './help-content.service';
import { BaseApiService } from './base-api.service';

describe('HelpContentService', () => {
  let service: HelpContentService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [
        HelpContentService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(HelpContentService);
  });

  it('fetches published articles from articles/published endpoint', () => {
    api.get.and.returnValue(of([]));

    service.getPublishedArticles().subscribe();

    expect(api.get).toHaveBeenCalledWith('help-content/articles/published');
  });

  it('fetches published changelog from changelog/published endpoint', () => {
    api.get.and.returnValue(of([]));

    service.getPublishedChangelog().subscribe();

    expect(api.get).toHaveBeenCalledWith('help-content/changelog/published');
  });

  it('fetches all articles from articles endpoint', () => {
    api.get.and.returnValue(of([]));

    service.getAllArticles().subscribe();

    expect(api.get).toHaveBeenCalledWith('help-content/articles');
  });

  it('fetches a single article by id', () => {
    api.get.and.returnValue(of({}));

    service.getArticle('article-1').subscribe();

    expect(api.get).toHaveBeenCalledWith('help-content/articles/article-1');
  });

  it('creates an article via post to articles endpoint', () => {
    const request = { title: 'How to start', content: 'Details here', articleType: 'Guide' as const, category: 'GettingStarted' as const, isFeatured: false, isPublished: false, sortOrder: 0 };
    api.post.and.returnValue(of({}));

    service.createArticle(request).subscribe();

    expect(api.post).toHaveBeenCalledWith('help-content/articles', request);
  });

  it('updates an article via put to articles endpoint', () => {
    const request = { id: 'article-1', title: 'Updated title', content: 'New content', articleType: 'Guide' as const, category: 'GettingStarted' as const, isFeatured: false, isPublished: true, sortOrder: 1 };
    api.put.and.returnValue(of({}));

    service.updateArticle(request).subscribe();

    expect(api.put).toHaveBeenCalledWith('help-content/articles', request);
  });

  it('deletes an article by id', () => {
    api.delete.and.returnValue(of(void 0));

    service.deleteArticle('article-1').subscribe();

    expect(api.delete).toHaveBeenCalledWith('help-content/articles/article-1');
  });

  it('fetches all changelog entries', () => {
    api.get.and.returnValue(of([]));

    service.getAllChangelog().subscribe();

    expect(api.get).toHaveBeenCalledWith('help-content/changelog');
  });

  it('creates a changelog entry via post to changelog endpoint', () => {
    const request = { title: 'v1.2.0', description: 'New features', category: 'Feature' as const, isPublished: false };
    api.post.and.returnValue(of({}));

    service.createChangelogEntry(request).subscribe();

    expect(api.post).toHaveBeenCalledWith('help-content/changelog', request);
  });

  it('updates a changelog entry via put to changelog endpoint', () => {
    const request = { id: 'entry-1', title: 'v1.2.1', description: 'Bugfixes', category: 'Fix' as const, isPublished: true };
    api.put.and.returnValue(of({}));

    service.updateChangelogEntry(request).subscribe();

    expect(api.put).toHaveBeenCalledWith('help-content/changelog', request);
  });

  it('deletes a changelog entry by id', () => {
    api.delete.and.returnValue(of(void 0));

    service.deleteChangelogEntry('entry-1').subscribe();

    expect(api.delete).toHaveBeenCalledWith('help-content/changelog/entry-1');
  });
});
