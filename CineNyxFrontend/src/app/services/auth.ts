import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import { apiUrl, API_ENDPOINTS } from '../config/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();
  
  // Auth modal açma için Subject
  private openAuthModalSubject = new Subject<boolean>();
  openAuthModal$ = this.openAuthModalSubject.asObservable();
  
  openAuthModal(loginMode: boolean = true) {
    this.openAuthModalSubject.next(loginMode);
  }

  constructor(private http: HttpClient, private router: Router) {
    this.verifyToken();
  }

  getToken(): string | null {
    const matches = document.cookie.match(/(^| )access_token=([^;]+)/);
    return matches ? matches[2] : null;
  }

  login(loginData: { username: string; password: string }) {
    return this.http.post<any>(apiUrl(API_ENDPOINTS.auth.login), loginData, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    }).pipe(
      tap(res => {
        if (res && (res.success === true || res.status == "success")) {
          if (res.access_token) {
            document.cookie = `access_token=${res.access_token}; path=/;`;
          }
          if (res.data) {
            this.userSubject.next(res.data);
            console.log('Login successful, user data set:', res.data);
          } else {
            // Eğer data yoksa token'dan verify et
            this.verifyToken();
          }
        }
      })
    );
  }

  register(registerData: { username: string; password: string; email: string }) {
    return this.http.post<any>(apiUrl(API_ENDPOINTS.auth.register), registerData, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    }).pipe(
      tap(res => {
        if (res && (res.success === true || res.status == "success")) {
          if (res.access_token) {
            document.cookie = `access_token=${res.access_token}; path=/;`;
          }
          if (res.data) {
            this.userSubject.next(res.data);
            console.log('Registration successful, user data set:', res.data);
          } else {
            // Eğer data yoksa token'dan verify et
            this.verifyToken();
          }
        }
      })
    );
  }

  setUserData(userData: any) {
    this.userSubject.next(userData);
  }

  verifyToken() {
    const token = this.getToken();
    console.log('Verifying token:', token);
    
    if (!token) {
      console.log('No token found');
      this.userSubject.next(null);
      return;
    }

    this.http.post<any>(apiUrl(API_ENDPOINTS.auth.user), { token }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (res) => {
        console.log('Token verification response:', res);
        if (res.status == "success") {
          this.userSubject.next(res.data);
          console.log('User data updated after token verification:', res.data);
        } else {
          console.log('Token verification failed');
          this.userSubject.next(null);
        }
      },
      error: (err) => {
        console.error('Token verification error:', err);
        // Token geçersizse sadece user'ı null yap, logout yapma (kullanıcı zaten giriş yapmamış olabilir)
        this.userSubject.next(null);
      }
    });
  }

  logout() {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    this.userSubject.next(null);
    // Login sayfası yok, ana sayfaya yönlendir
    this.router.navigate(['/']);
  }

  getUser(): any {
    try {
      return (this.userSubject as BehaviorSubject<any>).getValue();
    } catch (e) {
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.isAdmin === true) return true;
    if (user.role && user.role.toString().toLowerCase() === 'admin') return true;
    if (Array.isArray(user.roles) && user.roles.some((r: any) => r.toString().toLowerCase() === 'admin')) return true;
    return false;
  }
}
