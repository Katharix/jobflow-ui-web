import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, HostListener, Input, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { filter } from 'rxjs';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, NgbCollapseModule,TitleCasePipe,RouterLink],
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss'
})
export class PublicNavbarComponent {
  private router = inject(Router);

  navLinks = ['home', 'about', 'features', 'pricing', 'contact'];

  @Input() navbarLight?: boolean
  isCollapsed = true;
  isSticky = false

  currentSection = 'home';
  private pendingSection: string | null = null;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.pendingSection) {
          return;
        }

        const sectionId = this.pendingSection;
        this.pendingSection = null;
        setTimeout(() => this.scrollToSection(sectionId), 0);
      });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.checkActiveSection();
    this.isSticky = window.scrollY >= 50;
  }

  checkActiveSection(): void {
    const sections = document.querySelectorAll<HTMLElement>('section[id]');
    const scrollPosition = window.pageYOffset + 120;

    sections.forEach((section) => {
      if (scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
        this.currentSection = section.id;
      }
    });
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const navbarOffset = 85;
    const top = Math.max(element.offsetTop - navbarOffset, 0);
    window.scrollTo({ top, behavior: 'smooth' });
    this.isCollapsed = true;
  }

  navigateToSection(sectionId: string): void {
    const onHome = this.router.url === '/' || this.router.url.startsWith('/#');
    if (onHome) {
      this.scrollToSection(sectionId);
      return;
    }

    this.pendingSection = sectionId;
    this.router.navigate(['/'], { fragment: sectionId });
    this.isCollapsed = true;
  }

  isActiveSection(sectionId: string): boolean {
    return this.currentSection === sectionId;
  }
}
