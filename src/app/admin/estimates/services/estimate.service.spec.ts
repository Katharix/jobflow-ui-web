import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EstimateService } from './estimate.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { Estimate } from '../models/estimate';

describe('EstimateService', () => {
  let service: EstimateService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);
    TestBed.configureTestingModule({
      providers: [
        EstimateService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(EstimateService);
  });

  it('loads public estimate without auth', () => {
    api.get.and.returnValue(of({} as Estimate));
    service.getPublic('token-1').subscribe();
    expect(api.get).toHaveBeenCalledWith('estimates/public/token-1');
  });

  it('loads public pdf without auth', () => {
    api.getBlob.and.returnValue(of(new Blob()));
    service.getPublicPdf('token-1').subscribe();
    expect(api.getBlob).toHaveBeenCalledWith('estimates/public/token-1/pdf');
  });
});