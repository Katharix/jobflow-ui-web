import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { InvoicingSettingsDto, InvoicingSettingsUpsertRequestDto } from '../models/invoicing-settings';

@Injectable({ providedIn: 'root' })
export class InvoicingSettingsService {
  constructor(private api: BaseApiService) {}

  getInvoicingSettings() {
    return this.api.get<InvoicingSettingsDto>('invoicing-settings');
  }

  updateInvoicingSettings(dto: InvoicingSettingsUpsertRequestDto) {
    return this.api.put<InvoicingSettingsDto>('invoicing-settings', dto);
  }
}