import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  const user  = auth.currentUser$.getValue();

  if (!token || !user) {
    localStorage.removeItem('adota_token');
    localStorage.removeItem('adota_user');
    router.navigate(['/login']);
    return false;
  }

  return true;
};