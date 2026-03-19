import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PriceBookItemService } from './price-book-item.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('PriceBookItemService', () => {
  let service: PriceBookItemService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [
        PriceBookItemService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(PriceBookItemService);
  });

  it('loads items by category', () => {
    api.get.and.returnValue(of([]));
    service.getAll('category-1').subscribe();
    expect(api.get).toHaveBeenCalledWith('pricebook/category/category-1');
  });

  it('deletes item', () => {
    api.delete.and.returnValue(of(void 0));
    service.delete('item-1').subscribe();
    expect(api.delete).toHaveBeenCalledWith('pricebook/item-1');
  });
});
