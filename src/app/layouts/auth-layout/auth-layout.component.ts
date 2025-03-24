import { Component, ViewEncapsulation } from '@angular/core';
import { LoginComponent } from "../../views/admin-views/auth/login/login.component";
import { RouterOutlet } from '@angular/router';
import { PreloaderComponent } from "../../landing/preloader.component";

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, PreloaderComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent {

}
