import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptors/jwt.interceptors';
import { AuthService } from './core/auth/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([jwtInterceptor]), withFetch()),
    provideAnimations(),
    provideNativeDateAdapter(),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.loadUserFromStorage(),
      deps: [AuthService],
      multi: true,
    },
  ],
};