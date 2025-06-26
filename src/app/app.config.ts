import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { firebaseProviders } from './firebase.providers';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './interceptors/loading-interceptor';
import {
  LucideAngularModule,
  Home,
  User,
  Menu,
  File,
  Building2,
  ChartNoAxesCombined,
  UserRound,
  MessagesSquare,
  Banknote,
  Briefcase,
  House,
  ChevronDown,
  MessageCircleQuestion,
  UsersRound,
  LifeBuoy,
  Save,
  FileText,
  Type,
  Upload,
  Image,
  Send,
  Printer,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([loadingInterceptor])),
    ...firebaseProviders,
    importProvidersFrom(
      LucideAngularModule.pick({
        Home,
        User,
        Menu,
        File,
        Building2,
        ChartNoAxesCombined,
        UserRound,
        UsersRound,
        MessagesSquare,
        Banknote,
        Briefcase,
        House,
        ChevronDown,
        MessageCircleQuestion,
        LifeBuoy,
        Save,
        FileText,
        Type,
        Upload,
        Image,
        Send,
        Printer
      })
    ),
  ]
};
