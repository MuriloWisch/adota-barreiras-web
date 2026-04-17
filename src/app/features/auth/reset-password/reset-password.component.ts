import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
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
          <span class="paw">🔒</span>
          <h1>Nova senha</h1>
          <p>Escolha uma senha segura</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nova senha</mat-label>
            <input matInput formControlName="password" [type]="showPwd ? 'text' : 'password'">
            <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd">
              <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Senha obrigatória</mat-error>
            <mat-error *ngIf="form.get('password')?.hasError('minlength')">Mínimo 6 caracteres</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmar senha</mat-label>
            <input matInput formControlName="confirmPassword" [type]="showPwd2 ? 'text' : 'password'">
            <button mat-icon-button matSuffix type="button" (click)="showPwd2 = !showPwd2">
              <mat-icon>{{ showPwd2 ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('confirmPassword')?.hasError('mismatch')">Senhas não conferem</mat-error>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>

          <button mat-raised-button class="btn-primary full-width" type="submit" [disabled]="loading">
            <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Redefinir senha</span>
          </button>

        </form>

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
    .btn-primary { background:#4CAF50!important; color:#fff!important; border-radius:12px!important; height:48px; font-size:15px; font-weight:600; transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-primary:hover:not([disabled]) { background:#43A047!important; box-shadow:0 6px 20px rgba(76,175,80,0.35)!important; transform:translateY(-1px); }
  `],
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  showPwd = false;
  showPwd2 = false;
  errorMsg = '';
  private token = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatch });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  passwordMatch(group: AbstractControl) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    if (p && c && p !== c) group.get('confirmPassword')?.setErrors({ mismatch: true });
    return null;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    this.auth.resetPassword(this.token, this.form.value.password).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { reset: 'success' } }),
      error: (err) => { this.errorMsg = err?.error?.message ?? 'Token inválido ou expirado.'; this.loading = false; },
    });
  }
}