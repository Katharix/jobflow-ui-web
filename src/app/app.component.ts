import {Component, HostListener, OnInit} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';

@Component({
   selector: 'app-root',
   standalone: true,
   imports: [RouterOutlet],
   templateUrl: './app.component.html',
   styleUrl: './app.component.scss'
})
export class AppComponent {
   title = 'job-flow-ui-web';

   constructor() {
   }

}
