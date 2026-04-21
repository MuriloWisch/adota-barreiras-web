import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, finalize } from 'rxjs';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';

const PUBLIC_PATHS = ['/auth/register', '/auth/login', '/auth/forgot-password',
                      '/auth/reset-password', '/auth/verify-email'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router  = inject(Router);
  const loading = inject(LoadingService);
  const toast   = inject(ToastService);
  const token   = localStorage.getItem('adota_token');

  const isPublic = PUBLIC_PATHS.some(p => req.url.includes(p));

  const authReq = token && !isPublic
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  loading.show();

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('adota_token');
        localStorage.removeItem('adota_user');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        toast.error('Acesso não autorizado.');
        router.navigate(['/home']);
      } else if (error.status >= 500) {
        toast.error('Erro interno. Tente novamente.');
      }
      return throwError(() => error);
    }),
    finalize(() => loading.hide()),
  );
};