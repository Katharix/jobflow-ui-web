import {Component, EventEmitter, Input, Output, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {Table, TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';

export interface JobflowGridColumn {
   field?: string;
   sortField?: string;
   searchFields?: string[];
   headerText: string;
   width?: number;
   textAlign?: 'Left' | 'Right' | 'Center';
   format?: string;
   valueAccessor?: JobflowGridValueAccessor;
   commands?: JobflowGridCommandModel[];
   template?: TemplateRef<unknown>;
}

export interface JobflowGridButtonOption {
   cssClass?: string;
   iconCss?: string;
   content?: string;
}

export interface JobflowGridCommandModel {
   type?: string;
   buttonOption?: JobflowGridButtonOption;
}

export interface JobflowGridCommandClickEventArgs {
   rowData: Record<string, unknown>;
   commandColumn?: {
      type?: string;
   };
}

export interface JobflowGridToolbarItem {
   id?: string;
   text?: string;
   cssClass?: string;
}

export interface JobflowGridToolbarClickEventArgs {
   item: JobflowGridToolbarItem;
}

export type JobflowGridValueAccessor = (
   field: string,
   row: Record<string, unknown>,
   column: JobflowGridColumn
) => unknown;

export interface JobflowGridPageSettings {
   pageSize?: number;
   pageSizes?: number[];
}

@Component({
   selector: 'app-jobflow-grid',
   standalone: true,
   imports: [CommonModule, TableModule, ButtonModule, FormsModule],
   templateUrl: './jobflow-grid.component.html'
})
export class JobflowGridComponent {
   @ViewChild('dt') table?: Table;

   @Input() showSearchBar = false;

   searchText = '';

   /** Data */
   @Input({required: true}) data: Record<string, unknown>[] = [];

   /** Column definitions */
   @Input({required: true}) columns: JobflowGridColumn[] = [];

   /** Toolbar + paging */
   @Input() toolbar: (JobflowGridToolbarItem | string)[] = [];
   @Input() pageSettings: JobflowGridPageSettings = {pageSize: 20};
   @Input() height: string | number = 600;

   /** Standard toggles */
   @Input() allowPaging = true;
   @Input() allowSorting = true;
   @Input() allowFiltering = true;
   @Input() enableStickyHeader = true;

   /** Events */
   @Output() commandClick = new EventEmitter<JobflowGridCommandClickEventArgs>();
   @Output() toolbarClick = new EventEmitter<JobflowGridToolbarClickEventArgs>();

   readonly defaultPageSize = 20;

   get gridHeight(): string {
      return typeof this.height === 'number' ? `${this.height}px` : this.height;
   }

   get pageSize(): number {
      return this.pageSettings?.pageSize ?? this.defaultPageSize;
   }

   get pageSizes(): number[] {
      return this.pageSettings?.pageSizes ?? [10, 20, 50, 100];
   }

   get globalFilterFields(): string[] {
      const fields = this.columns.flatMap((col) => {
         const explicitSearchFields = col.searchFields ?? [];
         const baseField = col.field ? [col.field] : [];
         return [...baseField, ...explicitSearchFields];
      });

      return Array.from(new Set(fields.filter(Boolean)));
   }

   trackByHeader(_index: number, col: JobflowGridColumn): string {
      return `${col.headerText}-${col.field ?? 'template'}`;
   }

   isToolbarString(item: JobflowGridToolbarItem | string): item is string {
      return typeof item === 'string';
   }

   getToolbarButtonClass(item: JobflowGridToolbarItem | string): string {
      if (this.isToolbarString(item)) return 'btn-outline-secondary';
      return item.cssClass || 'btn-outline-secondary';
   }

   getToolbarButtonLabel(item: JobflowGridToolbarItem | string): string {
      if (this.isToolbarString(item)) return item;
      return item.text || item.id || 'Action';
   }

   getSortableField(col: JobflowGridColumn): string | undefined {
      if (!this.allowSorting || col.commands?.length) {
         return undefined;
      }

      return col.sortField ?? col.field;
   }

   onToolbarItemClick(item: JobflowGridToolbarItem | string): void {
      const normalized = typeof item === 'string'
         ? {id: item, text: item}
         : item;

      this.toolbarClick.emit({item: normalized});
   }

   onCommandItemClick(type: string | undefined, rowData: Record<string, unknown>): void {
      this.commandClick.emit({
         rowData,
         commandColumn: {type}
      });
   }

   onSearchChange(): void {
      this.table?.filterGlobal(this.searchText?.trim() ?? '', 'contains');
   }

   clearSearch(): void {
      this.searchText = '';
      this.table?.clear();
   }

   getCellValue(row: Record<string, unknown>, col: JobflowGridColumn): unknown {
      if (col.valueAccessor && col.field) {
         return col.valueAccessor(col.field, row, col);
      }

      if (!col.field) return '';

      const rawValue = this.resolvePathValue(row, col.field);
      return this.formatValue(rawValue, col.format);
   }

   private resolvePathValue(row: Record<string, unknown>, fieldPath: string): unknown {
      return fieldPath.split('.').reduce<unknown>((acc, key) => {
         if (acc && typeof acc === 'object' && key in acc) {
            return (acc as Record<string, unknown>)[key];
         }
         return undefined;
      }, row);
   }

   private formatValue(value: unknown, format?: string): unknown {
      if (!format || value === null || value === undefined || value === '') {
         return value;
      }

      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) return value;

      if (format === 'C2') {
         return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
         }).format(numericValue);
      }

      if (format === 'N4') {
         return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
         }).format(numericValue);
      }

      return value;
   }
}
