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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
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
