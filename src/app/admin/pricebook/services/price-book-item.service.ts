import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';


export enum PriceBookItemType {
  Material = 1,
  Service = 2,
  Product = 3
}

export interface PriceBookItemDto {
  id?: string;
  organizationId: string;
  name: string;
  description?: string | null;
  partNumber?: string | null;
  unit?: string | null;
  cost: number;
  price: number;
  itemType: PriceBookItemType;
  inventoryUnitsPerSale: number;
  categoryId?: string | null;
  createdAt?: string;
  category?: string;
}

export interface PriceBookCategory {
  id?: string;
  name?: string;
}

export interface CreatePriceBookItemRequest extends Omit<PriceBookItemDto, 'id' | 'createdAt'> { }
export interface UpdatePriceBookItemRequest extends PriceBookItemDto { }

@Injectable({ providedIn: 'root' })
export class PriceBookItemService {
  private baseUrl = 'pricebook'; // matches [Route("api/pricebook")]

  constructor(private api: BaseApiService) { }

  get(id: string): Observable<PriceBookItemDto> {
    return this.api.get<PriceBookItemDto>(`${this.baseUrl}/${id}`);
  }

  getAll(orgId: string, categoryId: string): Observable<PriceBookItemDto[]> {
    return this.api.get<PriceBookItemDto[]>(`pricebook/org/${orgId}/category/${categoryId}`);
  }

  create(body: CreatePriceBookItemRequest): Observable<PriceBookItemDto> {
    return this.api.post<PriceBookItemDto>(`${this.baseUrl}`, body);
  }

  update(body: UpdatePriceBookItemRequest): Observable<PriceBookItemDto> {
    return this.api.put<PriceBookItemDto>(`${this.baseUrl}`, body);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
