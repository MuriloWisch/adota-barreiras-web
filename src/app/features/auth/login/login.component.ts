import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(32px)' }),
        animate('400ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="auth-bg">
      <div class="auth-card" @fadeSlideUp>

        <div class="auth-logo">
          <span class="paw">🐾</span>
          <h1>Adota Barreiras</h1>
          <p>Encontre seu novo melhor amigo</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>E-mail</mat-label>
            <input matInput formControlName="email" type="email" autocomplete="email">
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">E-mail obrigatório</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Senha</mat-label>
            <input matInput formControlName="password" [type]="showPassword ? 'text' : 'password'" autocomplete="current-password">
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Senha obrigatória</mat-error>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>

          <button mat-raised-button class="btn-primary full-width" type="submit" [disabled]="loading">
            <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Entrar</span>
          </button>

        </form>

        <div class="auth-links">
          <a routerLink="/forgot-password">Esqueci minha senha</a>
          <a routerLink="/register">Não tem conta? <strong>Cadastre-se</strong></a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f0fdf4 0%, #e8f4fd 100%);
      padding: 16px;
    }
    .auth-card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.10);
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
    }
    .auth-logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .paw { font-size: 48px; }
    h1 { color: #1E3A5F; font-size: 26px; font-weight: 700; margin: 8px 0 4px; }
    p { color: #888; font-size: 14px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .error-msg {
      background: #fef2f2;
      color: #dc2626;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 12px;
    }
    .btn-primary {
      background: #4CAF50 !important;
      color: #fff !important;
      border-radius: 12px !important;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-primary:hover:not([disabled]) {
      background: #43A047 !important;
      box-shadow: 0 6px 20px rgba(76,175,80,0.35) !important;
      transform: translateY(-1px);
    }
    .auth-links {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
    }
    .auth-links a {
      color: #1E3A5F;
      font-size: 14px;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    .auth-links a:hover { color: #4CAF50; }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Credenciais inválidas.';
        this.loading = false;
      },
    });
  }
}