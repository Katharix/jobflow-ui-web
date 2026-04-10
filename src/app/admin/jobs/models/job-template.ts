import { InvoicingWorkflow } from './job';

export interface JobTemplateItem {
  id?: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface JobTemplate {
  id?: string;
  name: string;
  description?: string;
  organizationTypeId?: string | null;
  organizationTypeName?: string | null;
  defaultInvoicingWorkflow?: InvoicingWorkflow | null;
  isSystem: boolean;
  organizationId?: string | null;
  items: JobTemplateItem[];
}
