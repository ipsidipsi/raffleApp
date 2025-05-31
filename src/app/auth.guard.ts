import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    console.log('AuthGuard - Checking authentication...');

    // Check if user is authenticated (has valid token and user data)
    const isAuth = this.authService.isAuthenticated();
    console.log('AuthGuard - Is authenticated:', isAuth);

    if (isAuth) {
      console.log('AuthGuard - User is authenticated, allowing access');
      return true;
    }

    // If not authenticated, redirect to login
    console.log('AuthGuard - User not authenticated, redirecting to login');
    this.router.navigate(['/login']);
    return false;
  }
}
