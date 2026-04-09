import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { FileUploadService } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let http: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);
    TestBed.configureTestingModule({
      providers: [
        FileUploadService,
        { provide: HttpClient, useValue: http }
      ]
    });
    service = TestBed.inject(FileUploadService);
  });

  it('uploads image and returns secure url', () => {
    const fakeUrl = 'https://res.cloudinary.com/katharix/image/upload/logo.png';
    http.post.and.returnValue(of({ secure_url: fakeUrl }));

    const file = new File(['dummy'], 'logo.png', { type: 'image/png' });
    service.uploadImage(file, 'preset_name', 'folder/path').subscribe(url => {
      expect(url).toBe(fakeUrl);
    });

    expect(http.post).toHaveBeenCalled();
    const [apiUrl, formData] = http.post.calls.mostRecent().args;
    expect(apiUrl).toContain('cloudinary.com');
    expect(formData instanceof FormData).toBeTrue();
  });
});
