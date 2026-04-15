import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-register',
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
          <h1>Crie sua conta</h1>
          <p>Adote ou coloque para adoção</p>
        </div>

        <div class="success-box" *ngIf="success">
          <span>✅</span>
          <p>Cadastro realizado! Verifique seu e-mail para ativar a conta.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!success">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome completo</mat-label>
            <input matInput formControlName="name">
            <mat-icon matSuffix>person</mat-icon>
            <mat-error>Nome obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>E-mail</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">E-mail obrigatório</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Telefone</mat-label>
            <input matInput formControlName="phone" type="tel">
            <mat-icon matSuffix>phone</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Senha</mat-label>
            <input matInput formControlName="password" [type]="showPwd ? 'text' : 'password'" (input)="calcStrength()">
            <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd">
              <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Senha obrigatória</mat-error>
            <mat-error *ngIf="form.get('password')?.hasError('minlength')">Mínimo 6 caracteres</mat-error>
          </mat-form-field>

          <div class="strength-bar" *ngIf="form.get('password')?.value">
            <div class="bar" [class]="strengthClass"></div>
            <span>{{ strengthLabel }}</span>
          </div>

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
            <span *ngIf="!loading">Cadastrar</span>
          </button>

        </form>

        <div class="auth-links">
          <a routerLink="/login">Já tem conta? <strong>Entrar</strong></a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .auth-bg { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#f0fdf4,#e8f4fd); padding:16px; }
    .auth-card { background:#fff; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.10); padding:40px 36px; width:100%; max-width:440px; }
    .auth-logo { text-align:center; margin-bottom:28px; }
    .paw { font-size:44px; }
    h1 { color:#1E3A5F; font-size:24px; font-weight:700; margin:8px 0 4px; }
    p { color:#888; font-size:13px; }
    .full-width { width:100%; margin-bottom:4px; }
    .error-msg { background:#fef2f2; color:#dc2626; border-radius:8px; padding:10px 14px; font-size:13px; margin-bottom:12px; }
    .success-box { background:#f0fdf4; border:1px solid #4CAF50; border-radius:12px; padding:20px; text-align:center; margin-bottom:16px; }
    .success-box span { font-size:32px; }
    .success-box p { color:#1E3A5F; margin-top:8px; font-size:14px; }
    .strength-bar { margin:-4px 0 12px; display:flex; align-items:center; gap:10px; }
    .bar { height:6px; border-radius:4px; transition:all 0.3s ease; flex:1; }
    .bar.fraca { background:#ef4444; width:33%; }
    .bar.media { background:#f97316; width:66%; }
    .bar.forte { background:#4CAF50; width:100%; }
    span { font-size:12px; color:#666; }
    .btn-primary { background:#4CAF50!important; color:#fff!important; border-radius:12px!important; height:48px; font-size:16px; font-weight:600; transition:all 0.3s ease; display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-primary:hover:not([disabled]) { background:#43A047!important; box-shadow:0 6px 20px rgba(76,175,80,0.35)!important; transform:translateY(-1px); }
    .auth-links { display:flex; flex-direction:column; align-items:center; gap:12px; margin-top:20px; }
    .auth-links a { color:#1E3A5F; font-size:14px; text-decoration:none; transition:color 0.3s ease; }
    .auth-links a:hover { color:#4CAF50; }
  `],
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  success = false;
  showPwd = false;
  showPwd2 = false;
  errorMsg = '';
  strengthClass = '';
  strengthLabel = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      name:            ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      phone:           [''],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatch });
  }

  passwordMatch(group: AbstractControl) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    if (p && c && p !== c) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
    }
    return null;
  }

  calcStrength(): void {
    const pwd = this.form.get('password')?.value ?? '';
    const strong = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(pwd);
    const medium = /(?=.*[a-zA-Z])(?=.*\d)/.test(pwd);
    if (pwd.length >= 8 && strong)      { this.strengthClass = 'forte'; this.strengthLabel = 'Forte'; }
    else if (pwd.length >= 6 && medium) { this.strengthClass = 'media'; this.strengthLabel = 'Média'; }
    else                                { this.strengthClass = 'fraca'; this.strengthLabel = 'Fraca'; }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const { name, email, phone, password } = this.form.value;
    this.auth.register({ name, email, phone, password }).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => { this.errorMsg = err?.error?.message ?? 'Erro ao cadastrar.'; this.loading = false; },
    });
  }
}