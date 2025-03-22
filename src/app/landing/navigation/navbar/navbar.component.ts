import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, HostListener, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
declare var bootstrap: any
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: object, private renderer: Renderer2) {}


  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => this.onScroll());
    }
  }

  onScroll() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
      if (window.scrollY > 50) {
        this.renderer.addClass(navbar, 'nav-sticky');
      } else {
        this.renderer.removeClass(navbar, 'nav-sticky');
      }
    }
  }
}