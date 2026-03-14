import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';

type QueryParams =
   | HttpParams
   | Record<string, string | number | boolean | Date | null | undefined>;

@Injectable({
   providedIn: 'root'
})
export class BaseApiService {
   private http = inject(HttpClient);
   private baseUrl = environment.apiUrl;

   private getHeaders(includeAuth = true): HttpHeaders {
      let headers = new HttpHeaders({'Content-Type': 'application/json'});

      if (includeAuth) {
         const token = localStorage.getItem('accessToken');
         if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
         }
      }

      return headers;
   }

   private toHttpParams(params?: QueryParams): HttpParams | undefined {
      if (!params) return undefined;

      if (params instanceof HttpParams) return params;

      let httpParams = new HttpParams();

      for (const [key, raw] of Object.entries(params)) {
         if (raw === null || raw === undefined) continue;

         const value =
            raw instanceof Date ? raw.toISOString() : String(raw);

         httpParams = httpParams.set(key, value);
      }

      return httpParams;
   }

   get<T>(endpoint: string, params?: QueryParams, includeAuth = true): Observable<T> {
      return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(includeAuth),
         params: this.toHttpParams(params)
      });
   }

   post<T>(endpoint: string, body: any, includeAuth = true): Observable<T> {
      return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(includeAuth)
      });
   }

   put<T>(endpoint: string, body: any, includeAuth = true): Observable<T> {
      return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(includeAuth)
      });
   }

   delete<T>(endpoint: string, includeAuth = true): Observable<T> {
      return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(includeAuth)
      });
   }

   getBlob(endpoint: string, includeAuth = true): Observable<Blob> {
      return this.http.get(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(includeAuth),
         responseType: 'blob'
      });
   }
}
