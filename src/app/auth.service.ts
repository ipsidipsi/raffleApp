import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  username: string;
  role?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl: string;

  // Add in-memory storage as backup
  private memoryUser: any = null;

  constructor(private http: HttpClient, private router: Router) {
    console.log('AuthService constructor called');

    // Initialize with safe parsing
    const initialUser = this.getSafeUserFromStorage();
    this.currentUserSubject = new BehaviorSubject(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();

    this.apiUrl = environment.apiUrl;
    if (this.apiUrl && !this.apiUrl.startsWith('http://') && !this.apiUrl.startsWith('https://')) {
      this.apiUrl = 'http://' + this.apiUrl;
    }

    console.log('AuthService - Initial user:', initialUser);
    console.log('AuthService - API URL configured as:', this.apiUrl);
  }

  private getSafeUserFromStorage(): any {
    try {
      const storedUser = localStorage.getItem('user');
      console.log('getSafeUserFromStorage - raw storedUser:', storedUser);

      if (!storedUser || storedUser === 'undefined' || storedUser === 'null') {
        console.log('getSafeUserFromStorage - No valid user data, clearing localStorage');
        localStorage.removeItem('user');
        this.memoryUser = null;
        return null;
      }

      const parsedUser = JSON.parse(storedUser);
      console.log('getSafeUserFromStorage - Successfully parsed user:', parsedUser);
      this.memoryUser = parsedUser; // Store in memory as backup
      return parsedUser;
    } catch (error) {
      console.error('getSafeUserFromStorage - Error parsing stored user data:', error);
      localStorage.removeItem('user');
      this.memoryUser = null;
      return null;
    }
  }

  private setUserData(user: any): void {
    console.log('setUserData - Setting user:', user);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(user));

    // Store in memory as backup
    this.memoryUser = user;

    // Update BehaviorSubject
    this.currentUserSubject.next(user);

    // Verify storage
    const verification = localStorage.getItem('user');
    console.log('setUserData - Verification stored data:', verification);
  }

  login(username: string, password: string) {
    const loginUrl = `${this.apiUrl}/auth/login`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    console.log('Attempting login to:', loginUrl);

    return this.http.post<any>(loginUrl, { username, password }, httpOptions).pipe(
      map(response => {
        console.log('Login response:', response);

        try {
          const decodedToken: JwtPayload = jwtDecode(response.access_token);
          console.log('Decoded token:', decodedToken);

          const user = {
            username: decodedToken.username || username,
            role: decodedToken.role || 'user',
            access_token: response.access_token,
            id: decodedToken.sub
          };

          this.setUserData(user);
          return response;
        } catch (error) {
          console.error('Error decoding JWT token:', error);

          const user = {
            username: username,
            access_token: response.access_token,
            role: 'user'
          };

          this.setUserData(user);
          return response;
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  logout() {
    localStorage.clear();
    this.memoryUser = null;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getUserRole(): string | null {
    // Try memory first, then localStorage
    let user = this.memoryUser;

    if (!user) {
      const userJson = localStorage.getItem('user');
      console.log('getUserRole - localStorage data:', userJson);

      if (!userJson || userJson === 'undefined' || userJson === 'null') {
        console.log('getUserRole - No valid user data found');
        return null;
      }

      try {
        user = JSON.parse(userJson);
        this.memoryUser = user; // Cache in memory
      } catch (error) {
        console.error('getUserRole - Error parsing user data:', error);
        localStorage.removeItem('user');
        return null;
      }
    }

    console.log('getUserRole - Using user data:', user);
    return user?.role || null;
  }

  getAccessToken(): string | null {
    // Try memory first, then localStorage
    let user = this.memoryUser;

    if (!user) {
      const userJson = localStorage.getItem('user');
      console.log('getAccessToken - localStorage data:', userJson);

      if (!userJson || userJson === 'undefined' || userJson === 'null') {
        console.log('getAccessToken - No valid user data found');
        return null;
      }

      try {
        user = JSON.parse(userJson);
        this.memoryUser = user; // Cache in memory
      } catch (error) {
        console.error('getAccessToken - Error parsing user data:', error);
        localStorage.removeItem('user');
        return null;
      }
    }

    const token = user?.access_token || null;
    console.log('getAccessToken - token present:', token !== null);
    return token;
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    console.log('isLoggedIn check - token present:', token !== null);
    return token !== null;
  }

  getCurrentUser(): any {
    return this.memoryUser || this.getSafeUserFromStorage();
  }
}
