import { CommonModule, NgStyle } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgStyle, RouterLink, FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  onRegister(e: Event) {
    e.preventDefault();
    this.register();
  }

  async register() {
    console.log('Register clicked');
    this.error = '';
    const role = 'katharixAdmin';
  
    if (this.password.trim() !== this.confirmPassword.trim()) {
      this.error = 'Passwords do not match';
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email.trim(),
        this.password.trim()
      );
  
      const uid = userCredential.user.uid;
  
      await setDoc(doc(this.firestore, 'users', uid), {
        email: this.email.trim(),
        role,
        createdAt: new Date()
      });
  
      this.router.navigate(['/admin']);
    } catch (err: any) {
      console.error('Registration Error:', err);
      this.error = err.message;
    }
  }
  
}
