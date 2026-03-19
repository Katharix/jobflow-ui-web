import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PriceBookCategoryService } from './price-book-category.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('PriceBookCategoryService', () => {
  let service: PriceBookCategoryService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [
        PriceBookCategoryService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(PriceBookCategoryService);
  });

  it('loads categories', () => {
    api.get.and.returnValue(of([]));
    service.getAll().subscribe();
    expect(api.get).toHaveBeenCalledWith('pricebook/categories/');
  });

  it('updates category', () => {
    api.put.and.returnValue(of({} as any));
    service.update('cat-1', { name: 'Updated' }).subscribe();
    expect(api.put).toHaveBeenCalledWith('pricebook/categories/cat-1', { name: 'Updated' });
  });
});
