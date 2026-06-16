import { Routes } from '@angular/router';
import { authGuard }  from './core/auth/guards/auth.guard';
import { adminGuard } from './core/auth/guards/admin.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component')
        .then(m => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component')
        .then(m => m.ResetPasswordComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component')
        .then(m => m.VerifyEmailComponent),
  },

  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home.component')
        .then(m => m.HomeComponent),
  },

  {
    path: 'animals/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/animal/animal-form/animal-form.component')
        .then(m => m.AnimalFormComponent),
  },
  {
    path: 'animals/my',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/animal/my-animals/my-animals.component')
        .then(m => m.MyAnimalsComponent),
  },
  {
    path: 'animals/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/animal/animal-detail/animal-detail.component')
        .then(m => m.AnimalDetailComponent),
  },
  {
    path: 'animals/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/animal/animal-form/animal-form.component')
        .then(m => m.AnimalFormComponent),
  },

  {
    path: 'my-requests',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/adoption/my-request/my-request.component')
        .then(m => m.MyRequestsComponent),
  },

  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/chat/chat.component')
        .then(m => m.ChatComponent),
  },
  {
    path: 'chat/:chatId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/chat/chat.component')
        .then(m => m.ChatComponent),
  },

  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component')
        .then(m => m.ProfileComponent),
  },

  {
    path: 'admin',
    canActivate: [authGuard, adminGuard], 
    loadChildren: () => 
      import('./features/admin/admin.routes')
        .then(m => m.ADMIN_ROUTES),
  },

  {
    path: '**',
    redirectTo: 'home',
  },
];