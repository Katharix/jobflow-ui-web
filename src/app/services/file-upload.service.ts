import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map, tap} from 'rxjs';

@Injectable({
   providedIn: 'root'
})
export class FileUploadService {
   private readonly cloudName = 'katharix';
   private readonly apiUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

   constructor(private http: HttpClient) {
   }

   uploadImage(file: File, preset: string, folder: string): Observable<string> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      formData.append('folder', folder);

      return this.http.post<any>(this.apiUrl, formData).pipe(
         tap(res => res),
         map(res => res.secure_url as string)
      );
   }
}
