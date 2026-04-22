import { Component, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [
        CommonModule, RouterLink, RouterLinkActive,
        MatButtonModule, MatIconModule, MatBadgeModule,
        MatMenuModule, MatSidenavModule, MatListModule, MatDividerModule,
    ],
    animations: [
        trigger('dropdownAnim', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-8px)' }),
                animate('200ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
            transition(':leave', [
                animate('150ms ease', style({ opacity: 0, transform: 'translateY(-8px)' })),
            ]),
        ]),
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
    <nav class="navbar" [class.scrolled]="scrolled">
      <div class="nav-inner">

        <a routerLink="/home" class="logo">
          <span class="logo-paw">🐾</span>
          <span class="logo-text">Adota Barreiras</span>
        </a>

        <div class="nav-links desktop-only">

          <ng-container *ngIf="!isLoggedIn">
            <a routerLink="/login"    mat-button class="nav-btn">Entrar</a>
            <a routerLink="/register" mat-raised-button class="btn-register">Cadastrar</a>
          </ng-container>

          <ng-container *ngIf="isLoggedIn">
            <a routerLink="/home"      mat-button routerLinkActive="active-link">Início</a>
            <a routerLink="/animals/my" mat-button routerLinkActive="active-link">Meus Animais</a>
            <a routerLink="/adoptions/my" mat-button routerLinkActive="active-link">Solicitações</a>
            <a routerLink="/chat"      mat-button routerLinkActive="active-link">Chat</a>
            <a routerLink="/admin"     mat-button routerLinkActive="active-link" *ngIf="isAdmin">Admin</a>

            <div class="notif-wrap">
              <button mat-icon-button (click)="toggleNotif()" class="notif-btn">
                <mat-icon
                  [matBadge]="unreadCount || null"
                  matBadgeColor="warn"
                  matBadgeSize="small">
                  notifications
                </mat-icon>
              </button>

              <div class="notif-dropdown" *ngIf="notifOpen" @dropdownAnim>
                <div class="notif-header">
                  <strong>Notificações</strong>
                  <span class="notif-count" *ngIf="unreadCount">{{ unreadCount }} novas</span>
                </div>
                <div class="notif-empty" *ngIf="!notifications.length">Nenhuma notificação</div>
                <div
                  class="notif-item"
                  *ngFor="let n of notifications"
                  [class.unread]="!n.read">
                  <span class="notif-dot" *ngIf="!n.read"></span>
                  <p>{{ n.content }}</p>
                </div>
              </div>
            </div>

            <button mat-icon-button [matMenuTriggerFor]="userMenu" class="avatar-btn">
              <div class="avatar">{{ userInitial }}</div>
            </button>

            <mat-menu #userMenu="matMenu" class="user-menu">
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon> Perfil
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()" class="logout-item">
                <mat-icon>logout</mat-icon> Sair
              </button>
            </mat-menu>

          </ng-container>
        </div>

        <button mat-icon-button class="hamburger mobile-only" (click)="drawerOpen = true">
          <mat-icon>menu</mat-icon>
        </button>

      </div>
    </nav>

    <div class="drawer-overlay" *ngIf="drawerOpen" (click)="drawerOpen = false"></div>

    <div class="drawer" *ngIf="drawerOpen" @drawerAnim>
      <div class="drawer-header">
        <span class="logo-paw">🐾</span>
        <span class="logo-text">Adota Barreiras</span>
        <button mat-icon-button (click)="drawerOpen = false" class="drawer-close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <mat-nav-list>
        <ng-container *ngIf="!isLoggedIn">
          <a mat-list-item routerLink="/login"    (click)="drawerOpen = false">Entrar</a>
          <a mat-list-item routerLink="/register" (click)="drawerOpen = false">Cadastrar</a>
        </ng-container>

        <ng-container *ngIf="isLoggedIn">
          <a mat-list-item routerLink="/home"         (click)="drawerOpen = false">🏠 Início</a>
          <a mat-list-item routerLink="/animals/my"   (click)="drawerOpen = false">🐾 Meus Animais</a>
          <a mat-list-item routerLink="/adoptions/my" (click)="drawerOpen = false">📋 Solicitações</a>
          <a mat-list-item routerLink="/chat"         (click)="drawerOpen = false">💬 Chat</a>
          <a mat-list-item routerLink="/admin"        (click)="drawerOpen = false" *ngIf="isAdmin">⚙️ Admin</a>
          <a mat-list-item routerLink="/profile"      (click)="drawerOpen = false">👤 Perfil</a>
          <mat-divider></mat-divider>
          <a mat-list-item (click)="logout()" class="logout-item">🚪 Sair</a>
        </ng-container>
      </mat-nav-list>
    </div>
  `,
    styles: [`
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      background: #fff;
      border-bottom: 1px solid transparent;
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .navbar.scrolled {
      box-shadow: 0 2px 20px rgba(0,0,0,0.10);
      border-color: #f0f0f0;
    }
    .nav-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 64px;
    }
    .logo {
      display: flex; align-items: center; gap: 8px;
      text-decoration: none;
    }
    .logo-paw  { font-size: 24px; }
    .logo-text { font-size: 18px; font-weight: 700; color: #1E3A5F; }
    .nav-links { display: flex; align-items: center; gap: 4px; }
    .desktop-only { display: flex; }
    .mobile-only  { display: none; }

    @media (max-width: 768px) {
      .desktop-only { display: none; }
      .mobile-only  { display: flex; }
    }

    .active-link { color: #4CAF50 !important; font-weight: 600; }
    .btn-register {
      background: #4CAF50 !important; color: #fff !important;
      border-radius: 10px !important; font-weight: 600 !important;
      transition: all 0.3s ease !important;
    }
    .btn-register:hover {
      background: #43A047 !important;
      box-shadow: 0 4px 14px rgba(76,175,80,0.35) !important;
    }

    .notif-wrap { position: relative; }
    .notif-dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      background: #fff; border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.14);
      width: 320px; max-height: 380px; overflow-y: auto;
      z-index: 200;
    }
    .notif-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid #f0f0f0;
    }
    .notif-header strong { font-size: 14px; color: #1E3A5F; }
    .notif-count { font-size: 12px; color: #4CAF50; font-weight: 600; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px; border-bottom: 1px solid #fafafa;
      transition: background 0.2s ease;
    }
    .notif-item:hover { background: #f9fafb; }
    .notif-item.unread { background: #f0fdf4; }
    .notif-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4CAF50; flex-shrink: 0; margin-top: 4px;
    }
    .notif-item p { font-size: 13px; color: #444; line-height: 1.4; }
    .notif-empty { padding: 24px; text-align: center; font-size: 13px; color: #aaa; }

    .avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: #1E3A5F; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
    }
    .logout-item { color: #ef4444 !important; }

    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      z-index: 1100;
    }
    .drawer {
      position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
      background: #fff; z-index: 1200;
      box-shadow: 4px 0 24px rgba(0,0,0,0.15);
    }
    .drawer-header {
      display: flex; align-items: center; gap: 8px;
      padding: 16px;
    }
    .drawer-close { margin-left: auto; }
  `],
})
export class NavbarComponent implements OnInit {
    scrolled = false;
    drawerOpen = false;
    notifOpen = false;
    notifications: Notification[] = [];

    constructor(
        public auth: AuthService,
        private notifService: NotificationService,
    ) { }

    ngOnInit(): void {
        this.notifService.notifications$.subscribe(n => (this.notifications = n));

        this.auth.currentUser$.subscribe(user => {
        if (user?.id) {
      this.notifService.connectWebSocket(user.id);}});
    }

    get isLoggedIn() { return this.auth.isLoggedIn(); }
    get isAdmin() { return this.auth.isAdmin(); }
    get unreadCount() { return this.notifications.filter(n => !n.read).length; }
    get userInitial() {
        const name = this.auth.currentUser$.getValue()?.name ?? 'U';
        return name.charAt(0).toUpperCase();
    }

    @HostListener('window:scroll')
    onScroll(): void {
        this.scrolled = window.scrollY > 10;
    }

    toggleNotif(): void {
        this.notifOpen = !this.notifOpen;
    }

    @HostListener('document:click', ['$event'])
    onDocClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        if (!target.closest('.notif-wrap')) this.notifOpen = false;
    }

   logout(): void {
  this.drawerOpen   = false;
  this.notifOpen    = false;
  this.notifService.disconnect();
  this.auth.logout();
}
}