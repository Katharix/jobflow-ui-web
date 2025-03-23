import { CommonModule } from '@angular/common'
import { Component, HostListener } from '@angular/core'

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  template: `
     <a href="javascript:void(0);" *ngIf="isVisible" (click)="scrollToTop()" class="back-to-top-btn btn btn-primary" id="back-to-top"><i class="ti ti-arrow-up"></i></a>
  `,
  styles: ``,
})
export class BackToTopComponent {
  isVisible = false

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isVisible = window.scrollY > 100
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
