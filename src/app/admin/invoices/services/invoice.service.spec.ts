import {of} from 'rxjs';
import {InvoiceService} from './invoice.service';
import {BaseApiService} from '../../../services/shared/base-api.service';

describe('InvoiceService', () => {
   let service: InvoiceService;
   let apiSpy: jasmine.SpyObj<BaseApiService>;

   beforeEach(() => {
      apiSpy = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get']);
      service = new InvoiceService(apiSpy);
   });

   it('calls organization endpoint when loading invoices', () => {
      apiSpy.get.and.returnValue(of([]));

      service.getByOrganization().subscribe();

      expect(apiSpy.get).toHaveBeenCalledWith('invoice/organization');
   });

   it('calls invoice by id endpoint when loading a single invoice', () => {
      apiSpy.get.and.returnValue(of({id: 'inv_1'} as any));

      service.getInvoice('inv_1').subscribe();

      expect(apiSpy.get).toHaveBeenCalledWith('invoice/inv_1');
   });
});
