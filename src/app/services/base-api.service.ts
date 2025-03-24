import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment'; // adjust path as needed
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private getHeaders(includeAuth = true): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
    if (includeAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
  
    return headers;
  }
  

  get<T>(endpoint: string, params?: HttpParams, includeAuth = true): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders(includeAuth),
      params
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
}
