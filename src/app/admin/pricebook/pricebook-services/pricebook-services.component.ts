import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import {
   CreatePriceBookItemRequest,
   PriceBookItemDto,
   PriceBookItemService,
   PriceBookItemType,
   UpdatePriceBookItemRequest
} from '../services/price-book-item.service';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { ToastService } from '../../../common/toast/toast.service';
import { ModalService } from '../../../common/modal/modal.service';
import {
   AddEditPricebookItemDialogComponent,
   EditItemData,
   EditItemResult
} from '../add-edit-pricebook-item-dialog/add-edit-pricebook-item-dialog.component';
import { PageHeaderComponent } from '../../dashboard/page-header/page-header.component';
import {
   JobflowGridColumn,
   JobflowGridCommandClickEventArgs,
   JobflowGridCommandModel,
   JobflowGridComponent,
   JobflowGridPageSettings
} from '../../../common/jobflow-grid/jobflow-grid.component';

@Component({
   selector: 'app-pricebook-services',
   standalone: true,
   imports: [LucideAngularModule, PageHeaderComponent, JobflowGridComponent],
   templateUrl: './pricebook-services.component.html',
   styleUrl: './pricebook-services.component.scss'
})
export class PricebookServicesComponent implements OnInit, OnDestroy {
   private itemService = inject(PriceBookItemService);
   private orgContext = inject(OrganizationContextService);
   private toast = inject(ToastService);
   private modal = inject(ModalService);
   private router = inject(Router);

   private sub?: Subscription;
   orgId: string | null = null;
   items: PriceBookItemDto[] = [];

   commandButtons: JobflowGridCommandModel[] = [
      {
         type: 'Edit',
         buttonOption: {
            cssClass: 'e-flat e-primary',
            iconCss: 'e-icons e-edit',
            content: 'Edit'
         }
      },
      {
         type: 'Delete',
         buttonOption: {
            cssClass: 'e-flat e-danger',
            iconCss: 'e-icons e-delete',
            content: 'Delete'
         }
      }
   ];

   pageSettings: JobflowGridPageSettings = { pageSize: 20, pageSizes: [10, 20, 50, 100] };

   columns: JobflowGridColumn[] = [
      { field: 'name', headerText: 'Name', width: 220 },
      { field: 'category', headerText: 'Category', width: 160 },
      { field: 'partNumber', headerText: 'Part #', width: 140 },
      { field: 'unit', headerText: 'Unit', width: 100 },
      { field: 'cost', headerText: 'Cost', width: 110, textAlign: 'Right', format: 'C2' },
      { field: 'price', headerText: 'Price', width: 110, textAlign: 'Right', format: 'C2' },
      { field: 'description', headerText: 'Description', width: 300 },
      { headerText: '', width: 140, textAlign: 'Right', commands: this.commandButtons }
   ];

   ngOnInit(): void {
      this.sub = this.orgContext.org$.subscribe(org => {
         this.orgId = org?.id ?? null;
         if (this.orgId) this.load();
      });
   }

   ngOnDestroy(): void {
      this.sub?.unsubscribe();
   }

   load(): void {
      if (!this.orgId) return;

      this.itemService.getAllForOrganization().subscribe({
         next: (list) => {
            this.items = (list ?? [])
               .filter(item => item.itemType === PriceBookItemType.Service)
               .sort((a, b) => a.name.localeCompare(b.name));
         },
         error: (e) => {
            this.toast.error('Failed to load services');
            console.error(e);
         }
      });
   }

   add(): void {
      if (!this.orgId) return;
      const ref = this.modal.open<AddEditPricebookItemDialogComponent, EditItemResult, EditItemData>(
         AddEditPricebookItemDialogComponent,
         {
            data: { title: 'Add Service', orgId: this.orgId },
            panelClass: 'modal-lg'
         }
      );
      ref.afterClosed().subscribe(result => {
         if (!result) return;
         result.type = PriceBookItemType.Service;
         const body: CreatePriceBookItemRequest = {
            name: result.name,
            description: result.description ?? null,
            partNumber: result.partNumber ?? null,
            unit: result.unit ?? null,
            cost: result.cost,
            price: result.price,
            itemType: result.type,
            inventoryUnitsPerSale: result.inventoryUnitsPerSale,
            categoryId: result.categoryId ?? null
         };
         this.itemService.create(body).subscribe({
            next: (created) => {
               this.items = [created, ...this.items].sort((a, b) => a.name.localeCompare(b.name));
               this.toast.success('Service created', created.name);
            },
            error: () => this.toast.error('Failed to create service')
         });
      });
   }

   onCommandClick(args: JobflowGridCommandClickEventArgs): void {
      const row = args.rowData as PriceBookItemDto;
      switch (args.commandColumn?.type) {
         case 'Edit':
            this.edit(row);
            break;
         case 'Delete':
            this.delete(row);
            break;
      }
   }

   private edit(item: PriceBookItemDto): void {
      if (!this.orgId) return;
      const ref = this.modal.open<AddEditPricebookItemDialogComponent, EditItemResult, EditItemData>(
         AddEditPricebookItemDialogComponent,
         {
            data: { title: 'Edit Service', orgId: this.orgId, item },
            panelClass: 'modal-lg'
         }
      );
      ref.afterClosed().subscribe(result => {
         if (!result) return;
         const body: UpdatePriceBookItemRequest = {
            ...item,
            name: result.name,
            description: result.description ?? null,
            partNumber: result.partNumber ?? null,
            unit: result.unit ?? null,
            cost: result.cost,
            price: result.price,
            itemType: result.type ?? item.itemType,
            inventoryUnitsPerSale: result.inventoryUnitsPerSale,
            categoryId: result.categoryId ?? item.categoryId ?? null
         };
         this.itemService.update(body).subscribe({
            next: (updated) => {
               this.items = this.items.map(i => i.id === updated.id ? updated : i)
                  .sort((a, b) => a.name.localeCompare(b.name));
               this.toast.success('Service updated', updated.name);
            },
            error: () => this.toast.error('Failed to update service')
         });
      });
   }

   private delete(item: PriceBookItemDto): void {
      if (!item.id) return;
      if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
      this.itemService.delete(item.id).subscribe({
         next: () => {
            this.items = this.items.filter(i => i.id !== item.id);
            this.toast.success('Service deleted');
         },
         error: () => this.toast.error('Failed to delete service')
      });
   }
}
