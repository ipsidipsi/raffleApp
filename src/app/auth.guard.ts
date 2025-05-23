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
    console.log('Guard - User Role:', userRole); // Log the user role in the guard
    if (!userRole) {
      // Redirect to login page if not logged in
      console.log('Guard - Not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    // Allow access only for admin

      return true;

    // Redirect to home if not admin
    console.log('Guard - User is not admin, redirecting to home');
    this.router.navigate(['/login']);
    return false;

  }
}
