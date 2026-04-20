import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../core/auth/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule, MatDividerModule,
  ],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="page-wrap">
      <div class="profile-card" @fadeUp>

        <div class="avatar-section">
          <div class="big-avatar">{{ initial() }}</div>
          <h1 class="user-name">{{ user()?.name }}</h1>
          <p class="user-email">{{ user()?.email }}</p>
          <span class="role-badge" [class.admin]="user()?.role === 'ADMIN'">
            {{ user()?.role === 'ADMIN' ? '⚙️ Administrador' : '🐾 Usuário' }}
          </span>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <mat-icon class="stat-icon">pets</mat-icon>
            <span class="stat-num">—</span>
            <span class="stat-label">Animais</span>
          </div>
          <div class="stat-item">
            <mat-icon class="stat-icon green">favorite</mat-icon>
            <span class="stat-num">—</span>
            <span class="stat-label">Adoções</span>
          </div>
          <div class="stat-item">
            <mat-icon class="stat-icon orange">send</mat-icon>
            <span class="stat-num">—</span>
            <span class="stat-label">Solicitações</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <section class="form-section">
          <h2 class="section-title"><mat-icon>person</mat-icon> Informações Pessoais</h2>

          <div class="form-error" *ngIf="infoError">
            <mat-icon>error_outline</mat-icon> {{ infoError }}
          </div>

          <form [formGroup]="infoForm" (ngSubmit)="saveInfo()">
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Nome completo</mat-label>
              <input matInput formControlName="name">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error>Nome obrigatório</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Telefone</mat-label>
              <input matInput formControlName="phone" type="tel">
              <mat-icon matSuffix>phone</mat-icon>
            </mat-form-field>

            <div class="form-footer">
              <button mat-raised-button class="btn-primary" type="submit" [disabled]="savingInfo()">
                <mat-spinner diameter="18" *ngIf="savingInfo()"></mat-spinner>
                <mat-icon *ngIf="!savingInfo()">save</mat-icon>
                {{ savingInfo() ? 'Salvando...' : 'Salvar alterações' }}
              </button>
            </div>
          </form>
        </section>

        <mat-divider></mat-divider>

        <section class="form-section">
          <h2 class="section-title"><mat-icon>lock</mat-icon> Segurança</h2>

          <div class="form-error"   *ngIf="pwdError">   <mat-icon>error_outline</mat-icon> {{ pwdError }} </div>
          <div class="form-success" *ngIf="pwdSuccess">  <mat-icon>check_circle</mat-icon> Senha alterada com sucesso! </div>

          <form [formGroup]="pwdForm" (ngSubmit)="changePwd()">

            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Senha atual</mat-label>
              <input matInput formControlName="current" [type]="showCurrent ? 'text' : 'password'">
              <button mat-icon-button matSuffix type="button" (click)="showCurrent = !showCurrent">
                <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error>Senha atual obrigatória</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Nova senha</mat-label>
              <input matInput formControlName="password" [type]="showNew ? 'text' : 'password'" (input)="calcStrength()">
              <button mat-icon-button matSuffix type="button" (click)="showNew = !showNew">
                <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="pwdForm.get('password')?.hasError('minlength')">Mínimo 6 caracteres</mat-error>
            </mat-form-field>

            <div class="strength-bar" *ngIf="pwdForm.get('password')?.value">
              <div class="bar" [class]="strengthClass"></div>
              <span class="strength-label">{{ strengthLabel }}</span>
            </div>

            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Confirmar nova senha</mat-label>
              <input matInput formControlName="confirm" [type]="showNew ? 'text' : 'password'">
              <mat-error *ngIf="pwdForm.get('confirm')?.hasError('mismatch')">Senhas não conferem</mat-error>
            </mat-form-field>

            <div class="form-footer">
              <button mat-stroked-button class="btn-outline" type="submit" [disabled]="savingPwd()">
                <mat-spinner diameter="18" *ngIf="savingPwd()"></mat-spinner>
                <mat-icon *ngIf="!savingPwd()">lock_reset</mat-icon>
                {{ savingPwd() ? 'Salvando...' : 'Alterar senha' }}
              </button>
            </div>

          </form>
        </section>

      </div>
    </div>
  `,
  styles: [`
    .page-wrap {
      min-height: 100vh; background: #f8fafc;
      display: flex; justify-content: center; padding: 32px 16px 64px;
    }
    .profile-card {
      background: #fff; border-radius: 24px;
      box-shadow: 0 4px 28px rgba(0,0,0,0.08);
      width: 100%; max-width: 600px;
      overflow: hidden; height: fit-content;
    }

    /* Avatar */
    .avatar-section {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 32px 24px; background: linear-gradient(135deg,#f0fdf4,#e8f4fd);
    }
    .big-avatar {
      width: 96px; height: 96px; border-radius: 50%;
      background: #1E3A5F; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 40px; font-weight: 800; margin-bottom: 14px;
      box-shadow: 0 4px 20px rgba(30,58,95,0.25);
    }
    .user-name  { font-size: 22px; font-weight: 800; color: #1E3A5F; }
    .user-email { font-size: 14px; color: #888; margin-top: 4px; }
    .role-badge {
      margin-top: 10px; font-size: 12px; font-weight: 700;
      padding: 4px 14px; border-radius: 20px;
      background: #dcfce7; color: #166534;
    }
    .role-badge.admin { background: #dbeafe; color: #1e3a8a; }

    .stats-row {
      display: flex; justify-content: space-around;
      padding: 20px 24px; border-bottom: 1px solid #f0f0f0;
    }
    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stat-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; color: #1E3A5F; }
    .stat-icon.green  { color: #4CAF50; }
    .stat-icon.orange { color: #f97316; }
    .stat-num   { font-size: 22px; font-weight: 800; color: #1E3A5F; }
    .stat-label { font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.4px; }

    .form-section { padding: 28px 32px; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 700; color: #1E3A5F; margin-bottom: 20px;
    }
    .section-title mat-icon { color: #4CAF50; }
    .full-w { width: 100%; margin-bottom: 4px; }

    .strength-bar { display: flex; align-items: center; gap: 10px; margin: -4px 0 14px; }
    .bar { height: 5px; border-radius: 3px; flex: 1; transition: all 0.3s ease; }
    .bar.fraca { background: #ef4444; width: 33%; }
    .bar.media { background: #f97316; width: 66%; }
    .bar.forte { background: #4CAF50; width: 100%; }
    .strength-label { font-size: 11px; color: #888; min-width: 40px; }

    .form-footer { display: flex; justify-content: flex-end; margin-top: 8px; }
    .form-error, .form-success {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 10px;
      font-size: 13px; margin-bottom: 16px;
    }
    .form-error   { background: #fef2f2; color: #dc2626; }
    .form-success { background: #f0fdf4; color: #166534; }

    .btn-primary {
      background: #4CAF50 !important; color: #fff !important;
      border-radius: 12px !important; height: 44px;
      font-weight: 700 !important; padding: 0 24px !important;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.3s ease !important;
    }
    .btn-primary:hover:not([disabled]) {
      background: #43A047 !important;
      box-shadow: 0 4px 14px rgba(76,175,80,0.35) !important;
    }
    .btn-outline {
      border-color: #1E3A5F !important; color: #1E3A5F !important;
      border-radius: 12px !important; height: 44px;
      font-weight: 700 !important; padding: 0 24px !important;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.3s ease !important;
    }
    .btn-outline:hover:not([disabled]) { background: #f0f4ff !important; }

    @media (max-width: 640px) {
      .form-section { padding: 20px 16px; }
    }
  `],
})
export class ProfileComponent implements OnInit {

  user       = signal<User | null>(null);
  savingInfo = signal(false);
  savingPwd  = signal(false);
  infoError  = '';
  pwdError   = '';
  pwdSuccess = false;
  showCurrent = false;
  showNew     = false;
  strengthClass = '';
  strengthLabel = '';

  infoForm!: FormGroup;
  pwdForm!:  FormGroup;

  initial = () => (this.user()?.name ?? 'U').charAt(0).toUpperCase();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private api: ApiService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser$.getValue();
    this.user.set(u);

    this.infoForm = this.fb.group({
      name:  [u?.name  ?? '', Validators.required],
      phone: [u?.phone ?? ''],
    });

    this.pwdForm = this.fb.group({
      current:  ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm:  ['', Validators.required],
    }, { validators: this.matchPwd });
  }

  matchPwd(g: AbstractControl) {
    const p = g.get('password')?.value;
    const c = g.get('confirm')?.value;
    if (p && c && p !== c) g.get('confirm')?.setErrors({ mismatch: true });
    return null;
  }

  calcStrength(): void {
    const v = this.pwdForm.get('password')?.value ?? '';
    const strong = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(v);
    const medium = /(?=.*[a-zA-Z])(?=.*\d)/.test(v);
    if (v.length >= 8 && strong)      { this.strengthClass = 'forte'; this.strengthLabel = 'Forte'; }
    else if (v.length >= 6 && medium) { this.strengthClass = 'media'; this.strengthLabel = 'Média'; }
    else                              { this.strengthClass = 'fraca'; this.strengthLabel = 'Fraca'; }
  }

  saveInfo(): void {
    if (this.infoForm.invalid) { this.infoForm.markAllAsTouched(); return; }
    this.savingInfo.set(true);
    this.infoError = '';

    this.api.put<User>('/users/me', this.infoForm.value).subscribe({
      next: updated => {
        this.user.set(updated);
        this.auth.currentUser$.next(updated);
        localStorage.setItem('adota_user', JSON.stringify(updated));
        this.savingInfo.set(false);
        this.snack.open('Perfil atualizado! ✅', 'Fechar', { duration: 3000 });
      },
      error: err => {
        this.infoError = err?.error?.message ?? 'Erro ao salvar.';
        this.savingInfo.set(false);
      },
    });
  }

  changePwd(): void {
    this.pwdError = '';
    this.pwdSuccess = false;
    if (this.pwdForm.invalid) { this.pwdForm.markAllAsTouched(); return; }
    this.savingPwd.set(true);

    const { current, password } = this.pwdForm.value;
    this.api.put('/users/me/password', { currentPassword: current, newPassword: password }).subscribe({
      next: () => {
        this.savingPwd.set(false);
        this.pwdSuccess = true;
        this.pwdForm.reset();
      },
      error: err => {
        this.pwdError = err?.error?.message ?? 'Erro ao alterar senha.';
        this.savingPwd.set(false);
      },
    });
  }
}