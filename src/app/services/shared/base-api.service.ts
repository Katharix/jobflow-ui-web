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

   private getHeaders(includeAuth = true, extra?: HttpHeaders): HttpHeaders {
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

   get<T>(endpoint: string, params?: QueryParams, includeAuth = true): Observable<T> {
      return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(includeAuth),
         params: this.toHttpParams(params)
      });
   }

   getWithHeaders<T>(endpoint: string, headers?: HttpHeaders, params?: QueryParams): Observable<T> {
      return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(true, headers),
         params: this.toHttpParams(params)
      });
   }

   post<T>(endpoint: string, body: any, includeAuth = true): Observable<T> {
      return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(includeAuth)
      });
   }

   postWithHeaders<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
      return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(true, headers)
      });
   }

   put<T>(endpoint: string, body: any, includeAuth = true): Observable<T> {
      return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(includeAuth)
      });
   }

   putWithHeaders<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
      return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, {
         headers: this.getHeaders(true, headers)
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

   getBlobWithHeaders(endpoint: string, headers?: HttpHeaders): Observable<Blob> {
      return this.http.get(`${this.baseUrl}/${endpoint}`, {
         headers: this.getHeaders(true, headers),
         responseType: 'blob'
      });
   }
}
