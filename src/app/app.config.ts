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
      },
      teal: {
         50: '#e8f4f4',
         100: '#c5e3e4',
         200: '#96c9ca',
         300: '#66afb1',
         400: '#3d9a9c',
         500: '#2D898B',
         600: '#267476',
         700: '#1e5d5e',
         800: '#164546',
         900: '#0e2e2f',
         950: '#071717'
      },
      amber: {
         50: '#fff8ec',
         100: '#ffecc8',
         200: '#ffd994',
         300: '#ffc660',
         400: '#ffb43c',
         500: '#FFA630',
         600: '#d98c28',
         700: '#b3721f',
         800: '#8c5917',
         900: '#66400f',
         950: '#402808'
      },
      red: {
         50: '#fdecea',
         100: '#f9cdc7',
         200: '#f2a298',
         300: '#eb776a',
         400: '#e54c3b',
         500: '#E03616',
         600: '#be2e13',
         700: '#9c250f',
         800: '#7a1c0c',
         900: '#581408',
         950: '#360c05'
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
      },
      colorScheme: {
         light: {
            surface: {
               0: '#ffffff',
               50: '#FAFBFF',
               100: '#EDEFF7',
               200: '#D3D6E0',
               300: '#BCBFCC',
               400: '#9DA2B3',
               500: '#6E7180',
               600: '#40424D',
               700: '#1E1E24',
               800: '#000000',
               900: '#000000'
            }
         },
         dark: {
            surface: {
               0: '#1E1E24',
               50: '#252530',
               100: '#2c2c3a',
               200: '#363645',
               300: '#40424D',
               400: '#6E7180',
               500: '#9DA2B3',
               600: '#BCBFCC',
               700: '#D3D6E0',
               800: '#EDEFF7',
               900: '#FAFBFF'
            }
         }
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
