import {inject} from '@angular/core';
import {HttpInterceptorFn} from '@angular/common/http';
import {Auth} from '@angular/fire/auth';
import {from, switchMap} from 'rxjs';
import {environment} from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
   const auth = inject(Auth);

   const isClientHubRequest = req.url.includes('/client-hub');
   const isClientHubAuthRequest = req.url.includes('/client-hub-auth');
   const isClientPortalRequest = req.url.includes('/client-portal');
   const isApiRequest = req.url.startsWith(environment.apiUrl);
   const isExternalRequest = !isApiRequest && (req.url.startsWith('https://') || req.url.startsWith('http://'));

   if (isClientHubRequest || isClientHubAuthRequest || isClientPortalRequest || isExternalRequest) {
      return next(req);
   }

   if (req.headers.has('Authorization')) {
      return next(req);
   }

   return from(auth.authStateReady()).pipe(
      switchMap(() => from(auth.currentUser?.getIdToken() ?? Promise.resolve(null))),
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
