
import { Component, Input, type OnInit } from '@angular/core';

@Component({
  selector: 'app-preloader',
  standalone: true,
  imports: [],
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
  @Input() autoHideMs: number | null = null;

  ngOnInit(): void {
    if (this.autoHideMs === null || this.autoHideMs < 0) {
      return;
    }

    const style = document.getElementById('preloader')?.style;
    setTimeout(() => {
      if (style) {
        style.visibility = 'hidden';
        style.opacity = '0';
      }
    }, this.autoHideMs);
  }

}
