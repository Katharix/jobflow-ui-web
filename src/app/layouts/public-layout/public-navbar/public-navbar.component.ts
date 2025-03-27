import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, HostListener, Input, input } from '@angular/core';
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
  navLinks=["home","about","features","pricing","contact"]

  @Input() navbarLight?: boolean
  isCollapsed = false;
  isSticky = false

  currentSection = 'home';

    // Listen to scroll event
    @HostListener('window:scroll', ['$event'])
    onWindowScroll() {
      this.checkActiveSection();
      this.isSticky = window.scrollY >= 50
    }
  
    // Check which section is currently in view 249965
    checkActiveSection() {
      const sections = document.querySelectorAll('.section');
      const scrollPosition = window.pageYOffset + 50; // You can adjust the offset based on your needs
  
      sections.forEach((section: any) => {
        if (scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
          this.currentSection = section.id;
        }
      });
    }
  
    // Scroll to a specific section when a navbar link is clicked
    scrollToSection(sectionId: string) {
      const element = document.getElementById(sectionId);
      if (element) {
        window.scrollTo({
          top: element.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  
    // Check if the section is active
    isActiveSection(sectionId: string): boolean {
      return this.currentSection === sectionId;
    }
}
