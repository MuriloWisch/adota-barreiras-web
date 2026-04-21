import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const toast  = inject(ToastService);

  const user = auth.currentUser$.getValue();

  if (!user || user.role !== 'ADMIN') {
    toast.error('Acesso restrito a administradores.');
    router.navigate(['/home']);
    return false;
  }

  return true;
};