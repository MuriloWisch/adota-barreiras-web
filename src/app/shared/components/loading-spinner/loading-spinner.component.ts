import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div [class]="overlay ? 'overlay' : 'inline-spinner'">
      <mat-spinner [diameter]="diameter" color="primary"></mat-spinner>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(255,255,255,0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    }
    .inline-spinner {
      display: flex; justify-content: center;
      padding: 32px 0;
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() diameter = 48;
}