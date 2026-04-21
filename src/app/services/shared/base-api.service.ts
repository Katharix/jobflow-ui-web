import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpContext, HttpHeaders, HttpParams} from '@angular/common/http';
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

   private getHeaders(extra?: HttpHeaders): HttpHeaders {
      let headers = new HttpHeaders({'Content-Type': 'application/json'});

      if (extra) {
         extra.keys().forEach(key => {
            const value = extra.get(key);
            if (value !== null) {
               headers = headers.set(key, value);
            }
         });
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

   get<T>(endpoint: string, params?: QueryParams, context?: HttpContext): Observable<T> {
      return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(),
         params: this.toHttpParams(params),
         context
      });
   }

   getWithHeaders<T>(endpoint: string, headers?: HttpHeaders, params?: QueryParams): Observable<T> {
      return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(headers),
         params: this.toHttpParams(params)
      });
   }

   post<T>(endpoint: string, body: unknown): Observable<T> {
      return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders()
      });
   }

   postWithHeaders<T>(endpoint: string, body: unknown, headers?: HttpHeaders): Observable<T> {
      return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(headers)
      });
   }

   put<T>(endpoint: string, body: unknown): Observable<T> {
      return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders()
      });
   }

   putWithHeaders<T>(endpoint: string, body: unknown, headers?: HttpHeaders): Observable<T> {
      return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(headers)
      });
   }

   delete<T>(endpoint: string): Observable<T> {
      return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders()
      });
   }

   getBlob(endpoint: string): Observable<Blob> {
      return this.http.get(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(),
         responseType: 'blob'
      });
   }

   getBlobWithHeaders(endpoint: string, headers?: HttpHeaders): Observable<Blob> {
      return this.http.get(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(headers),
         responseType: 'blob'
      });
   }

   postFormWithHeaders<T>(endpoint: string, formData: FormData, headers?: HttpHeaders): Observable<T> {
      let formHeaders = new HttpHeaders();
      if (headers) {
         headers.keys().forEach(key => {
            const value = headers.get(key);
            if (value !== null) {
               formHeaders = formHeaders.set(key, value);
            }
         });
      }
      // Do not set Content-Type — browser sets multipart boundary automatically
      return this.http.post<T>(`${this.baseUrl}/${endpoint}`, formData, {
         headers: formHeaders
      });
   }
}
