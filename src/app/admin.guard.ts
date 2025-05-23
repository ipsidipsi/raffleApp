// src/app/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getUserRole();
    if (role === 'admin') {
      return true;
    }
    console.log('AdminGuard - Access denied for non-admin, redirecting to home');
    this.router.navigate(['/home']);
    return false;
  }
}
