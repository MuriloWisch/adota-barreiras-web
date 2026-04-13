import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { User } from '../../models/user.model';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const raw    = localStorage.getItem('user');

  if (!raw) {
    router.navigate(['/login']);
    return false;
  }

  const user: User = JSON.parse(raw);

  if (user.role !== 'ADMIN') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};