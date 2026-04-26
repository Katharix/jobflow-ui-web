import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BrandingComponent } from './branding.component';
import { OrganizationBrandingService } from './services/organization-branding.service';
import { FileUploadService } from './services/file-upload.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OrganizationDto } from '../../models/organization';
import { BrandingDto } from '../../models/organization-branding';
import { TranslateService } from '@ngx-translate/core';

describe('BrandingComponent', () => {
  let component: BrandingComponent;
  let brandingService: jasmine.SpyObj<OrganizationBrandingService>;
  let uploadService: jasmine.SpyObj<FileUploadService>;
  let orgSubject: BehaviorSubject<OrganizationDto | null>;
  let translate: jasmine.SpyObj<TranslateService>;

  const mockOrg: OrganizationDto = {
    id: 'org-123',
    organizationName: 'Acme Services',
    email: 'info@acme.com',
    phoneNumber: '555-1234',
    address1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701'
  };

  const mockBranding: BrandingDto = {
    organizationId: 'org-123',
    primaryColor: '#ff5722',
    secondaryColor: '#607d8b',
    businessName: 'Acme Services',
    tagline: 'Quality service',
    footerNote: 'Thanks for your business',
    logoUrl: 'https://example.com/logo.png'
  };

  beforeEach(() => {
    orgSubject = new BehaviorSubject<OrganizationDto | null>(null);
    brandingService = jasmine.createSpyObj<OrganizationBrandingService>('OrganizationBrandingService', [
      'getBranding', 'createOrUpdateBranding'
    ]);
    uploadService = jasmine.createSpyObj<FileUploadService>('FileUploadService', ['uploadImage']);
    translate = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
    translate.instant.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      providers: [
        { provide: OrganizationBrandingService, useValue: brandingService },
        { provide: FileUploadService, useValue: uploadService },
        { provide: OrganizationContextService, useValue: { org$: orgSubject.asObservable() } },
        { provide: TranslateService, useValue: translate },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jasmine.createSpy('detectChanges') } }
      ]
    });

    brandingService.getBranding.and.returnValue(of(mockBranding));
    brandingService.createOrUpdateBranding.and.returnValue(of(mockBranding));

    component = TestBed.runInInjectionContext(() => new BrandingComponent());
    component.ngOnInit();
  });

  it('initializes form with default colors', () => {
    expect(component.brandingForm.value.primaryColor).toBe('#0d6efd');
    expect(component.brandingForm.value.secondaryColor).toBe('#6c757d');
  });

  it('loads branding when organization emits', () => {
    orgSubject.next(mockOrg);

    expect(brandingService.getBranding).toHaveBeenCalledWith('org-123');
    expect(component.brandingForm.value.primaryColor).toBe('#ff5722');
    expect(component.brandingForm.value.secondaryColor).toBe('#607d8b');
    expect(component.brandingForm.value.tagline).toBe('Quality service');
    expect(component.logoPreview).toBe('https://example.com/logo.png');
  });

  it('patches businessName from org when branding has none', () => {
    brandingService.getBranding.and.returnValue(of({
      organizationId: 'org-123',
      primaryColor: '#000'
    }));

    orgSubject.next(mockOrg);

    expect(component.brandingForm.value.businessName).toBe('Acme Services');
  });

  it('updates primary color from picker event', () => {
    component.onPrimaryColorChange({ target: { value: '#e91e63' } } as unknown as Event);
    expect(component.brandingForm.value.primaryColor).toBe('#e91e63');
  });

  it('updates secondary color from picker event', () => {
    component.onSecondaryColorChange({ target: { value: '#9c27b0' } } as unknown as Event);
    expect(component.brandingForm.value.secondaryColor).toBe('#9c27b0');
  });

  it('returns computed primaryColor getter', () => {
    component.brandingForm.patchValue({ primaryColor: '#123456' });
    expect(component.primaryColor).toBe('#123456');
  });

  it('returns computed secondaryColor getter', () => {
    component.brandingForm.patchValue({ secondaryColor: '#abcdef' });
    expect(component.secondaryColor).toBe('#abcdef');
  });

  it('computes orgAddress from organization fields', () => {
    component.organization = mockOrg;
    expect(component.orgAddress).toContain('123 Main St');
    expect(component.orgAddress).toContain('Austin');
    expect(component.orgAddress).toContain('TX');
  });

  it('returns empty orgAddress when organization is missing', () => {
    component.organization = undefined as unknown as OrganizationDto;
    expect(component.orgAddress).toBe('');
  });

  it('removes logo when removeLogo is called', () => {
    component.logoPreview = 'data:image/png;base64,...';
    component.imageUrl = 'https://example.com/logo.png';
    component.uploadedLogo = new File([''], 'logo.png');

    component.removeLogo();

    expect(component.logoPreview).toBeNull();
    expect(component.imageUrl).toBeNull();
    expect(component.uploadedLogo).toBeNull();
  });

  it('saves branding without upload when no file selected', () => {
    orgSubject.next(mockOrg);
    component.imageUrl = 'https://example.com/existing.png';
    component.uploadedLogo = null;

    component.onSave();

    expect(brandingService.createOrUpdateBranding).toHaveBeenCalledWith(
      jasmine.objectContaining({
        organizationId: 'org-123',
        logoUrl: 'https://example.com/existing.png'
      })
    );
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('uploads logo then saves branding when file is selected', () => {
    orgSubject.next(mockOrg);
    component.uploadedLogo = new File(['img'], 'new-logo.png', { type: 'image/png' });
    uploadService.uploadImage.and.returnValue(of('https://cdn.example.com/new-logo.png'));

    component.onSave();

    expect(uploadService.uploadImage).toHaveBeenCalled();
    expect(brandingService.createOrUpdateBranding).toHaveBeenCalledWith(
      jasmine.objectContaining({
        logoUrl: 'https://cdn.example.com/new-logo.png'
      })
    );
  });

  it('sets error status when upload fails', () => {
    orgSubject.next(mockOrg);
    component.uploadedLogo = new File(['img'], 'logo.png', { type: 'image/png' });
    uploadService.uploadImage.and.returnValue(throwError(() => new Error('Upload failed')));

    component.onSave();

    expect(component.saveStatus).toBe('error');
    expect(component.isSaving).toBeFalse();
  });

  it('sets success status after saving', () => {
    orgSubject.next(mockOrg);
    component.uploadedLogo = null;

    component.onSave();

    expect(component.saveStatus).toBe('success');
    expect(component.isSaving).toBeFalse();
  });

  it('does not save when form is invalid or org is missing', () => {
    component.organization = {} as OrganizationDto;
    component.onSave();
    expect(brandingService.createOrUpdateBranding).not.toHaveBeenCalled();
  });

  it('does not save when already saving', () => {
    orgSubject.next(mockOrg);
    component.isSaving = true;
    component.onSave();
    expect(brandingService.createOrUpdateBranding).not.toHaveBeenCalled();
  });

  it('defaults previewTab to invoice', () => {
    expect(component.previewTab).toBe('invoice');
  });
});
