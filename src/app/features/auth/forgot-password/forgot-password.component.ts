import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
          <span class="paw">🔑</span>
          <h1>Recuperar senha</h1>
          <p>Enviaremos um link para o seu e-mail</p>
        </div>

        <div class="success-box" *ngIf="sent">
          <span>📬</span>
          <p>Link enviado! Verifique sua caixa de entrada e spam.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!sent">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>E-mail</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">E-mail obrigatório</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>

          <button mat-raised-button class="btn-primary full-width" type="submit" [disabled]="loading">
            <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Enviar link de recuperação</span>
          </button>
        </form>

        <div class="auth-links">
          <a routerLink="/login">← Voltar ao login</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .auth-bg { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#f0fdf4,#e8f4fd); padding:16px; }
    .auth-card { background:#fff; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.10); padding:48px 40px; width:100%; max-width:420px; }
    .auth-logo { text-align:center; margin-bottom:32px; }
    .paw { font-size:44px; }
    h1 { color:#1E3A5F; font-size:24px; font-weight:700; margin:8px 0 4px; }
    p { color:#888; font-size:13px; }
    .full-width { width:100%; margin-bottom:8px; }
    .error-msg { background:#fef2f2; color:#dc2626; border-radius:8px; padding:10px 14px; font-size:13px; margin-bottom:12px; }
    .success-box { background:#f0fdf4; border:1px solid #4CAF50; border-radius:12px; padding:24px; text-align:center; margin-bottom:16px; }
    .success-box span { font-size:36px; }
    .success-box p { color:#1E3A5F; margin-top:10px; font-size:14px; }
    .btn-primary { background:#4CAF50!important; color:#fff!important; border-radius:12px!important; height:48px; font-size:15px; font-weight:600; transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-primary:hover:not([disabled]) { background:#43A047!important; box-shadow:0 6px 20px rgba(76,175,80,0.35)!important; transform:translateY(-1px); }
    .auth-links { display:flex; justify-content:center; margin-top:24px; }
    .auth-links a { color:#1E3A5F; font-size:14px; text-decoration:none; transition:color 0.3s ease; }
    .auth-links a:hover { color:#4CAF50; }
  `],
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  sent = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    this.auth.forgotPassword(this.form.value.email).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: (err) => { this.errorMsg = err?.error?.message ?? 'Erro ao enviar e-mail.'; this.loading = false; },
    });
  }
}