import { EstimateService } from './estimate.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { of } from 'rxjs';

describe('EstimateService', () => {
  let service: EstimateService;
  let apiSpy: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);
    service = new EstimateService(apiSpy);
  });

  it('should call GET estimates/:id for getById', () => {
    apiSpy.get.and.returnValue(of({} as any));
    service.getById('est-123').subscribe();
    expect(apiSpy.get).toHaveBeenCalledWith('estimates/est-123');
  });

  it('should call GET estimates/organization for getByOrganization', () => {
    apiSpy.get.and.returnValue(of([] as any));
    service.getByOrganization().subscribe();
    expect(apiSpy.get).toHaveBeenCalledWith('estimates/organization');
  });

  it('should call POST estimates for create', () => {
    apiSpy.post.and.returnValue(of({} as any));
    const req = { organizationClientId: 'c-1', lineItems: [] };
    service.create(req).subscribe();
    expect(apiSpy.post).toHaveBeenCalledWith('estimates', req);
  });

  it('should call PUT estimates/:id for update', () => {
    apiSpy.put.and.returnValue(of({} as any));
    const req = { lineItems: [] };
    service.update('est-789', req).subscribe();
    expect(apiSpy.put).toHaveBeenCalledWith('estimates/est-789', req);
  });

  it('should call DELETE estimates/:id for delete', () => {
    apiSpy.delete.and.returnValue(of(undefined as any));
    service.delete('est-789').subscribe();
    expect(apiSpy.delete).toHaveBeenCalledWith('estimates/est-789');
  });

  it('should call POST estimates/:id/send for send', () => {
    apiSpy.post.and.returnValue(of({} as any));
    const req = { recipientEmail: 'client@example.com', message: 'Here is your estimate.' };
    service.send('est-789', req).subscribe();
    expect(apiSpy.post).toHaveBeenCalledWith('estimates/est-789/send', req);
  });

  it('should call GET estimates/public/:token without auth for getPublic', () => {
    apiSpy.get.and.returnValue(of({} as any));
    service.getPublic('pub-token-abc').subscribe();
    expect(apiSpy.get).toHaveBeenCalledWith('estimates/public/pub-token-abc', undefined, false);
  });

  it('should call getBlob estimates/public/:token/pdf without auth for getPublicPdf', () => {
    apiSpy.getBlob.and.returnValue(of(new Blob()));
    service.getPublicPdf('pub-token-abc').subscribe();
    expect(apiSpy.getBlob).toHaveBeenCalledWith('estimates/public/pub-token-abc/pdf', false);
  });
});
