import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { doc, getDoc, Firestore, collection, getDocs } from '@angular/fire/firestore';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    FormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  returnUrl: any;
  email = '';
  password = '';
  error: string | null = null;
  
  constructor(private firestore: Firestore,private auth: Auth,private router: Router, private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    this.testFirestoreRead();
    // Get the return URL from the route parameters, or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
  async testFirestoreRead() {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersCollection);
      console.log('✅ Firestore read success:', snapshot.docs.map(doc => doc.data()));
    } catch (err) {
      console.error('🔥 Firestore test read failed:', err);
    }
  }

  async onLoggedin(e: Event) {
    e.preventDefault();
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/admin']);
    } catch (err: any) {
      this.error = err.message;
    }

    localStorage.setItem('isLoggedin', 'true');
  }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then(async (result) => {
        const user = result.user;
        const uid = user.uid;
        const testDocRef = doc(this.firestore, 'users', 'test-user');
        try {
          const testSnap = await getDoc(testDocRef);
          if (testSnap.exists()) {
            console.log('✅ Test user data:', testSnap.data());
          } else {
            console.log('⚠️ No test user found');
          }
        } catch (err) {
          console.error('🔥 Firestore test read failed:', err);
        }


        const userRef = doc(this.firestore, 'users', uid);
        const docSnap = await getDoc(userRef);
  
        if (!docSnap.exists()) {
          this.router.navigate(['/auth/register'], { queryParams: { newGoogleUser: 'true' } });
        } else {
          this.router.navigate(['/admin']);
        }
      })
      .catch((error) => {
        console.error('Google login error:', error);
        this.error = error.message;
      });
  }
}
