import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
//import { PlatformHttpService } from './services/platform-http.service';
import { PlatformHttpService } from './services/platform-http.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private platformHttp: PlatformHttpService
  ) {
    this.currentUserSubject = new BehaviorSubject(this.getStoredUser());
    this.currentUser = this.currentUserSubject.asObservable();
    this.apiUrl = environment.apiUrl;

    // Make sure apiUrl has the protocol, adding it if missing
    if (this.apiUrl && !this.apiUrl.startsWith('http://') && !this.apiUrl.startsWith('https://')) {
      this.apiUrl = 'http://' + this.apiUrl;
    }
  }

  private getStoredUser(): any {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = this.getStoredUser();

    console.log('isAuthenticated - Token exists:', !!token);
    console.log('isAuthenticated - User exists:', !!user);
    console.log('isAuthenticated - User data:', user);

    // Check if both token and user exist
    return !!(token && user && user.id);
  }

  login(username: string, password: string) {
    console.log('🔍 DEBUG: Environment:', environment);
    console.log('🔍 DEBUG: API URL:', this.apiUrl);
    console.log('🔍 DEBUG: Login attempt to:', `${this.apiUrl}/auth/login`);
    console.log('🔍 DEBUG: Platform check:', Capacitor?.isNativePlatform());
    console.log('🔍 DEBUG: Current platform:', Capacitor?.getPlatform());

    const loginUrl = `${this.apiUrl}/auth/login`;
    const loginData = { username, password };

    console.log('🔍 DEBUG: Making HTTP request...');
    console.log('🔍 DEBUG: Using platform HTTP service');

    // Use the platform-aware HTTP service instead of regular HttpClient
    return this.platformHttp.post(loginUrl, loginData).pipe(
      map(response => {
        console.log('✅ DEBUG: Login response received:', response);

        // Store token and user data
        localStorage.setItem('access_token', response.access_token);
        const userData = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role
        };
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ DEBUG: Data stored successfully');

        this.currentUserSubject.next(userData);
        return response;
      }),
      catchError(error => {
        console.error('❌ DEBUG: Login error details:', error);

        if (error.status === 0) {
          console.error('❌ Network Error: Could not connect to server');
          console.error('❌ This usually means CORS, network, or server issues');
        }

        throw error;
      })
    );
  }

  logout() {
    console.log('Logging out...');

    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    // Update current user subject
    this.currentUserSubject.next(null);
  }

  getUserRole(): string | null {
    const user = this.getStoredUser();
    console.log('getUserRole - User data:', user);
    return user ? user.role : null;
  }

  getCurrentUser(): any {
    return this.getStoredUser();
  }

  // Get the stored token for API calls
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Additional helper method to check if token exists
  hasToken(): boolean {
    return !!this.getToken();
  }
}
