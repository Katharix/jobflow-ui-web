import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MessageService} from 'primeng/api';
import {providePrimeNG} from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import {routes} from './app.routes';
import {firebaseProviders} from './core/providers/firebase.providers';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {loadingInterceptor} from './interceptors/loading-interceptor';
import {lucideProviders} from './core/providers/lucide.providers';
import {OverlayModule} from '@angular/cdk/overlay';
import {PortalModule} from '@angular/cdk/portal';
import {authInterceptor} from "./interceptors/auth.interceptor";
import {clientHubAuthInterceptor} from './interceptors/client-hub-auth.interceptor';
import {TranslateModule} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import {LocalizationService} from './services/shared/localization.service';

export function initLocalization(localization: LocalizationService) {
   return () => localization.init();
}

export const appConfig: ApplicationConfig = {
   providers: [
      provideRouter(routes),
      provideAnimationsAsync(),
      providePrimeNG({
         theme: {
            preset: Aura
         },
         ripple: true
      }),
      provideHttpClient(withInterceptors([
         clientHubAuthInterceptor,
         authInterceptor,
         loadingInterceptor])),
      ...firebaseProviders,
      lucideProviders,
      MessageService,
      importProvidersFrom(
         OverlayModule,
         PortalModule,
         TranslateModule.forRoot({
            defaultLanguage: 'en',
            loader: provideTranslateHttpLoader({
               prefix: './assets/i18n/',
               suffix: '.json'
            })
         })
      ),
      {
         provide: APP_INITIALIZER,
         useFactory: initLocalization,
         deps: [LocalizationService],
         multi: true
      },
   ]
};
