import {
   Component,
   Input,
   Output,
   EventEmitter
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Drawer} from 'primeng/drawer';

@Component({
   selector: 'jobflow-drawer',
   standalone: true,
   imports: [CommonModule, Drawer],
   templateUrl: './jobflow-drawer.component.html',
   styleUrls: ['./jobflow-drawer.component.scss']
})
export class JobflowDrawerComponent {
   @Input() open = false;
   @Input() title?: string;
   @Input() width = 480;
   @Input() closeOnBackdrop = true;

   @Output() closed = new EventEmitter<void>();
   @Output() opened = new EventEmitter<void>();

   get drawerStyle(): Record<string, string> {
      return {
         width: `${this.width}px`
      };
   }

   close(): void {
      this.closed.emit();
   }

   onVisibleChange(visible: boolean): void {
      if (!visible) {
         this.close();
      }
   }
}
