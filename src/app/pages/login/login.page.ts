import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth.service';

@Component({
  standalone:false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginForm: FormGroup;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  // login() {
  //   if (this.loginForm.valid) {
  //     this.authService.login(this.loginForm.value.username, this.loginForm.value.password).subscribe({
  //       next: (res: any) => {
  //         console.log('Login success', res);
  //         // Set a default role for demonstration if not present
  //         if (!res.role) {
  //           res.role = 'admin';
  //         }
  //         localStorage.setItem('user', JSON.stringify(res));
  //         this.router.navigate(['/home']);
  //       },
  //       error: (err) => {
  //         this.errorMessage = 'Invalid username or password';
  //         console.error(err);
  //       },
  //     });
  //   }
  // }
  login() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value.username, this.loginForm.value.password).subscribe({
        next: (res: any) => {
          console.log('Login success', res);
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.errorMessage = 'Invalid username or password';
          console.error(err);
        },
      });
    }
  }

}
