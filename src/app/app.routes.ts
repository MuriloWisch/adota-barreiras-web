import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { adminGuard } from './core/auth/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login',           loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register',        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password',  loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'verify-email',    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'home',      canActivate: [authGuard], loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES) },
  { path: 'animals',   canActivate: [authGuard], loadChildren: () => import('./features/animal/animal.routes').then(m => m.ANIMAL_ROUTES) },
  { path: 'chat',      canActivate: [authGuard], loadChildren: () => import('./features/chat/chat.routes').then(m => m.CHAT_ROUTES) },
  { path: 'adoptions', canActivate: [authGuard], loadChildren: () => import('./features/adoption/adoption.routes').then(m => m.ADOPTION_ROUTES) },
  { path: 'profile',   canActivate: [authGuard], loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES) },
  { path: 'admin',     canActivate: [authGuard, adminGuard], loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  { path: 'my-animals', canActivate: [authGuard], loadComponent: () => import('./features/animal/my-animals/my-animals.component').then(m => m.MyAnimalsComponent) },
{ path: 'my-requests', canActivate: [authGuard], loadComponent: () => import('./features/adoption/my-request/my-request.component').then(m => m.MyRequestsComponent) },
  { path: '**', redirectTo: 'home' },
];