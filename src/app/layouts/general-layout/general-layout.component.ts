import { ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '../../services/shared/loading-service.service';
import { PreloaderComponent } from '../../landing/preloader.component';

@Component({
    selector: 'app-general-layout',
    imports: [RouterOutlet, PreloaderComponent],
    templateUrl: './general-layout.component.html',
    styleUrl: './general-layout.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class GeneralLayoutComponent implements OnInit {
  isLoading = false;
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
