import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl: string;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('user') || '{}'));
    this.currentUser = this.currentUserSubject.asObservable();
    this.apiUrl = environment.apiUrl; // Assign the API URL from environment.ts using the set-env.js na nasa package.json
    // Make sure apiUrl has the protocol, adding it if missing
    if (this.apiUrl && !this.apiUrl.startsWith('http://') && !this.apiUrl.startsWith('https://')) {
      this.apiUrl = 'http://' + this.apiUrl;
    }

   // console.log('API URL configured as:', this.apiUrl);
  }

  // login(username: string, password: string) {
  //   return this.http.post<any>(`${environment.apiUrl}/auth/login`, { username, password }).pipe(
  //     map(user => {
  //       // store user details and jwt token in local storage
  //       localStorage.setItem('user', JSON.stringify(user));
  //       this.currentUserSubject.next(user);
  //       return user;
  //     })
  //   );
  // }
  login(username: string, password: string) {
    const loginUrl = `${this.apiUrl}/auth/login`;
    // Create headers with Content-Type
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    console.log('Attempting login to:', loginUrl);
   // console.log('With credentials:', { username, password });

    return this.http.post<any>(
      loginUrl,
      { username, password },
      httpOptions
    ).pipe(
      map(response => {
        console.log('Login response:', response);
        const user = response.user; // Extract user details from the response
        localStorage.setItem('user', JSON.stringify(user)); // Store only user details in local storage
        this.currentUserSubject.next(user);
        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  logout() {
    // remove user from local storage and set current user to null
    // localStorage.removeItem('user');
    // this.currentUserSubject.next(null);
    // // Redirect to login page after logout
    // this.router.navigate(['/login']);
    localStorage.clear();
  }

  getUserRole(): string | null {
    const userJson = localStorage.getItem('user');
    console.log('Local Storage User Data:', userJson);

    if (!userJson) {
      console.log('No user data found in local storage');
      return null;
    }

    const user = JSON.parse(userJson);
    console.log('Parsed User Data:', user);

    return user.role || null;
  }


}
