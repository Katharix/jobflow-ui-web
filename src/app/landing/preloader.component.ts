import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-preloader',
  standalone: true,
  imports: [CommonModule],
  template: `
      <div id="preloader">
        <div id="status">
            <div class="sk-chase">
                <div class="sk-chase-dot"></div>
                <div class="sk-chase-dot"></div>
                <div class="sk-chase-dot"></div>
                <div class="sk-chase-dot"></div>
                <div class="sk-chase-dot"></div>
                <div class="sk-chase-dot"></div>
            </div>
        </div>
    </div>
  `,
  styles: ``,
})
export class PreloaderComponent implements OnInit {

  ngOnInit(): void {
    const style = document.getElementById('preloader')?.style
    setTimeout(() => {
      if (style) {
        style.visibility = 'hidden';
        style.opacity = '0';
      }
    }, 500);
  }

}
