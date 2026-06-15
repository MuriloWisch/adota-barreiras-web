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
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
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
