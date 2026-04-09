import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EmployeeService } from './employee.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { HttpClient } from '@angular/common/http';

describe('EmployeeService', () => {
   let service: EmployeeService;
   let api: jasmine.SpyObj<BaseApiService>;
   let http: jasmine.SpyObj<HttpClient>;

   beforeEach(() => {
      api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete']);
      http = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);
      TestBed.configureTestingModule({
         providers: [
            EmployeeService,
            { provide: BaseApiService, useValue: api },
            { provide: HttpClient, useValue: http }
         ]
      });
      service = TestBed.inject(EmployeeService);
   });

   it('gets employees by organization', () => {
      api.get.and.returnValue(of([]));
      service.getByOrganization().subscribe();
      expect(api.get).toHaveBeenCalledWith('employees/organization');
   });

   it('gets employee by id', () => {
      api.get.and.returnValue(of({}));
      service.getById('emp-1').subscribe();
      expect(api.get).toHaveBeenCalledWith('employees/emp-1');
   });

   it('creates employee', () => {
      const payload = { firstName: 'Jane', lastName: 'Doe' };
      api.post.and.returnValue(of({}));
      service.create(payload).subscribe();
      expect(api.post).toHaveBeenCalledWith('employees', payload);
   });

   it('updates employee', () => {
      const payload = { firstName: 'Jane', lastName: 'Updated' };
      api.put.and.returnValue(of({}));
      service.update('emp-1', payload).subscribe();
      expect(api.put).toHaveBeenCalledWith('employees/emp-1', payload);
   });

   it('deletes employee', () => {
      api.delete.and.returnValue(of(void 0));
      service.delete('emp-1').subscribe();
      expect(api.delete).toHaveBeenCalledWith('employees/emp-1');
   });

   it('checks employee email existence', () => {
      api.get.and.returnValue(of(true));
      service.employeeExistByEmail('test@example.com').subscribe();
      expect(api.get).toHaveBeenCalledWith('employees/email/test@example.com');
   });

   it('posts FormData to preview import endpoint', () => {
      const file = new File(['first,last\nJane,Doe'], 'employees.csv', { type: 'text/csv' });
      const previewResponse = {
         uploadToken: 'abc123',
         sourceSystem: 'csv',
         sourceColumns: ['first', 'last'],
         suggestedMappings: { first: 'FirstName', last: 'LastName' },
         previewRows: [{ first: 'Jane', last: 'Doe' }],
         supportedTargetFields: ['FirstName', 'LastName'],
         totalRows: 1
      };
      http.post.and.returnValue(of(previewResponse));

      service.previewEmployeeImport(file, 'generic').subscribe(result => {
         expect(result.uploadToken).toBe('abc123');
         expect(result.totalRows).toBe(1);
      });

      expect(http.post).toHaveBeenCalled();
      const callArgs = http.post.calls.mostRecent().args;
      expect(callArgs[0]).toContain('employees/import/preview');
      expect(callArgs[1] instanceof FormData).toBeTrue();
   });

   it('starts employee import', () => {
      const payload = {
         uploadToken: 'abc123',
         sourceSystem: 'generic',
         columnMappings: { first: 'FirstName' }
      };
      api.post.and.returnValue(of({ jobId: 'job-1' }));

      service.startEmployeeImport(payload).subscribe(result => {
         expect(result.jobId).toBe('job-1');
      });

      expect(api.post).toHaveBeenCalledWith('employees/import/start', payload);
   });

   it('gets employee import status', () => {
      const status = {
         jobId: 'job-1',
         status: 'completed' as const,
         sourceSystem: 'csv',
         totalRows: 10,
         processedRows: 10,
         succeededRows: 9,
         failedRows: 1,
         errors: []
      };
      api.get.and.returnValue(of(status));

      service.getEmployeeImportStatus('job-1').subscribe(result => {
         expect(result.status).toBe('completed');
         expect(result.succeededRows).toBe(9);
      });

      expect(api.get).toHaveBeenCalledWith('employees/import/jobs/job-1');
   });
});
