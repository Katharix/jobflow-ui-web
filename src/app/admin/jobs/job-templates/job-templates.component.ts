import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastService } from '../../../common/toast/toast.service';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { JobflowDrawerComponent } from '../../../common/jobflow-drawer/jobflow-drawer.component';
import { JobTemplateService } from '../services/job-template.service';
import { JobTemplate, JobTemplateItem } from '../models/job-template';
import { InvoicingWorkflow, InvoicingWorkflowLabels } from '../models/job';
import { Subscription } from 'rxjs';

@Component({
   selector: 'app-job-templates',
   standalone: true,
   templateUrl: './job-templates.component.html',
   styleUrls: ['./job-templates.component.scss'],
   imports: [ReactiveFormsModule, FormsModule, InputTextModule, SelectModule, JobflowDrawerComponent]
})
export class JobTemplatesComponent implements OnInit, OnDestroy {
   private templateService = inject(JobTemplateService);
   private toast = inject(ToastService);
   private organizationContext = inject(OrganizationContextService);
   private formBuilder = inject(FormBuilder);
   private orgSub?: Subscription;

   templates: JobTemplate[] = [];
   organizationId = '';
   loading = false;
   canManageTemplates = false;

   showDrawer = false;
   editingTemplateId: string | null = null;

   templateForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: [''],
      defaultInvoicingWorkflow: [null as number | null],
      items: this.formBuilder.array([])
   });

   invoicingOptions = [
      { label: 'Use org default', value: null },
      { label: InvoicingWorkflowLabels[InvoicingWorkflow.SendInvoice], value: InvoicingWorkflow.SendInvoice },
      { label: InvoicingWorkflowLabels[InvoicingWorkflow.InPerson], value: InvoicingWorkflow.InPerson }
   ];

   ngOnInit(): void {
      this.orgSub = this.organizationContext.org$.subscribe(org => {
         if (!org) return;

         const previousOrganizationId = this.organizationId;
         this.organizationId = org.id ?? '';
         const plan = (org.subscriptionPlanName ?? '').toLowerCase();
         this.canManageTemplates = plan === 'go' || plan === 'flow' || plan === 'max';

         if (this.organizationId && this.organizationId !== previousOrganizationId) {
            this.loadTemplates();
         }
      });
   }

   ngOnDestroy(): void {
      this.orgSub?.unsubscribe();
   }

   loadTemplates(): void {
      this.loading = true;
      this.templateService.getByOrganization().subscribe({
         next: (data) => {
            this.templates = data;
            this.loading = false;
         },
         error: () => {
            this.toast.error('Failed to load job templates');
            this.loading = false;
         }
      });
   }

   get systemTemplates(): JobTemplate[] {
      return this.templates.filter(t => t.isSystem);
   }

   get customTemplates(): JobTemplate[] {
      return this.templates.filter(t => !t.isSystem);
   }

   onAddClick(): void {
      if (!this.canManageTemplates) {
         this.toast.warning('A Go subscription or higher is required to create templates.');
         return;
      }

      this.editingTemplateId = null;
      this.resetForm();
      this.showDrawer = true;
   }

   editTemplate(template: JobTemplate): void {
      if (template.isSystem) return;
      if (!this.canManageTemplates) {
         this.toast.warning('A Go subscription or higher is required.');
         return;
      }

      this.editingTemplateId = template.id ?? null;
      this.resetForm(template);
      this.showDrawer = true;
   }

   deleteTemplate(template: JobTemplate): void {
      if (!template.id || template.isSystem) return;
      if (!confirm(`Delete template "${template.name}"?`)) return;

      this.templateService.delete(template.id).subscribe({
         next: () => {
            this.toast.success('Template deleted');
            this.loadTemplates();
         },
         error: () => this.toast.error('Failed to delete template')
      });
   }

   saveTemplate(): void {
      if (!this.canManageTemplates) {
         this.toast.warning('A Go subscription or higher is required.');
         return;
      }

      if (this.templateForm.invalid) {
         this.templateForm.markAllAsTouched();
         return;
      }

      const payload: JobTemplate = {
         name: this.templateForm.value.name ?? '',
         description: (this.templateForm.value.description ?? '').trim() || undefined,
         defaultInvoicingWorkflow: this.templateForm.value.defaultInvoicingWorkflow ?? undefined,
         isSystem: false,
         items: this.templateItems.controls.map((ctrl, index) => ({
            name: String(ctrl.get('name')?.value ?? '').trim(),
            description: String(ctrl.get('description')?.value ?? '').trim() || undefined,
            sortOrder: index + 1
         }))
      };

      if (this.editingTemplateId) {
         this.templateService.update(this.editingTemplateId, payload).subscribe({
            next: () => {
               this.toast.success('Template updated');
               this.loadTemplates();
               this.closeDrawer();
            },
            error: () => this.toast.error('Failed to update template')
         });
         return;
      }

      this.templateService.create(payload).subscribe({
         next: () => {
            this.toast.success('Template created');
            this.loadTemplates();
            this.closeDrawer();
         },
         error: () => this.toast.error('Failed to create template')
      });
   }

   closeDrawer(): void {
      this.showDrawer = false;
      this.editingTemplateId = null;
      this.resetForm();
   }

   get templateItems(): FormArray {
      return this.templateForm.get('items') as FormArray;
   }

   addItem(item?: Partial<JobTemplateItem>): void {
      this.templateItems.push(this.formBuilder.group({
         name: [item?.name ?? '', Validators.required],
         description: [item?.description ?? '']
      }));
   }

   removeItem(index: number): void {
      if (this.templateItems.length <= 1) return;
      this.templateItems.removeAt(index);
   }

   private resetForm(template?: JobTemplate): void {
      this.templateForm.reset({
         name: template?.name ?? '',
         description: template?.description ?? '',
         defaultInvoicingWorkflow: template?.defaultInvoicingWorkflow ?? null
      });

      this.templateItems.clear();
      const items = template?.items?.length ? template.items : [{ name: '', description: '' }];
      items.forEach(item => this.addItem(item));
   }
}
