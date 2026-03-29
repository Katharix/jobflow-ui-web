import { InvoicingWorkflow } from '../../jobs/models/job';

export interface InvoicingSettingsDto {
  defaultWorkflow: InvoicingWorkflow;
}

export type InvoicingSettingsUpsertRequestDto = InvoicingSettingsDto;