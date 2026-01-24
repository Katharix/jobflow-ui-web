import {Component, EventEmitter, Input, Output, TemplateRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';

import {
   CommandClickEventArgs,
   CommandModel,
   GridComponent,
   GridModule,
   PageSettingsModel,
   ToolbarItems,
   ToolbarService,
   PageService,
   SortService,
   FilterService,
   CommandColumnService
} from '@syncfusion/ej2-angular-grids';

// ✅ Stable type for toolbar click across Syncfusion versions
import type {ClickEventArgs} from '@syncfusion/ej2-navigations';
import {FormsModule} from "@angular/forms";

export interface JobflowGridColumn {
   field?: string;
   headerText: string;
   width?: number;
   textAlign?: 'Left' | 'Right' | 'Center';
   format?: string;
   valueAccessor?: Function;
   commands?: any[];
   template?: TemplateRef<any>;
}

@Component({
   selector: 'jobflow-grid',
   standalone: true,
   imports: [CommonModule, GridModule, FormsModule],
   templateUrl: './jobflow-grid.component.html',
   // ✅ REQUIRED for standalone reusable grid features
   providers: [
      ToolbarService,
      PageService,
      SortService,
      FilterService,
      CommandColumnService
   ]
})
export class JobflowGridComponent {
   @ViewChild('grid', {static: true}) grid!: GridComponent;
   @Input() showSearchBar = false;

   searchText = '';

   /** Data */
   @Input({required: true}) data: any[] = [];

   /** Column definitions */
   @Input({required: true}) columns: JobflowGridColumn[] = [];

   /** Toolbar + paging */
   @Input() toolbar: (ToolbarItems | string)[] = [];
   @Input() pageSettings: PageSettingsModel = {pageSize: 20};
   @Input() height: string | number = 600;

   /** Standard toggles */
   @Input() allowPaging = true;
   @Input() allowSorting = true;
   @Input() allowFiltering = true;
   @Input() enableStickyHeader = true;

   /** Events */
   @Output() commandClick = new EventEmitter<CommandClickEventArgs>();

   // ✅ Use ClickEventArgs (toolbar click args)
   @Output() toolbarClick = new EventEmitter<ClickEventArgs>();

   onToolbarClick(args: ClickEventArgs) {
      this.toolbarClick.emit(args);
   }

   onCommandClick(args: CommandClickEventArgs) {
      this.commandClick.emit(args);
   }

   onSearchChange(): void {
      if (!this.grid) return;

      const value = this.searchText?.trim();

      if (!value) {
         this.grid.search('');
         return;
      }

      this.grid.search(value);
   }

   clearSearch(): void {
      this.searchText = '';
      this.grid.search('');
   }

}
