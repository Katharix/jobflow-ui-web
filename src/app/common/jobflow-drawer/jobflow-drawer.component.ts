import {
   Component,
   Input,
   Output,
   EventEmitter
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-jobflow-drawer',
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

   close(): void {
      this.closed.emit();
   }
}
