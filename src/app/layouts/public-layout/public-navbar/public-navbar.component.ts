import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, NgbCollapseModule,TitleCasePipe,RouterLink],
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss'
})
export class PublicNavbarComponent {
  navLinks = ['home', 'about', 'features', 'pricing', 'contact'];

  @Input() navbarLight?: boolean
  isCollapsed = true;
  isSticky = false

  currentSection = 'home';

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

  isActiveSection(sectionId: string): boolean {
    return this.currentSection === sectionId;
  }
}
