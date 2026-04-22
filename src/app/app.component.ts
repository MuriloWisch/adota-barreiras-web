import { Component } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AuthService } from './core/auth/services/auth.service';
import { LoadingService } from './shared/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterOutlet, MatProgressBarModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <mat-progress-bar
      mode="indeterminate"
      *ngIf="loading.loading$ | async"
      class="global-loader">
    </mat-progress-bar>

    <main [style.padding-top]="'64px'">
      <router-outlet></router-outlet>
    </main>

    <app-footer *ngIf="auth.isLoggedIn()"></app-footer>
  `,
  styles: [`
    main { min-height: calc(100vh - 64px); }
    .global-loader {
      position: fixed; top: 64px; left: 0; right: 0;
      z-index: 999; height: 3px;
    }
    ::ng-deep .global-loader .mdc-linear-progress__bar-inner {
      border-color: #4CAF50 !important;
    }
  `],
})
export class AppComponent {
  constructor(public auth: AuthService, public loading: LoadingService) {}
}