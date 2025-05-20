import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const userRole = this.authService.getUserRole();
    if (!userRole) {
      // Redirect to login page if not logged in
      this.router.navigate(['/login']);
      return false;
    }
    // Allow access only for admin
    if (userRole === 'admin') {
      return true;
    }
    // Redirect to home if not admin
    this.router.navigate(['/home']);
    return false;

  }
}
