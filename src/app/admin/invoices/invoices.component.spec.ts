import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EstimateService } from '../estimates/services/estimate.service';
import { Estimate } from '../estimates/models/estimate';
import { ToastService } from '../../common/toast/toast.service';
import { Job } from '../jobs/models/job';
import { JobsService } from '../jobs/services/jobs.service';
import { InvoiceService } from './services/invoice.service';
import { InvoicesComponent } from './invoices.component';

describe('InvoicesComponent', () => {
  let invoiceServiceSpy: jasmine.SpyObj<InvoiceService>;
  let jobsServiceSpy: jasmine.SpyObj<JobsService>;
  let estimateServiceSpy: jasmine.SpyObj<EstimateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const oldJob: Job = {
    id: 'job-1',
    title: 'Old Job',
    scheduledStart: new Date('2026-02-01T10:00:00.000Z'),
    scheduledEnd: new Date('2026-02-01T12:00:00.000Z'),
    organizationClient: {
      id: 'client-1',
      organizationId: 'org-1',
      organization: {} as any,
      firstName: 'Ava',
      lastName: 'Old'
    },
    lifecycleStatus: 1,
    hasAssignments: false
  };

  const recentJob: Job = {
    id: 'job-2',
    title: 'Recent Job',
    scheduledStart: new Date('2026-03-12T09:00:00.000Z'),
    scheduledEnd: new Date('2026-03-12T11:00:00.000Z'),
    organizationClient: {
      id: 'client-2',
      organizationId: 'org-1',
      organization: {} as any,
      firstName: 'Ben',
      lastName: 'Recent'
    },
    lifecycleStatus: 2,
    hasAssignments: true
  };

  beforeEach(() => {
    invoiceServiceSpy = jasmine.createSpyObj<InvoiceService>('InvoiceService', [
      'getByOrganization',
      'upsertForOrganization'
    ]);
    jobsServiceSpy = jasmine.createSpyObj<JobsService>('JobsService', ['getAllJobs']);
    estimateServiceSpy = jasmine.createSpyObj<EstimateService>('EstimateService', ['getByOrganization']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    toastSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

    invoiceServiceSpy.getByOrganization.and.returnValue(of([]));
    invoiceServiceSpy.upsertForOrganization.and.returnValue(of({ id: 'inv-1' } as any));
    jobsServiceSpy.getAllJobs.and.returnValue(of([oldJob, recentJob]));
    estimateServiceSpy.getByOrganization.and.returnValue(of([]));
  });

  function createComponent(queryParams: Record<string, string> = {}): InvoicesComponent {
    const route = {
      snapshot: {
        queryParamMap: {
          get: (key: string) => queryParams[key] ?? null
        }
      }
    } as ActivatedRoute;

    return new InvoicesComponent(
      new FormBuilder(),
      invoiceServiceSpy,
      jobsServiceSpy,
      estimateServiceSpy,
      routerSpy,
      route,
      toastSpy
    );
  }

  it('opens the create-invoice drawer automatically for onboarding action', () => {
    const component = createComponent({ onboardingAction: 'select-job-for-invoice' });

    component.ngOnInit();

    expect(component.isCreateDrawerOpen).toBeTrue();
  });

  it('sorts jobs with most recent first for picker', () => {
    const component = createComponent();

    component.ngOnInit();

    expect(component.recentJobs.length).toBe(2);
    expect(component.recentJobs[0].id).toBe('job-2');
    expect(component.recentJobs[1].id).toBe('job-1');
  });

  it('prefills invoice line items from an existing estimate tied to the selected job', () => {
    const estimate = {
      id: 'est-1',
      estimateNumber: 'EST-1001',
      organizationId: 'org-1',
      organizationClientId: 'client-2',
      total: 450,
      status: 0,
      lineItems: [
        {
          id: 'line-1',
          estimateId: 'est-1',
          description: 'Pressure washing',
          quantity: 3,
          unitPrice: 150,
          lineTotal: 450
        }
      ],
      jobId: 'job-2'
    } as Estimate & { jobId: string };

    estimateServiceSpy.getByOrganization.and.returnValue(of([estimate]));

    const component = createComponent();
    component.ngOnInit();

    component.selectJobForInvoice(recentJob);

    expect(component.prefillEstimate?.id).toBe('est-1');
    expect(component.invoiceLineItems.length).toBe(1);
    expect(component.invoiceLineItems.at(0).get('description')?.value).toBe('Pressure washing');
    expect(component.invoiceLineItems.at(0).get('quantity')?.value).toBe(3);
    expect(component.invoiceLineItems.at(0).get('unitPrice')?.value).toBe(150);
  });

  it('creates invoice successfully and shows confirmation toast', () => {
    const component = createComponent();
    component.ngOnInit();

    component.openCreateInvoiceDrawer();
    component.selectJobForInvoice(recentJob);

    component.invoiceLineItems.at(0).patchValue({
      description: 'Labor',
      quantity: 2,
      unitPrice: 125
    });

    component.createInvoice();

    expect(invoiceServiceSpy.upsertForOrganization).toHaveBeenCalledWith(jasmine.objectContaining({
      jobId: 'job-2',
      lineItems: [
        {
          description: 'Labor',
          quantity: 2,
          unitPrice: 125
        }
      ]
    }));
    expect(toastSpy.success).toHaveBeenCalledWith('Invoice created successfully.');
  });

  it('shows error toast and keeps drawer open when invoice creation fails', () => {
    invoiceServiceSpy.upsertForOrganization.and.returnValue(throwError(() => new Error('save failed')));

    const component = createComponent();
    component.ngOnInit();

    component.openCreateInvoiceDrawer();
    component.selectJobForInvoice(recentJob);

    component.invoiceLineItems.at(0).patchValue({
      description: 'Materials',
      quantity: 1,
      unitPrice: 99
    });

    component.createInvoice();

    expect(toastSpy.error).toHaveBeenCalledWith('Failed to create invoice.');
    expect(component.createInvoiceError).toBeTruthy();
    expect(component.isCreateDrawerOpen).toBeTrue();
  });
});
