import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, getAdditionalUserInfo, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { OrganizationService } from '../../../../services/organization.service';
import { Organization, OrganizationDto } from '../../../../models/organization';
import { OrganizationTypeService } from '../../../../services/organization-type.service';
import { OrganizationType } from '../../../../models/organization-type';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgStyle, RouterLink, FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  email: string = '';
  organizationName: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';
  organizationTypes: OrganizationType[] = [];
  selectedOrganizationTypeId: string = '';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private orgService: OrganizationService,
    private organizationTypeService: OrganizationTypeService
  ) { }

  ngOnInit(): void {
    this.loadOrganizationTypes();
  }

  private loadOrganizationTypes(): void {
    this.organizationTypeService.getAllOrganizations().subscribe({
      next: (data) => {
        this.organizationTypes = data;
        console.log('Organization Types:', data);
      },
      error: (err) => console.error('Failed to load org types:', err)
    });
  }

  onRegister(e: Event) {
    e.preventDefault();
    this.register();
  }

  async register() {
    console.log('Register clicked');
    this.error = '';
    const role = 'SuperAdmin';

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
      const orgDto: OrganizationDto = {
        organizationName: this.organizationName,
        firebaseUid: uid,
        organizationTypeId:  this.selectedOrganizationTypeId,
        userRole: role,
        emailAddress: this.email
      }
      let org: Organization;
      this.orgService.registerOrganization(orgDto).subscribe({
        next: (data) => {
          org = data;
          console.log(data);
          this.router.navigate(['/admin']);
        },
        error: (err) => console.error(err)
      });


    } catch (err: any) {
      console.error('Registration Error:', err);
      this.error = err.message;
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    this.error = '';
    const role = 'OrganizationAdmin';
    signInWithPopup(this.auth, provider)
      .then(async (result) => {
        const user = result.user;
        const additionalInfo = getAdditionalUserInfo(result);
        
        const isNewUser = additionalInfo?.isNewUser;
        console.log('Is new user?', isNewUser);
        
        if (isNewUser) {
          try {
            const uid = user.uid;

            await setDoc(doc(this.firestore, 'users', uid), {
              email: user.email,
              role,
              createdAt: new Date()
            });

            const orgDto: OrganizationDto = {
              organizationName: this.organizationName,
              firebaseUid: uid,
              organizationTypeId: this.selectedOrganizationTypeId,
              userRole: role,
              emailAddress: user.email ?? this.email.trim()
            }
            let org: Organization;
            this.orgService.registerOrganization(orgDto).subscribe({
              next: (data) => {
                org = data;
                console.log(data);
                this.router.navigate(['/admin']);
              },
              error: (err) => console.error(err)
            });


          } catch (err: any) {
            console.error('Registration Error:', err);
            this.error = err.message;
          }
        } else {
          // Existing user: proceed to dashboard
        }
      });

  }
}
