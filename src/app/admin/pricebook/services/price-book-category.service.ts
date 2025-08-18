import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';

export interface PriceBookCategoryDto {
  id: string;
  organizationId: string; // Guid-as-string
  name: string;
  description?: string | null;
  createdAt: string; // ISO
  items?: any[]; // narrow if you want
}

export type CreatePriceBookCategoryRequest = {
  name: string;
  description?: string | null;
};

export type UpdatePriceBookCategoryRequest = {
  name: string;
  description?: string | null;
};

@Injectable({ providedIn: 'root' })
export class PriceBookCategoryService {
  constructor(private api: BaseApiService) {}

  private base(orgId: string) {
    return `organizations/${orgId}/pricebook/categories/`;
  }

  /** GET: list all categories for an org */
  getAll(orgId: string): Observable<PriceBookCategoryDto[]> {
    return this.api.get<PriceBookCategoryDto[]>(this.base(orgId));
  }

  /** GET: single category */
  getById(orgId: string, id: string): Observable<PriceBookCategoryDto> {
    return this.api.get<PriceBookCategoryDto>(`${this.base(orgId)}${id}`);
  }

  /** POST: create category */
  create(orgId: string, body: CreatePriceBookCategoryRequest): Observable<PriceBookCategoryDto> {
    return this.api.post<PriceBookCategoryDto>(this.base(orgId), body);
  }

  /** PUT: update category */
  update(orgId: string, id: string, body: UpdatePriceBookCategoryRequest): Observable<PriceBookCategoryDto> {
    return this.api.put<PriceBookCategoryDto>(`${this.base(orgId)}${id}`, body);
  }

  /** DELETE: delete category */
  delete(orgId: string, id: string): Observable<void> {
    return this.api.delete<void>(`${this.base(orgId)}${id}`);
  }
}
