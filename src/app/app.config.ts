import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MessageService} from 'primeng/api';
import {providePrimeNG} from 'primeng/config';
import {definePreset} from '@primeuix/themes';
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

const JobFlowTheme = definePreset(Aura, {
   primitive: {
      blue: {
         50: '#eef2fc',
         100: '#d4ddf7',
         200: '#b0c0f0',
         300: '#8ba3e8',
         400: '#6785e1',
         500: '#3F67DA',
         600: '#3355b8',
         700: '#284396',
         800: '#1d3174',
         900: '#121f52',
         950: '#0a1230'
      }
   },
   semantic: {
      primary: {
         50: '{blue.50}',
         100: '{blue.100}',
         200: '{blue.200}',
         300: '{blue.300}',
         400: '{blue.400}',
         500: '{blue.500}',
         600: '{blue.600}',
         700: '{blue.700}',
         800: '{blue.800}',
         900: '{blue.900}',
         950: '{blue.950}'
      }
   }
});

export const appConfig: ApplicationConfig = {
   providers: [
      provideRouter(routes),
      provideAnimationsAsync(),
      providePrimeNG({
         theme: {
            preset: JobFlowTheme
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
            fallbackLang: 'en',
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
