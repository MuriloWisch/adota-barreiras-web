import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptors/jwt.interceptors';
import { AuthService } from './core/auth/services/auth.service';

function initAuth(authService: AuthService): () => void {
  return () => authService.loadUserFromStorage();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations(),
    provideNativeDateAdapter(),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};