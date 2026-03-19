import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CustomersService } from './customer.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('CustomersService', () => {
   let service: CustomersService;
   let api: jasmine.SpyObj<BaseApiService>;

   beforeEach(() => {
      api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'delete']);
      TestBed.configureTestingModule({
         providers: [
            CustomersService,
            { provide: BaseApiService, useValue: api }
         ]
      });
      service = TestBed.inject(CustomersService);
   });

   it('posts customer payload to upsert endpoint', () => {
      const payload = {
         firstName: 'Jane',
         lastName: 'Doe',
         emailAddress: 'jane@company.com',
         phoneNumber: '5551234567'
      };
      api.post.and.returnValue(of({ id: 'client-1' }));

      service.createCustomer(payload).subscribe();

      expect(api.post).toHaveBeenCalledWith('organization/clients/upsert', payload);
   });

   it('gets customers by organization from orgall endpoint', () => {
      api.get.and.returnValue(of([]));

      service.getAllByOrganization().subscribe();

      expect(api.get).toHaveBeenCalledWith('organization/clients/orgall');
   });

   it('deletes customer by client id', () => {
      api.delete.and.returnValue(of(void 0));

      service.deleteClient('client-1').subscribe();

      expect(api.delete).toHaveBeenCalledWith('organization/clients/delete?clientId=client-1');
   });
});