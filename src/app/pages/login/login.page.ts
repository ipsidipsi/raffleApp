import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.loginForm.valid) {
      this.http
        .post(`${environment.apiUrl}/auth/login`, this.loginForm.value)
        .subscribe({
          next: (res: any) => {
            console.log('Login success', res);
            // Store token (optional)
            localStorage.setItem('token', res.token);
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
