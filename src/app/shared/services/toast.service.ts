import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {

  private base: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  constructor(private snack: MatSnackBar) {}

  success(message: string): void {
    this.snack.open(`✅ ${message}`, 'Fechar', {
      ...this.base,
      panelClass: ['toast-success'],
    });
  }

  error(message: string): void {
    this.snack.open(`❌ ${message}`, 'Fechar', {
      ...this.base,
      duration: 5000,
      panelClass: ['toast-error'],
    });
  }

  info(message: string): void {
    this.snack.open(`ℹ️ ${message}`, 'Fechar', {
      ...this.base,
      panelClass: ['toast-info'],
    });
  }
}