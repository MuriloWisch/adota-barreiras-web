import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
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

        <div *ngIf="loading" class="state-box">
          <mat-spinner diameter="56"></mat-spinner>
          <p>Verificando seu e-mail...</p>
        </div>

        <div *ngIf="!loading && success" class="state-box">
          <span class="icon">✅</span>
          <h2>E-mail verificado!</h2>
          <p>Sua conta está ativa. Faça login para continuar.</p>
          <a mat-raised-button class="btn-primary" routerLink="/login">Ir para login</a>
        </div>

        <div *ngIf="!loading && !success" class="state-box">
          <span class="icon">❌</span>
          <h2>Token inválido</h2>
          <p>{{ errorMsg }}</p>
          <a mat-raised-button class="btn-primary" routerLink="/login">Voltar ao login</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .auth-bg { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#f0fdf4,#e8f4fd); padding:16px; }
    .auth-card { background:#fff; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.10); padding:56px 40px; width:100%; max-width:420px; }
    .state-box { display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center; }
    .icon { font-size:56px; }
    h2 { color:#1E3A5F; font-size:22px; font-weight:700; }
    p { color:#888; font-size:14px; }
    .btn-primary { background:#4CAF50!important; color:#fff!important; border-radius:12px!important; padding:0 32px; height:44px; font-weight:600; transition:all 0.3s ease; margin-top:8px; }
    .btn-primary:hover { background:#43A047!important; box-shadow:0 6px 20px rgba(76,175,80,0.35)!important; }
  `],
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  errorMsg = '';

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    this.auth.verifyEmail(token).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => { this.errorMsg = err?.error?.message ?? 'Token inválido ou expirado.'; this.loading = false; },
    });
  }
}