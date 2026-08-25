import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, InputTextModule, ButtonModule],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [modal]="true" 
      [style]="{ width: '450px' }"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="false"
      [closeOnEscape]="true"
      [focusOnShow]="true"
      (onHide)="onClose()"
      header="Giriş Yap">
      
      <form (ngSubmit)="onSubmit()" (keydown.enter)="onSubmit()" class="auth-form">
        <div class="form-group">
          <label for="username">Kullanıcı Adı</label>
          <input 
            id="username"
            type="text" 
            pInputText 
            [(ngModel)]="formData.username" 
            name="username"
            placeholder="Kullanıcı adınız"
            required />
        </div>

        <div class="form-group">
          <label for="password">Şifre</label>
          <input 
            id="password"
            type="password" 
            pInputText 
            [(ngModel)]="formData.password" 
            name="password"
            placeholder="Şifreniz"
            required />
        </div>

        <div class="form-actions">
          <button 
            pButton 
            type="button"
            label="Giriş Yap"
            class="p-button-primary"
            [loading]="loading"
            [disabled]="loading || !formData.username || !formData.password"
            (click)="onSubmit()">
          </button>
        </div>

        <div class="form-footer">
          <span *ngIf="isLogin">Hesabınız yok mu? </span>
          <button 
            type="button" 
            class="link-btn"
            (click)="goToRegister()">
            Kayıt Ol
          </button>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-color);
    }

    .form-group input {
      width: 100%;
    }

    .form-actions {
      margin-top: 0.5rem;
    }

    .form-actions button {
      width: 100%;
    }

    .form-footer {
      text-align: center;
      margin-top: 1rem;
      font-size: 0.9rem;
      color: var(--text-color-secondary);
    }

    .link-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      font-weight: 600;
      text-decoration: underline;
      padding: 0;
      margin-left: 0.25rem;
    }

    .link-btn:hover {
      color: rgba(229, 9, 20, 0.8);
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(255, 80, 80, 0.1);
      border: 1px solid rgba(255, 80, 80, 0.3);
      border-radius: 8px;
      color: #ff5050;
      font-size: 0.85rem;
      text-align: center;
    }
  `]
})
export class AuthModalComponent {
  visible = false;
  isLogin = true;
  loading = false;
  errorMessage = '';
  
  formData = {
    username: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  show(loginMode: boolean = true) {
    this.isLogin = loginMode;
    this.visible = true;
    this.errorMessage = '';
    this.formData = {
      username: '',
      password: ''
    };
  }

  goToRegister() {
    this.visible = false;
    this.router.navigate(['/register']);
  }

  onSubmit() {
    // Form validation
    if (!this.formData.username || !this.formData.password) {
      this.errorMessage = 'Lütfen tüm alanları doldurun';
      return;
    }

    if (this.loading) {
      return; // Zaten işlem devam ediyor
    }
    
    this.loading = true;
    this.errorMessage = '';

    console.log('Login attempt started:', this.formData.username);

    // Dialog'un focus trap'inden kaçmak için setTimeout kullan
    setTimeout(() => {
      this.authService.login({
        username: this.formData.username.trim(),
        password: this.formData.password
      }).subscribe({
        next: (res) => {
          console.log('Login response received:', res);
          this.loading = false;
          if (res && (res.success === true || res.status === 'success')) {
            // Modal'ı hemen kapat ve change detection'ı tetikle
            this.visible = false;
            this.cdr.detectChanges();
            // Mevcut sayfada kal, yönlendirme yapma
          } else {
            this.errorMessage = res?.message || 'Giriş başarısız';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          this.loading = false;
          this.errorMessage = err?.error?.message || err?.message || 'Giriş sırasında bir hata oluştu';
          this.cdr.detectChanges();
        }
      });
    }, 0);
  }

  onClose() {
    this.visible = false;
    this.errorMessage = '';
  }
}
