import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth   = inject(AuthService);
  const user   = auth.currentUser$.getValue();

  if (!user || user.role !== 'ADMIN') {
    return router.createUrlTree(['/home']);
  }

  return true;
};