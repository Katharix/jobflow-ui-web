import { Routes } from '@angular/router';
import { InviteAcceptComponent } from './invite-accept.component';

export const INVITE_ROUTES: Routes = [
  { path: ':code', component: InviteAcceptComponent }
];
