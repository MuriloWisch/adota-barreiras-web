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
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
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