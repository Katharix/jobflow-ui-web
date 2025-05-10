// loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading-service.service';


export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  console.log('Intercepted HTTP Request:', req.method, req.url); 
  loadingService.show();

  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
