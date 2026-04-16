import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1>{{ title }}</h1>
      <p *ngIf="subtitle">{{ subtitle }}</p>
      <div class="divider"></div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 32px; }
    h1 { font-size: 28px; font-weight: 700; color: #1E3A5F; }
    p  { color: #666; font-size: 15px; margin-top: 6px; }
    .divider {
      width: 56px; height: 4px;
      background: #4CAF50;
      border-radius: 2px;
      margin-top: 12px;
    }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}