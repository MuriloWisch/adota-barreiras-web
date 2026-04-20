import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { trigger, transition, style, animate } from '@angular/animations';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, RouterOutlet,
    MatIconModule, MatButtonModule, MatBadgeModule,
  ],
  animations: [
    trigger('drawerAnim', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('250ms ease', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease', style({ transform: 'translateX(-100%)' })),
      ]),
    ]),
  ],
  template: `
    <div class="admin-wrap">

      <!-- ══ SIDEBAR desktop ══ -->
      <aside class="sidebar desktop-only">
        <ng-container *ngTemplateOutlet="sidebarContent"></ng-container>
      </aside>

      <!-- ══ MOBILE top bar ══ -->
      <div class="mobile-topbar mobile-only">
        <button mat-icon-button (click)="drawerOpen = true">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="mobile-title">Painel Admin</span>
      </div>

      <!-- ══ DRAWER mobile ══ -->
      <div class="drawer-overlay" *ngIf="drawerOpen" (click)="drawerOpen = false"></div>
      <aside class="drawer mobile-only" *ngIf="drawerOpen" @drawerAnim>
        <div class="drawer-header">
          <span>⚙️ Admin</span>
          <button mat-icon-button (click)="drawerOpen = false"><mat-icon>close</mat-icon></button>
        </div>
        <ng-container *ngTemplateOutlet="sidebarContent"></ng-container>
      </aside>

      <!-- ══ CONTENT ══ -->
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>

    </div>

    <!-- Sidebar template -->
    <ng-template #sidebarContent>
      <div class="sidebar-brand">
        <span class="brand-icon">⚙️</span>
        <span class="brand-text">Painel Admin</span>
      </div>

      <nav class="sidebar-nav">

        <a class="nav-item"
          routerLink="/admin/suspects"
          routerLinkActive="active"
          (click)="drawerOpen = false">
          <mat-icon>schedule</mat-icon>
          <span>Animais Suspeitos</span>
          <span class="nav-badge" *ngIf="suspectCount() > 0">{{ suspectCount() }}</span>
        </a>

        <a class="nav-item"
          routerLink="/admin/users"
          routerLinkActive="active"
          (click)="drawerOpen = false">
          <mat-icon>people</mat-icon>
          <span>Gerenciar Usuários</span>
        </a>

      </nav>
    </ng-template>
  `,
  styles: [`
    .admin-wrap {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 240px;
      flex-shrink: 0;
      background: #fff;
      border-right: 1px solid #f0f0f0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 24px 20px 16px;
      font-size: 16px; font-weight: 700; color: #1E3A5F;
      border-bottom: 1px solid #f0f0f0;
    }
    .brand-icon { font-size: 22px; }

    .sidebar-nav { padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 14px; border-radius: 12px;
      font-size: 14px; font-weight: 500; color: #555;
      text-decoration: none; cursor: pointer;
      transition: all 0.2s ease; position: relative;
    }
    .nav-item:hover { background: #f0fdf4; color: #4CAF50; }
    .nav-item.active { background: #f0fdf4; color: #4CAF50; font-weight: 700; }
    .nav-item mat-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; }

    .nav-badge {
      margin-left: auto;
      background: #ef4444; color: #fff;
      font-size: 10px; font-weight: 700;
      padding: 1px 7px; border-radius: 12px;
    }

    /* Content */
    .admin-content { flex: 1; overflow-y: auto; background: #f8fafc; }

    /* Mobile */
    .desktop-only { display: flex; }
    .mobile-only  { display: none; }

    .mobile-topbar {
      position: fixed; top: 64px; left: 0; right: 0;
      height: 52px; background: #fff;
      border-bottom: 1px solid #f0f0f0;
      display: flex; align-items: center; gap: 12px;
      padding: 0 12px; z-index: 100;
    }
    .mobile-title { font-size: 16px; font-weight: 700; color: #1E3A5F; }

    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      z-index: 200;
    }
    .drawer {
      position: fixed; top: 0; left: 0; bottom: 0; width: 260px;
      background: #fff; z-index: 300;
      box-shadow: 4px 0 24px rgba(0,0,0,0.15);
      display: flex; flex-direction: column;
    }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #f0f0f0;
      font-size: 16px; font-weight: 700; color: #1E3A5F;
    }

    @media (max-width: 768px) {
      .desktop-only { display: none; }
      .mobile-only  { display: flex; }
      .admin-content { padding-top: 52px; }
    }
  `],
})
export class AdminComponent implements OnInit {
  suspectCount = signal(0);
  drawerOpen   = false;

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.loadSuspectCount();
  }

  loadSuspectCount(): void {
    this.adminService.listSuspectAnimals(0).subscribe({
      next: r => this.suspectCount.set(r.totalElements),
    });
  }
}