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
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
    scrolled = false;
    drawerOpen = false;
    notifOpen = false;
    notifications: Notification[] = [];

    // dark mode state
    darkMode = false;

    constructor(
        public auth: AuthService,
        private notifService: NotificationService,
    ) { }

    ngOnInit(): void {
        // load notifications
        this.notifService.notifications$.subscribe(n => (this.notifications = n));

        // websocket when user present
        this.auth.currentUser$.subscribe(user => {
            if (user?.id) {
                this.notifService.connectWebSocket(user.id);
            }
        });

        // Initialize dark mode from localStorage or system preference
        try {
            const stored = localStorage.getItem('darkMode');
            if (stored !== null) {
                this.darkMode = stored === 'true';
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.darkMode = true;
            }
        } catch (e) {
            this.darkMode = false;
        }
        this.applyDarkClass(this.darkMode);
    }

    // Toggle notifications dropdown
    toggleNotif(): void {
        this.notifOpen = !this.notifOpen;
    }

    closeMenus(): void {
        this.drawerOpen = false;
        this.notifOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        if (!target.closest('.notif-wrap')) this.notifOpen = false;
    }

    // Toggle dark mode and persist preference
    toggleDarkMode(): void {
        this.darkMode = !this.darkMode;
        try { localStorage.setItem('darkMode', String(this.darkMode)); } catch (e) { /* ignore */ }
        this.applyDarkClass(this.darkMode);
    }

    private applyDarkClass(enabled: boolean): void {
        const root = document.documentElement || document.getElementsByTagName('html')[0];
        if (enabled) root.classList.add('dark'); else root.classList.remove('dark');
    }

   logout(): void {
  this.drawerOpen   = false;
  this.notifOpen    = false;
  this.notifService.disconnect();
  this.auth.logout();
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

}
