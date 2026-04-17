import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AuthService } from './core/auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main [style.padding-top]="'64px'">
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="showFooter"></app-footer>
  `,
  styles: [`
    main { min-height: calc(100vh - 64px); }
  `],
})
export class AppComponent {
  constructor(public auth: AuthService) {}
  get showFooter() { return this.auth.isLoggedIn(); }
}