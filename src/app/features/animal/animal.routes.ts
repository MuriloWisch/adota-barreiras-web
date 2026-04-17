import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const ANIMAL_ROUTES: Routes = [
  {
    path: 'my',
    canActivate: [authGuard],
    loadComponent: () => import('./my-animals/my-animals.component').then(m => m.MyAnimalsComponent),
  },
 {
    path: 'new',
    canActivate: [authGuard],
    loadComponent: () => import('./animal-form/animal-form.component').then(m => m.AnimalFormComponent),
  },
  {
    path: ':id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./animal-form/animal-form.component').then(m => m.AnimalFormComponent),
  },
  {
    path: ':id',
    canActivate: [authGuard],
    loadComponent: () => import('./animal-detail/animal-detail.component').then(m => m.AnimalDetailComponent),
  },
];