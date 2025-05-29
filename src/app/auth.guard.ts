import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
     console.log('AuthGuard - canActivate called');

    // First check if user is logged in (has valid token)
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('AuthGuard - isLoggedIn result:', isLoggedIn);

    if (!isLoggedIn) {
      console.log('Guard - Not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    // Then check role if needed
    const userRole = this.authService.getUserRole();
    console.log('Guard - User Role:', userRole);

    // Allow access for any logged-in user
    //return true;

    // If you want to restrict to specific roles, uncomment and modify:
    if (userRole === 'admin' || userRole === 'user') {
      return true;
    } else {
      console.log('Guard - Insufficient permissions, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}
