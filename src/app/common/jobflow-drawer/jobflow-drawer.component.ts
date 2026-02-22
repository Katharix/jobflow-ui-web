import {
   Component,
   Input,
   Output,
   EventEmitter,
   HostListener
} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
   selector: 'jobflow-drawer',
   standalone: true,
   imports: [CommonModule],
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

   ngOnChanges(): void {
      if (this.open) {
         this.opened.emit();
      }
   }

   close(): void {
      this.closed.emit();
   }

   backdropClick(): void {
      if (this.closeOnBackdrop) {
         this.close();
      }
   }

   @HostListener('document:keydown.escape')
   onEscape(): void {
      if (this.open) {
         this.close();
      }
   }
}
