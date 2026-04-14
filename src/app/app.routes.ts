import { Routes } from '@angular/router';
import { authGuard }  from './core/auth/guards/auth.guard';
import { adminGuard } from './core/auth/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    canActivate: [authGuard],
    loadChildren: () => import('../app/features/home/home.routes').then(m => m.HOME_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('../app/features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'animals',
    canActivate: [authGuard],
    loadChildren: () => import('../app/features/animal/animal.routes').then(m => m.ANIMAL_ROUTES),
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadChildren: () => import('../app/features/chat/chat.routes').then(m => m.CHAT_ROUTES),
  },
  {
    path: 'adoptions',
    canActivate: [authGuard],
    loadChildren: () => import('../app/features/adoption/adoption.routes').then(m => m.ADOPTION_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('../app/features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('../app/features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: 'home' },
];