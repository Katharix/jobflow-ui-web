import { ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { PreloaderComponent } from "../../landing/preloader.component";
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading-service.service';
import { LoadingOverlayComponent } from "../../common/app-loading-overlay/app-loading-overlay.component";

@Component({
  selector: 'app-general-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PreloaderComponent, LoadingOverlayComponent],
  templateUrl: './general-layout.component.html',
  styleUrl: './general-layout.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class GeneralLayoutComponent implements OnInit {
  isLoading: boolean = false;
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadingService.isLoading$.subscribe(value => {
      // Use setTimeout to push change detection to the next cycle
      setTimeout(() => {
        this.isLoading = value;
        this.cdr.detectChanges(); // <-- Safely tell Angular to recheck
      });
    });
  }
}
