import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay">
      <div class="spinner-wrapper">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(255, 255, 255, 0.7);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center; /* ✅ Centers both spinner and text */
}

.loading-text {
  margin-top: 12px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
  `]
})
export class LoadingOverlayComponent {}
