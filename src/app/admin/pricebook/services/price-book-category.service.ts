import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApiService} from '../../../services/shared/base-api.service';

export interface PriceBookCategoryDto {
   id: string;
   name: string;
   description?: string | null;
   createdAt: string; // ISO
   itemCount?: number; // narrow if you want
}

export type CreatePriceBookCategoryRequest = {
   name: string;
   description?: string | null;
};

export type UpdatePriceBookCategoryRequest = {
   name: string;
   description?: string | null;
};

@Injectable({providedIn: 'root'})
export class PriceBookCategoryService {
   constructor(private api: BaseApiService) {
   }

   private base() {
      return `pricebook/categories/`;
   }

   /** GET: list all categories for an org */
   getAll(): Observable<PriceBookCategoryDto[]> {
      return this.api.get<PriceBookCategoryDto[]>(this.base());
   }

   /** GET: single category */
   getById(id: string): Observable<PriceBookCategoryDto> {
      return this.api.get<PriceBookCategoryDto>(`${this.base()}${id}`);
   }

   /** POST: create category */
   create(body: CreatePriceBookCategoryRequest): Observable<PriceBookCategoryDto> {
      return this.api.post<PriceBookCategoryDto>(this.base(), body);
   }

   /** PUT: update category */
   update(id: string, body: UpdatePriceBookCategoryRequest): Observable<PriceBookCategoryDto> {
      return this.api.put<PriceBookCategoryDto>(`${this.base()}${id}`, body);
   }

   /** DELETE: delete category */
   delete(id: string): Observable<void> {
      return this.api.delete<void>(`${this.base()}${id}`);
   }
}
