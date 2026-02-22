import {Component, Input, OnInit} from '@angular/core';
import {filter, distinctUntilChanged} from 'rxjs/operators';
import {CommonModule} from '@angular/common';
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
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
   selector: 'app-pricebook',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, RouterLink, RouterLinkActive],
   templateUrl: './pricebook.component.html'
})
export class PriceBookComponent implements OnInit {
   organizationId: string | null = null;

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

   constructor(
      private priceBookCategoryService: PriceBookCategoryService,
      private organizationContext: OrganizationContextService,
      private toast: ToastService,
      private modal: ModalService,
   ) {
      this.organizationContext.org$.subscribe(org => {
         if (org) {
            this.organization = org;
            this.organizationId = org.id ?? null;
         }
      });
   }

   ngOnInit(): void {
      this.organizationContext.org$
         .pipe(
            filter((org): org is OrganizationDto => !!org && !!org.id),
            distinctUntilChanged((a, b) => a.id === b.id)
         )
         .subscribe(org => {
            this.organization = org;
            this.organizationId = org.id!;
            this.loadCategories();
         });
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

   viewCategoryItems(category: PriceBookCategoryDto): void {
      // navigate or open a modal
   }

   editMaterial(material: Product): void {
      // logic to edit
   }

   deleteMaterial(material: Product): void {
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
