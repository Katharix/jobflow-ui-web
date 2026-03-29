import {inject} from '@angular/core';
import {HttpInterceptorFn} from '@angular/common/http';
import {Auth} from '@angular/fire/auth';
import {from, switchMap} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
   const auth = inject(Auth);

   const isClientHubRequest = req.url.includes('/client-hub');
   const isClientHubAuthRequest = req.url.includes('/client-hub-auth');
   const isClientPortalRequest = req.url.includes('/client-portal');

   if (isClientHubRequest || isClientHubAuthRequest || isClientPortalRequest) {
      return next(req);
   }

   if (req.headers.has('Authorization')) {
      return next(req);
   }

   return from(auth.currentUser?.getIdToken() ?? Promise.resolve(null)).pipe(
      switchMap(token => {
         if (!token) {
            return next(req);
         }

         return next(
            req.clone({
               setHeaders: {
                  Authorization: `Bearer ${token}`
               }
            })
         );
      })
   );
};
