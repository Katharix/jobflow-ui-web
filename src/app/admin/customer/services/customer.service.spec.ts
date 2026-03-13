import {of} from 'rxjs';
import {CustomersService} from './customer.service';
import {BaseApiService} from '../../../services/base-api.service';

describe('CustomersService', () => {
   let service: CustomersService;
   let apiSpy: jasmine.SpyObj<BaseApiService>;

   beforeEach(() => {
      apiSpy = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post']);
      service = new CustomersService(apiSpy);
   });

   it('posts customer payload to upsert endpoint', () => {
      const payload = {
         firstName: 'Jane',
         lastName: 'Doe',
         emailAddress: 'jane@company.com',
         phoneNumber: '5551234567'
      };
      apiSpy.post.and.returnValue(of({id: 'client-1'}));

      service.createCustomer(payload).subscribe();

      expect(apiSpy.post).toHaveBeenCalledWith('organization/clients/upsert', payload);
   });

   it('gets customers by organization from orgall endpoint', () => {
      apiSpy.get.and.returnValue(of([]));

      service.getAllByOrganization().subscribe();

      expect(apiSpy.get).toHaveBeenCalledWith('organization/clients/orgall');
   });
});