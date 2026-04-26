import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import {filter, distinctUntilChanged} from 'rxjs/operators';
import {Subscription} from 'rxjs';

import {LucideAngularModule} from 'lucide-angular';
import {Product} from './models/product';
import {
   PriceBookCategoryService,
   PriceBookCategoryDto,
   CreatePriceBookCategoryRequest,
   UpdatePriceBookCategoryRequest
} from './services/price-book-category.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {OrganizationDto} from '../../models/organization';
import {ModalService} from '../../common/modal/modal.service';
import {
   AddEditCategoryData,
   AddEditCategoryResult,
   AddEditPriceBookCategoryDialogComponent
} from './add-edit-pricebook-category-dialog/add-edit-pricebook-category-dialog.component';
import {ToastService} from '../../common/toast/toast.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {PageHeaderComponent} from '../dashboard/page-header/page-header.component';

@Component({
   selector: 'app-pricebook',
   standalone: true,
   imports: [LucideAngularModule, RouterLink, PageHeaderComponent],
   templateUrl: './pricebook.component.html',
   styleUrls: ['./pricebook.component.scss']
})
export class PriceBookComponent implements OnInit, OnDestroy {
   private priceBookCategoryService = inject(PriceBookCategoryService);
   private organizationContext = inject(OrganizationContextService);
   private toast = inject(ToastService);
   private modal = inject(ModalService);
   private route = inject(ActivatedRoute);
   private cdr = inject(ChangeDetectorRef);
   private orgSub?: Subscription;
   private routeSub?: Subscription;

   organizationId: string | null = null;
   private onboardingActionHandled = false;

   headerActions = [
      {
         key: 'openAddMaterialDialog',
         label: 'Add Material',
         icon: 'plus-circle',
         class: 'btn btn-primary px-4 fw-semibold',
      }
   ];


   // ---- Categories state wired to API ----
   materialCategories: PriceBookCategoryDto[] = [];
   loading = false;
   error: string | null = null;
   organization: OrganizationDto

   ngOnInit(): void {
      this.orgSub = this.organizationContext.org$
         .pipe(
            filter((org): org is OrganizationDto => !!org && !!org.id),
            distinctUntilChanged((a, b) => a.id === b.id)
         )
         .subscribe(org => {
            this.organization = org;
            this.organizationId = org.id!;
            this.loadCategories();
         });

      this.routeSub = this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-pricebook-modal') return;

         this.openAddMaterialDialog();
         this.onboardingActionHandled = true;
      });
   }

   ngOnDestroy(): void {
      this.orgSub?.unsubscribe();
      this.routeSub?.unsubscribe();
   }

   private loadCategories(): void {
      if (!this.organizationId) {
         this.error = 'organizationId is required to load categories.';
         return;
      }

      this.loading = true;
      this.error = null;

      this.priceBookCategoryService.getAll().subscribe({
         next: (cats) => {
            this.materialCategories = cats ?? [];
            this.loading = false;
            this.cdr.detectChanges();
         },
         error: (e) => {
            // BaseApiService should already log/handle details; keep UI simple
            this.error = 'Failed to load categories.';
            this.loading = false;
            console.error('loadCategories error', e);
         }
      });
   }

   // ---- UI actions (wire these to dialogs/forms as you build them) ----
   onAddCategory(): void {
      // Example create; replace with modal-driven values
      const body: CreatePriceBookCategoryRequest = {name: 'New Category', description: ''};
      this.priceBookCategoryService.create(body).subscribe({
         next: (created) => {
            // optimistic: push or reload
            this.materialCategories = [created, ...this.materialCategories].sort((a, b) => a.name.localeCompare(b.name));

         },
         error: (e) => {
            console.error('create category error', e);
            this.toast.error('Create failed', 'Name must be unique.');
         }
      });
   }

   editCategory(category: PriceBookCategoryDto): void {
      // Example update; replace with modal result
      const body: UpdatePriceBookCategoryRequest = {name: category.name, description: category.description ?? ''};
      this.priceBookCategoryService.update(category.id, body).subscribe({
         next: (updated) => {
            this.materialCategories = this.materialCategories.map(c => c.id === updated.id ? updated : c);
         },
         error: (e) => {
            console.error('update category error', e);
         }
      });
   }

   deleteCategory(category: PriceBookCategoryDto): void {
      // Confirm in real UI
      this.priceBookCategoryService.delete(category.id).subscribe({
         next: () => {
            this.materialCategories = this.materialCategories.filter(c => c.id !== category.id);
            this.toast.success('Category deleted', category.name);
         },
         error: (e) => {
            console.error('delete category error', e);
            this.toast.error('Category delete failed');
         }
      });
   }

   viewCategoryItems(_category: PriceBookCategoryDto): void {
      void _category;
      // navigate or open a modal
   }

   editMaterial(_material: Product): void {
      void _material;
      // logic to edit
   }

   deleteMaterial(_material: Product): void {
      void _material;
      // logic to delete
   }

   openAddMaterialDialog(): void {
      const ref = this.modal.open<
         AddEditPriceBookCategoryDialogComponent,
         AddEditCategoryResult,
         AddEditCategoryData
      >(AddEditPriceBookCategoryDialogComponent, {
         data: {title: 'New Category', name: '', description: ''},
         panelClass: 'modal-dialog-centered',
      });

      ref.afterClosed().subscribe(result => {
         if (!result || !this.organizationId) return;

         this.priceBookCategoryService.create({
            name: result.name,
            description: result.description ?? ''
         }).subscribe({
            next: (created) => {
               this.loadCategories(); // or optimistic push
               this.toast.success('Category created', created.name);
            },
            error: (e) => {
               this.toast.error('Create failed', 'Name must be unique.');
               console.error(e);
            }
         });
      });
   }

   // Helps Angular avoid re-render churn
   trackByCategory = (_: number, c: PriceBookCategoryDto) => c.id;
}
