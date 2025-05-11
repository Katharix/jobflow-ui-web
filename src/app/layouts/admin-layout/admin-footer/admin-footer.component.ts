import { Component } from '@angular/core';
import { currentYear } from '../../../common/constants';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  imports: [],
  templateUrl: './admin-footer.component.html',
  styleUrl: './admin-footer.component.scss'
})
export class AdminFooterComponent {
  currentYear = currentYear
}
