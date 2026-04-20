import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin.components').then(m => m.AdminComponent),
    children: [
      { path: '', redirectTo: 'suspects', pathMatch: 'full' },
      
      {
        path: 'suspects',
        loadComponent: () => import('./components/suspect-animals.component').then(m => m.SuspectAnimalsComponent),
      },

      {
        path: 'users',
        loadComponent: () => import('./components/user-management.component').then(m => m.UserManagementComponent),
      },
    ],
  },
];