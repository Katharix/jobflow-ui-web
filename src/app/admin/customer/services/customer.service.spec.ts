import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CustomersService } from './customer.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { HttpClient } from '@angular/common/http';

describe('CustomersService', () => {
   let service: CustomersService;
   let api: jasmine.SpyObj<BaseApiService>;
   let http: jasmine.SpyObj<HttpClient>;

   beforeEach(() => {
      api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'delete']);
      http = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);
      TestBed.configureTestingModule({
         providers: [
            CustomersService,
            { provide: BaseApiService, useValue: api },
            { provide: HttpClient, useValue: http }
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

      expect(api.get).toHaveBeenCalledWith('organization/clients/orgall', undefined, undefined);
   });

   it('deletes customer by client id', () => {
      api.delete.and.returnValue(of(void 0));

      service.deleteClient('client-1').subscribe();

      expect(api.delete).toHaveBeenCalledWith('organization/clients/delete?clientId=client-1');
   });

   it('bulk creates customers via upsert/multi endpoint', () => {
      const payloads = [
         { firstName: 'Alice', lastName: 'Smith' },
         { firstName: 'Bob', lastName: 'Jones' }
      ];
      api.post.and.returnValue(of([]));

      service.bulkCreateCustomers(payloads).subscribe();

      expect(api.post).toHaveBeenCalledWith('organization/clients/upsert/multi', payloads);
   });

   it('loads paged customers with default page size', () => {
      api.get.and.returnValue(of({ items: [], nextCursor: null }));

      service.getAllByOrganizationPaged().subscribe();

      const args = api.get.calls.mostRecent().args;
      expect(args[0]).toBe('organization/clients/orgall');
      expect(args[1]).toEqual(jasmine.objectContaining({ pageSize: '50' }));
   });

   it('passes optional paged query params when provided', () => {
      api.get.and.returnValue(of({ items: [] }));

      service.getAllByOrganizationPaged({
         cursor: 'cur-1',
         pageSize: 20,
         missingEmailOnly: true,
         search: 'jane',
         sortBy: 'lastName',
         sortDirection: 'asc'
      }).subscribe();

      const params = api.get.calls.mostRecent().args[1];
      expect(params).toEqual(jasmine.objectContaining({
         cursor: 'cur-1',
         pageSize: '20',
         missingEmailOnly: 'true',
         search: 'jane',
         sortBy: 'lastName',
         sortDirection: 'asc'
      }));
   });

   it('sends a client hub link to the specified client', () => {
      api.post.and.returnValue(of({}));
      const request = { recipientEmail: 'client@test.com', message: 'Click here' };

      service.sendClientHubLink('client-1', request).subscribe();

      expect(api.post).toHaveBeenCalledWith(
         'organization/clients/client-1/send-client-hub-link',
         request
      );
   });

   it('starts a client import via post to import/start', () => {
      api.post.and.returnValue(of({ jobId: 'job-1' }));
      const payload = { uploadToken: 'token-abc', columnMappings: { firstName: 'First Name' } };

      service.startClientImport(payload).subscribe();

      expect(api.post).toHaveBeenCalledWith('organization/clients/import/start', payload);
   });

   it('retrieves client import job status by job id', () => {
      api.get.and.returnValue(of({}));

      service.getClientImportStatus('job-1').subscribe();

      expect(api.get).toHaveBeenCalledWith('organization/clients/import/jobs/job-1');
   });

   it('downloads organization data as json blob', () => {
      api.getBlob = jasmine.createSpy().and.returnValue(of(new Blob()));

      service.downloadOrganizationDataJson().subscribe();

      expect((api as jasmine.SpyObj<typeof api>).getBlob).toHaveBeenCalledWith('data-export/json');
   });

   it('downloads clients as csv blob', () => {
      api.getBlob = jasmine.createSpy().and.returnValue(of(new Blob()));

      service.downloadClientsCsv().subscribe();

      expect((api as jasmine.SpyObj<typeof api>).getBlob).toHaveBeenCalledWith('data-export/clients.csv');
   });

   it('previews a client import file by posting to import/preview with FormData', () => {
      const file = new File(['a,b'], 'clients.csv', { type: 'text/csv' });
      http.post.and.returnValue(of({}));

      service.previewClientImport(file, 'jobber').subscribe();

      const args = http.post.calls.mostRecent().args;
      expect(args[0]).toContain('organization/clients/import/preview');
      expect(args[1] instanceof FormData).toBeTrue();
   });
});