import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GridComponent, GridModule, ToolbarService, PageService, SortService, FilterService, CommandColumnService,
  ToolbarItems, PageSettingsModel
} from '@syncfusion/ej2-angular-grids';
import { Subscription, combineLatest } from 'rxjs';

import {
  PriceBookItemService, PriceBookItemDto, PriceBookItemType
} from '../services/price-book-item.service';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { ToastService } from '../../../common/toast/toast.service';
import { ModalService } from '../../../common/modal/modal.service';
import { AddEditPricebookItemDialogComponent, EditItemData, EditItemResult } from '../add-edit-pricebook-item-dialog/add-edit-pricebook-item-dialog.component';
import { PageHeaderComponent } from "../../../views/admin-views/dashboard/page-header/page-header.component";
import { PriceBookCategoryService } from '../services/price-book-category.service';

@Component({
  selector: 'app-price-book-item',
  standalone: true,
  imports: [CommonModule, GridModule, PageHeaderComponent],
  providers: [ToolbarService, PageService, SortService, FilterService, CommandColumnService],
  templateUrl: './price-book-item.component.html',
  styleUrl: './price-book-item.component.scss'
})
export class PriceBookItemComponent implements OnInit, OnDestroy {
  @ViewChild('grid') grid?: GridComponent;

  private itemService = inject(PriceBookItemService);
  private categoryService = inject(PriceBookCategoryService);
  private orgCtx = inject(OrganizationContextService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router)

  sub?: Subscription;
  orgId: string | null = null;
  categoryId: string | null = null;
  categoryName: string | null = null; // optional if you pass name along (query param) or load it

  items: PriceBookItemDto[] = [];

  toolbar: ToolbarItems[] | any[] = ['Search', { text: 'New Item', tooltipText: 'Add', id: 'AddItem', prefixIcon: 'e-add' }];
  pageSettings: PageSettingsModel = { pageSize: 20, pageSizes: [10, 20, 50, 100] };

  commandButtons = [
    { buttonOption: { cssClass: 'e-flat e-primary', content: 'Edit', click: (args: any) => this.onEdit(args) } },
    { buttonOption: { cssClass: 'e-flat e-danger', content: 'Delete', click: (args: any) => this.onDelete(args) } }
  ];

  // map enum to label
  typeAccessor = (_: string, data: any) => this.typeLabel(data?.itemType);

// --- Actions config ---
headerActions = [
  {
    key: 'back',
    label: 'Back to Categories',
    icon: 'chevron-left',
    class: 'btn btn-outline-secondary px-3'
  },
  {
    key: 'add',
    label: 'New Item',
    icon: 'plus-circle',
    class: 'btn btn-primary px-4 fw-semibold'
  }
].map(a => ({
  ...a,
  click: this.getActionHandlerMap()[a.key]
}));

// --- Handlers map ---
private getActionHandlerMap(): Record<string, () => void> {
  return {
    back: () => this.goBackToCategories(),
    add: () => this.add()
  };
}

// --- Implement the handlers you need ---
private goBackToCategories() {
  // navigate back to your categories page/route
  this.router.navigate(['/admin/pricebook']); // adjust route as needed
}

private importItems() {
  // TODO: open your import modal / file selector
  this.toast.info('Import coming soon'); // placeholder
}

  ngOnInit(): void {
    this.sub = combineLatest([this.orgCtx.org$, this.route.paramMap]).subscribe(([org, params]) => {
      this.orgId = org?.id ?? null;
      this.categoryId = params.get('categoryId');
      if (this.orgId) this.load();
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  load() {
    if (!this.orgId || !this.categoryId) return;
    this.categoryService.getById(this.orgId, this.categoryId).subscribe({
      next: category => {
        this.categoryName = category.name ?? null;
      },
      error: e => { this.toast.error('Failed to retrieve category name'); console.error(e); }
    });

    this.itemService.getAll(this.orgId, this.categoryId).subscribe({
      next: list => {
        console.log('Pricebook Items: ', list);
        this.items = (list ?? []).sort((a, b) => a.name.localeCompare(b.name));
        console.log('Items ', this.items)
      },
      error: e => { this.toast.error('Failed to load items'); console.error(e); }
    });
  }


  // flip to true if you added the server-side categoryId filter on the controller
  private apiFiltersServerSide() { return true; }

  onToolbarClick(e: any) { if (e?.item?.id === 'AddItem') this.add(); }

  add() {
    if (!this.orgId) return;
    const ref = this.modal.open<AddEditPricebookItemDialogComponent, EditItemResult, EditItemData>(AddEditPricebookItemDialogComponent, {
      data: { title: 'Add Item', orgId: this.orgId },
      panelClass: 'modal-lg'
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      // force-associate with current category if present
      result.type = 1;
      const body = { ...result, categoryId: this.categoryId ?? result.categoryId };
      this.itemService.create(body as any).subscribe({
        next: created => {
          // show only if it belongs to this category
          if (!this.categoryId || (created.categoryId ?? '').toLowerCase() === this.categoryId.toLowerCase()) {
            this.items = [created, ...this.items].sort((a, b) => a.name.localeCompare(b.name));
          }
          this.toast.success('Item created', created.name);
        },
        error: e => { this.toast.error('Create failed'); console.error(e); }
      });
    });
  }

  onEdit(args: any) {
    const row = (args?.rowData ?? this.grid?.getRowObjectFromUID(args?.target?.closest('tr')?.getAttribute('data-uid'))?.data) as PriceBookItemDto;
    if (!row || !this.orgId) return;

    const ref = this.modal.open<AddEditPricebookItemDialogComponent, EditItemResult, EditItemData>(AddEditPricebookItemDialogComponent, {
      data: { title: 'Edit Item', orgId: this.orgId, item: row },
      panelClass: 'modal-lg'
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const body = { ...row, ...result, id: row.id, organizationId: this.orgId };
      this.itemService.update(body as any).subscribe({
        next: updated => {
          // If category changed, remove if it no longer matches the current filter
          const stillMatches = !this.categoryId || (updated.categoryId ?? '').toLowerCase() === this.categoryId!.toLowerCase();
          this.items = stillMatches
            ? this.items.map(i => i.id === updated.id ? updated : i)
            : this.items.filter(i => i.id !== updated.id);
          this.items = this.items.sort((a, b) => a.name.localeCompare(b.name));
          this.toast.success('Item updated', updated.name);
        },
        error: e => { this.toast.error('Update failed'); console.error(e); }
      });
    });
  }

  onDelete(args: any) {
    const row = (args?.rowData ?? this.grid?.getRowObjectFromUID(args?.target?.closest('tr')?.getAttribute('data-uid'))?.data) as PriceBookItemDto;
    if (!row) return;
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;

    this.itemService.delete(row.id!).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.id !== row.id);
        this.toast.success('Item deleted');
      },
      error: e => { this.toast.error('Delete failed'); console.error(e); }
    });
  }

  typeLabel(t: PriceBookItemType): string {
    switch (t) {
      case PriceBookItemType.Material:
        return 'Material';
      case PriceBookItemType.Service:
        return 'Service';
      default:
        return 'Unknown';
    }
  }

}
