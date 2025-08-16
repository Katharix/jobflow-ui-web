import { Component } from '@angular/core';
import { Product } from './models/product';
import { LucideAngularModule } from 'lucide-angular';
import { GridModule } from '@syncfusion/ej2-angular-grids';
import { PageHeaderComponent } from "../../views/admin-views/dashboard/page-header/page-header.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  standalone: true,
  imports: [LucideAngularModule, GridModule, CommonModule],
})
export class ProductsComponent {
  headerActions = [
    {
      key: 'openAddMaterialDialog',
      label: 'Add Material',
      icon: 'plus-circle',
      class: 'btn btn-primary px-4 fw-semibold',
    }
  ]
  products: Product[] = [
    {
      name: 'ADFA',
      description: 'Default material entry',
      partNumber: '1234-A',
      unit: 'ea',
      cost: 0,
      price: 0,
    },
  ];

  openAddMaterialDialog(): void {
    // logic to open modal/dialog
  }

  editMaterial(material: Product): void {
    // logic to edit
  }

  deleteMaterial(material: Product): void {
    // logic to delete
  }

  materialCategories = [
    { name: 'Electrical', items: [/* ... */] },
    { name: 'Plumbing', items: [/* ... */] },
    { name: 'HVAC', items: [/* ... */] }
  ];

  onAddCategory() {
    // open dialog or route
  }

  viewCategoryItems(category: any) {
    // navigate or open a modal
  }

  editCategory(category: any) {
    // logic to edit category
  }

  deleteCategory(category: any) {
    // confirm and delete
  }
}