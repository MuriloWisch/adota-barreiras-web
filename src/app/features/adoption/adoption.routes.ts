import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const ADOPTION_ROUTES: Routes = [
  {
    path: 'my',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./my-request/my-request.component').then(m => m.MyRequestsComponent),
  },
];