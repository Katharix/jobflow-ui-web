import {Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject} from '@angular/core';
import {FormArray, FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {InputTextModule} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {ToastService} from '../../common/toast/toast.service';
import {EmployeeRole} from './models/employee-role';
import {EmployeeRolePreset, EmployeeRolePresetItem} from './models/employee-role-preset';
import {EmployeeRoleService} from './services/employee-role.service';
import {EmployeeRolePresetService} from './services/employee-role-preset.service';
import {OrganizationService} from '../../services/shared/organization.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {PageHeaderComponent} from "../dashboard/page-header/page-header.component";
import { JobflowDrawerComponent } from '../../common/jobflow-drawer/jobflow-drawer.component';
import {
   JobflowGridColumn,
   JobflowGridComponent,
   JobflowGridPageSettings
} from '../../common/jobflow-grid/jobflow-grid.component';
import { Subscription } from 'rxjs';

@Component({
   selector: 'app-employee-roles',
   standalone: true,
   templateUrl: './employee-roles.component.html',
   styleUrls: ['./employee-roles.component.scss'],
   imports: [ReactiveFormsModule, FormsModule, InputTextModule, JobflowGridComponent, PageHeaderComponent, JobflowDrawerComponent]
})
export class EmployeeRolesComponent implements OnInit, OnDestroy {
   private employeeRoleService = inject(EmployeeRoleService);
   private employeeRolePresetService = inject(EmployeeRolePresetService);
   private toast = inject(ToastService);
   private organizationContext = inject(OrganizationContextService);
   private organizationService = inject(OrganizationService);
   private formBuilder = inject(FormBuilder);
   private route = inject(ActivatedRoute);
   private orgSub?: Subscription;
   private routeSub?: Subscription;
   private onboardingActionHandled = false;

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<unknown>;

   public roles: EmployeeRole[] = [];
   roleUsage: Record<string, number> = {};
   presets: EmployeeRolePreset[] = [];
   industryKey = '';
   isUpdatingIndustry = false;
   canManageRoles = true;
   presetLoading = false;
   filterText = '';
   columns: JobflowGridColumn[] = [];
   pageSettings: JobflowGridPageSettings = {pageSize: 10, pageSizes: [10, 20, 50]};
   public organizationId = '';
   public loading = false;

   showRoleDrawer = false;
   showPresetDrawer = false;
   editingRoleId: string | null = null;
   editingPresetId: string | null = null;

   roleForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: ['']
   });

   presetForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: [''],
      industryKey: [''],
      items: this.formBuilder.array([])
   });

   industryOptions = [
      { key: 'home-services', label: 'Home services' },
      { key: 'creative', label: 'Creative' },
      { key: 'consulting', label: 'Consulting' },
      { key: 'tech-repair', label: 'Tech repair' }
   ];


   public headerActions = [
      {
         key: 'add',
         label: 'Add Role',
         icon: 'plus-circle',
         class: 'btn btn-primary px-4 fw-semibold',
         click: () => this.onAddRoleClick()
      }
   ];

   ngOnInit(): void {
      this.columns = [
         {field: 'name', headerText: 'Role Name', width: 220},
         {field: 'description', headerText: 'Description', width: 320},
         {headerText: 'Employees', width: 120, textAlign: 'Center', valueAccessor: this.usageAccessor},
         {headerText: 'Actions', width: 180, textAlign: 'Right', template: this.actionsTemplate}
      ];

      this.orgSub = this.organizationContext.org$.subscribe(org => {
         if (!org) {
            return;
         }

         const previousOrganizationId = this.organizationId;
         this.organizationId = org.id ?? '';
         this.industryKey = org.industryKey ?? '';
         const plan = (org.subscriptionPlanName ?? '').toLowerCase();
         this.canManageRoles = plan === 'flow' || plan === 'max';

         if (this.organizationId && this.organizationId !== previousOrganizationId) {
            this.loadRoles();
            this.loadPresets();
         }
      });

      this.routeSub = this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-role-modal') return;

         this.onAddRoleClick();
         this.onboardingActionHandled = true;
      });
   }

   ngOnDestroy(): void {
      this.orgSub?.unsubscribe();
      this.routeSub?.unsubscribe();
   }

   onAddRoleClick(): void {
      if (!this.canManageRoles) {
         this.toast.warning('Role management requires Flow or higher.');
         return;
      }
      this.editingRoleId = null;
      this.roleForm.reset({name: '', description: ''});
      this.showRoleDrawer = true;
   }

   onAddPresetClick(): void {
      if (!this.canManageRoles) {
         this.toast.warning('Role management requires Flow or higher.');
         return;
      }

      this.editingPresetId = null;
      this.resetPresetForm();
      this.showPresetDrawer = true;
   }

   loadRoles(): void {
      if (!this.organizationId) return;
      this.loading = true;
      this.employeeRoleService.getByOrganization().subscribe({
         next: (data) => {
            this.roles = data;
            this.loading = false;
            this.loadRoleUsage();
         },
         error: () => {
            this.toast.error('Failed to load employee roles');
            this.loading = false;
         }
      });
   }

   loadPresets(): void {
      this.employeeRolePresetService.getByOrganization().subscribe({
         next: (presets) => {
            this.presets = presets ?? [];
         },
         error: () => {
            this.presets = [];
         }
      });
   }

   loadRoleUsage(): void {
      this.employeeRoleService.getUsageByOrganization().subscribe({
         next: (usage) => {
            this.roleUsage = (usage ?? []).reduce((acc, item) => {
               acc[item.roleId] = item.employeeCount;
               return acc;
            }, {} as Record<string, number>);
         },
         error: () => {
            this.roleUsage = {};
         }
      });
   }

   editRole(role: EmployeeRole): void {
      this.editingRoleId = role.id ?? null;
      this.roleForm.reset({name: role.name ?? '', description: role.description ?? ''});
      this.showRoleDrawer = true;
   }

   closeRoleModal(): void {
      this.showRoleDrawer = false;
      this.editingRoleId = null;
      this.roleForm.reset({name: '', description: ''});
   }

   closePresetDrawer(): void {
      this.showPresetDrawer = false;
      this.editingPresetId = null;
      this.resetPresetForm();
   }

   saveRole(): void {
      if (!this.canManageRoles) {
         this.toast.warning('Role management requires Flow or higher.');
         return;
      }
      if (this.roleForm.invalid) {
         this.roleForm.markAllAsTouched();
         return;
      }

      const payload: EmployeeRole = {
         id: this.editingRoleId ?? undefined,
         name: (this.roleForm.value.name ?? '').toUpperCase(),
         description: (this.roleForm.value.description ?? '').trim() || undefined
      };

      if (this.editingRoleId) {
         this.employeeRoleService.update(this.editingRoleId, payload).subscribe({
            next: () => {
               this.toast.success('Role updated successfully');
               this.loadRoles();
               this.closeRoleModal();
            },
            error: () => this.toast.error('Failed to update role')
         });
         return;
      }

      this.employeeRoleService.create(payload).subscribe({
         next: () => {
            this.toast.success('Role created successfully');
            this.loadRoles();
            this.closeRoleModal();
         },
         error: () => this.toast.error('Failed to create role')
      });
   }

   savePreset(): void {
      if (!this.canManageRoles) {
         this.toast.warning('Role management requires Flow or higher.');
         return;
      }

      if (this.presetForm.invalid) {
         this.presetForm.markAllAsTouched();
         return;
      }

      const payload: EmployeeRolePreset = {
         name: this.presetForm.value.name ?? '',
         description: (this.presetForm.value.description ?? '').trim() || undefined,
         industryKey: (this.presetForm.value.industryKey ?? '').trim() || undefined,
         isSystem: false,
         items: this.presetItems.controls.map((ctrl, index) => ({
            name: String(ctrl.get('name')?.value ?? '').trim(),
            description: String(ctrl.get('description')?.value ?? '').trim() || undefined,
            sortOrder: index + 1
         }))
      };

      if (this.editingPresetId) {
         this.employeeRolePresetService.update(this.editingPresetId, payload).subscribe({
            next: () => {
               this.toast.success('Preset updated successfully');
               this.loadPresets();
               this.closePresetDrawer();
            },
            error: () => this.toast.error('Failed to update preset')
         });
         return;
      }

      this.employeeRolePresetService.create(payload).subscribe({
         next: () => {
            this.toast.success('Preset created successfully');
            this.loadPresets();
            this.closePresetDrawer();
         },
         error: () => this.toast.error('Failed to create preset')
      });
   }

   deleteRole(role: EmployeeRole): void {
      if (!role.id) return;
      if (this.getUsageCount(role.id) > 0) {
         this.toast.warning('This role is assigned to employees. Reassign them before deleting.');
         return;
      }
      if (!confirm(`Delete role "${role.name}"?`)) return;

      this.employeeRoleService.delete(role.id).subscribe({
         next: () => {
            this.toast.success('Role deleted successfully');
            this.loadRoles();
         },
         error: () => this.toast.error('Failed to delete role')
      });
   }

   editPreset(preset: EmployeeRolePreset): void {
      if (!this.canManageRoles) {
         this.toast.warning('Role management requires Flow or higher.');
         return;
      }

      if (preset.isSystem) {
         return;
      }

      this.editingPresetId = preset.id ?? null;
      this.resetPresetForm(preset);
      this.showPresetDrawer = true;
   }

   deletePreset(preset: EmployeeRolePreset): void {
      if (!preset.id || preset.isSystem) return;
      if (!confirm(`Delete preset "${preset.name}"?`)) return;

      this.employeeRolePresetService.delete(preset.id).subscribe({
         next: () => {
            this.toast.success('Preset deleted successfully');
            this.loadPresets();
         },
         error: () => this.toast.error('Failed to delete preset')
      });
   }

   applyPreset(preset: EmployeeRolePreset): void {
      if (!preset.id) return;
      if (!this.canManageRoles) {
         this.toast.warning('Role management requires Flow or higher.');
         return;
      }

      this.presetLoading = true;
      this.employeeRolePresetService.applyPreset(preset.id, true).subscribe({
         next: (result) => {
            this.toast.success(
               `Roles added: ${result.created}, updated: ${result.updated}, skipped: ${result.skipped}.`
            );
            this.loadRoles();
         },
         error: () => this.toast.error('Failed to apply preset'),
         complete: () => {
            this.presetLoading = false;
         }
      });
   }

   get filteredRoles(): EmployeeRole[] {
      const term = this.filterText.trim().toLowerCase();
      if (!term) {
         return this.roles;
      }

      return this.roles.filter(role => {
         const name = role.name?.toLowerCase() ?? '';
         const description = role.description?.toLowerCase() ?? '';
         return name.includes(term) || description.includes(term);
      });
   }

   clearFilter(): void {
      this.filterText = '';
   }

   onIndustryChange(value: string): void {
      if (!this.organizationId) return;
      this.isUpdatingIndustry = true;
      this.organizationService.updateIndustry(value || null).subscribe({
         next: (org) => {
            this.industryKey = org.industryKey ?? '';
            this.organizationContext.setOrganization(org);
            this.isUpdatingIndustry = false;
            this.loadPresets();
         },
         error: () => {
            this.toast.error('Failed to update industry');
            this.isUpdatingIndustry = false;
         }
      });
   }

   getUsageCount(roleId?: string | undefined): number {
      if (!roleId) return 0;
      return this.roleUsage[roleId] ?? 0;
   }

   usageAccessor = (_field: string, data: unknown): string => {
      const role = data as EmployeeRole;
      return `${this.getUsageCount(role.id)}`;
   };

   get presetItems(): FormArray {
      return this.presetForm.get('items') as FormArray;
   }

   addPresetItem(item?: Partial<EmployeeRolePresetItem>): void {
      this.presetItems.push(this.formBuilder.group({
         name: [item?.name ?? '', Validators.required],
         description: [item?.description ?? '']
      }));
   }

   removePresetItem(index: number): void {
      if (this.presetItems.length <= 1) {
         return;
      }
      this.presetItems.removeAt(index);
   }

   private resetPresetForm(preset?: EmployeeRolePreset): void {
      this.presetForm.reset({
         name: preset?.name ?? '',
         description: preset?.description ?? '',
         industryKey: preset?.industryKey ?? this.industryKey ?? ''
      });

      this.presetItems.clear();
      const items = preset?.items?.length ? preset.items : [{ name: '', description: '' }];
      items.forEach(item => this.addPresetItem(item));
   }
}
