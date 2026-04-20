import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

import { AdminService } from '../../core/services/admin.service';
import { Animal } from '../../core/models/animal.model';
import { User } from '../../core/models/user.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule,
    MatTabsModule, MatProgressSpinnerModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  animations: [
    trigger('stagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(60, [animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="page-wrap">

      <app-page-header
        title="Painel Administrativo"
        subtitle="Gerencie animais em análise e usuários da plataforma">
      </app-page-header>

      <div class="stats-row">
        <div class="stat-card">
          <mat-icon class="stat-icon orange">schedule</mat-icon>
          <div>
            <p class="stat-num">{{ suspectAnimals().length }}</p>
            <p class="stat-label">Em análise</p>
          </div>
        </div>
        <div class="stat-card">
          <mat-icon class="stat-icon blue">people</mat-icon>
          <div>
            <p class="stat-num">{{ users().length }}</p>
            <p class="stat-label">Usuários</p>
          </div>
        </div>
        <div class="stat-card">
          <mat-icon class="stat-icon red">block</mat-icon>
          <div>
            <p class="stat-num">{{ blockedCount() }}</p>
            <p class="stat-label">Bloqueados</p>
          </div>
        </div>
      </div>

      <mat-tab-group animationDuration="200ms" class="admin-tabs">

        <mat-tab label="🐾 Animais em Análise">
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingAnimals()"></app-loading-spinner>

            <div class="empty-tab" *ngIf="!loadingAnimals() && !suspectAnimals().length">
              <span>✅</span><p>Nenhum animal aguardando análise.</p>
            </div>

            <div class="animal-grid" [@stagger]="suspectAnimals().length" *ngIf="!loadingAnimals()">

              <div class="animal-card" *ngFor="let animal of suspectAnimals(); let i = index">

                <div class="card-img">
                  <img
                    [src]="animal.images[0].imageUrl || 'assets/placeholder-animal.jpg'"
                    [alt]="animal.name">
                  <span class="analysis-badge">⏳ Em análise</span>
                </div>

                <div class="card-body">
                  <h3>{{ animal.name }}</h3>
                  <div class="card-tags">
                    <span class="tag">{{ animal.species }}</span>
                    <span class="tag">{{ animal.size }}</span>
                  </div>
                  <p class="owner-info">
                    <mat-icon class="info-icon">person</mat-icon>
                    {{ animal.owner.name }}
                  </p>
                  <p class="owner-info">
                    <mat-icon class="info-icon">place</mat-icon>
                    {{ animal.address || 'Sem endereço' }}
                  </p>
                </div>

                <div class="card-actions">
                  <button mat-raised-button class="btn-approve"
                    [disabled]="animalLoading[animal.id] === 'approve'"
                    (click)="approveAnimal(animal, i)">
                    <mat-spinner diameter="14" *ngIf="animalLoading[animal.id] === 'approve'"></mat-spinner>
                    <mat-icon *ngIf="animalLoading[animal.id] !== 'approve'">check</mat-icon>
                    Aprovar
                  </button>
                  <button mat-stroked-button class="btn-remove"
                    [disabled]="!!animalLoading[animal.id]"
                    (click)="removeAnimal(animal, i)">
                    <mat-spinner diameter="14" *ngIf="animalLoading[animal.id] === 'remove'"></mat-spinner>
                    <mat-icon *ngIf="animalLoading[animal.id] !== 'remove'">delete</mat-icon>
                    Remover
                  </button>
                  <a mat-stroked-button class="btn-view" [routerLink]="['/animals', animal.id]">
                    <mat-icon>visibility</mat-icon>
                  </a>
                </div>

              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="👥 Usuários">
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingUsers()"></app-loading-spinner>

            <div class="users-table" *ngIf="!loadingUsers()">

              <div class="table-header">
                <span>Usuário</span>
                <span>E-mail</span>
                <span>Role</span>
                <span>Status</span>
                <span>Ação</span>
              </div>

              <div class="table-row" *ngFor="let user of users(); let i = index">

                <div class="user-cell">
                  <div class="user-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
                  <span class="user-name">{{ user.name }}</span>
                </div>

                <span class="cell-email">{{ user.email }}</span>

                <span class="role-badge" [class.admin]="user.role === 'ADMIN'">
                  {{ user.role }}
                </span>

                <span class="status-badge-user" [class.blocked]="user.blocked">
                  <mat-icon>{{ user.blocked ? 'block' : 'check_circle' }}</mat-icon>
                  {{ user.blocked ? 'Bloqueado' : 'Ativo' }}
                </span>

                <button mat-stroked-button class="btn-block"
                  [disabled]="user.blocked || userLoading[user.id] === 'block'"
                  (click)="blockUser(user, i)">
                  <mat-spinner diameter="14" *ngIf="userLoading[user.id] === 'block'"></mat-spinner>
                  <mat-icon *ngIf="userLoading[user.id] !== 'block'">block</mat-icon>
                  {{ user.blocked ? 'Bloqueado' : 'Bloquear' }}
                </button>

              </div>

              <div class="empty-tab" *ngIf="!users().length">
                <span>👥</span><p>Nenhum usuário encontrado.</p>
              </div>

            </div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-wrap { max-width: 1100px; margin: 32px auto; padding: 0 24px 64px; }

    .stats-row {
      display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
    }
    .stat-card {
      flex: 1; min-width: 160px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      padding: 20px; display: flex; align-items: center; gap: 16px;
    }
    .stat-icon { font-size: 32px !important; width: 32px !important; height: 32px !important; }
    .stat-icon.orange { color: #f97316; }
    .stat-icon.blue   { color: #3b82f6; }
    .stat-icon.red    { color: #ef4444; }
    .stat-num   { font-size: 28px; font-weight: 800; color: #1E3A5F; line-height: 1; }
    .stat-label { font-size: 12px; color: #888; margin-top: 4px; }

    .admin-tabs { }
    .tab-content { padding: 20px 0; }

    .animal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
    }

    .animal-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 14px rgba(0,0,0,0.07);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .animal-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(0,0,0,0.11); }

    .card-img { position: relative; aspect-ratio: 4/3; overflow: hidden; }
    .card-img img { width: 100%; height: 100%; object-fit: cover; }
    .analysis-badge {
      position: absolute; top: 10px; left: 10px;
      background: #fef3c7; color: #92400e;
      font-size: 11px; font-weight: 700;
      padding: 3px 10px; border-radius: 20px;
    }

    .card-body { padding: 14px 16px; }
    h3 { font-size: 16px; font-weight: 700; color: #1E3A5F; margin-bottom: 8px; }
    .card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .tag { background: #f0fdf4; color: #2e7d32; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px; }
    .owner-info {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: #666; margin-top: 4px;
    }
    .info-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; color: #4CAF50; }

    .card-actions {
      display: flex; gap: 8px; padding: 12px 14px;
      border-top: 1px solid #f0f0f0; flex-wrap: wrap;
    }
    .btn-approve {
      flex: 1; background: #4CAF50 !important; color: #fff !important;
      border-radius: 8px !important; font-size: 12px !important; height: 34px;
      display: flex; align-items: center; gap: 4px;
      transition: all 0.3s ease !important;
    }
    .btn-approve:hover:not([disabled]) { background: #43A047 !important; }
    .btn-remove {
      border-color: #fca5a5 !important; color: #ef4444 !important;
      border-radius: 8px !important; font-size: 12px !important; height: 34px;
      display: flex; align-items: center; gap: 4px;
      transition: all 0.3s ease !important;
    }
    .btn-remove:hover:not([disabled]) { background: #fef2f2 !important; }
    .btn-view {
      border-color: #1E3A5F !important; color: #1E3A5F !important;
      border-radius: 8px !important; width: 34px; height: 34px; min-width: 34px !important;
      display: flex; align-items: center; justify-content: center;
    }

    .users-table {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .table-header {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
      padding: 12px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #f0f0f0;
      font-size: 12px; font-weight: 700;
      color: #888; text-transform: uppercase; letter-spacing: 0.4px;
      gap: 12px;
    }
    .table-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
      padding: 14px 20px;
      border-bottom: 1px solid #fafafa;
      align-items: center; gap: 12px;
      transition: background 0.2s ease;
    }
    .table-row:hover { background: #f9fafb; }
    .table-row:last-child { border-bottom: none; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #1E3A5F; color: #fff; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
    }
    .user-name  { font-size: 14px; font-weight: 600; color: #1E3A5F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cell-email { font-size: 13px; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .role-badge {
      font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
      background: #f0f0f0; color: #555; display: inline-block;
    }
    .role-badge.admin { background: #dbeafe; color: #1e3a8a; }

    .status-badge-user {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; color: #16a34a;
    }
    .status-badge-user mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .status-badge-user.blocked { color: #ef4444; }

    .btn-block {
      border-color: #fca5a5 !important; color: #ef4444 !important;
      border-radius: 8px !important; font-size: 12px !important; height: 32px;
      display: flex; align-items: center; gap: 4px;
      transition: all 0.3s ease !important;
    }
    .btn-block:hover:not([disabled]) { background: #fef2f2 !important; }
    .btn-block[disabled] { border-color: #e5e7eb !important; color: #d1d5db !important; }

    .empty-tab {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; gap: 10px; color: #aaa; text-align: center;
    }
    .empty-tab span { font-size: 40px; }
    .empty-tab p { font-size: 14px; }

    @media (max-width: 768px) {
      .table-header { display: none; }
      .table-row { grid-template-columns: 1fr 1fr; gap: 10px; }
      .cell-email { display: none; }
    }
  `],
})
export class AdminComponent implements OnInit {

  suspectAnimals = signal<Animal[]>([]);
  users          = signal<User[]>([]);
  loadingAnimals = signal(true);
  loadingUsers   = signal(true);

  animalLoading: Record<number, string> = {};
  userLoading:   Record<number, string> = {};

  blockedCount = computed(() => this.users().filter(u => u.blocked).length);

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.adminService.listSuspectAnimals(0).subscribe({
      next: r  => { this.suspectAnimals.set(r.content); this.loadingAnimals.set(false); },
      error: () => this.loadingAnimals.set(false),
    });
    this.adminService.listUsers(0).subscribe({
      next: r  => { this.users.set(r.content); this.loadingUsers.set(false); },
      error: () => this.loadingUsers.set(false),
    });
  }

  approveAnimal(animal: Animal, i: number): void {
    this.animalLoading = { ...this.animalLoading, [animal.id]: 'approve' };
    this.adminService.approveAnimal(animal.id).subscribe({
      next: () => {
        this.suspectAnimals.update(prev => prev.filter((_, idx) => idx !== i));
        this.animalLoading = { ...this.animalLoading, [animal.id]: '' };
        this.snackBar.open('Animal aprovado! ✅', 'Fechar', { duration: 3000 });
      },
      error: () => {
        this.animalLoading = { ...this.animalLoading, [animal.id]: '' };
        this.snackBar.open('Erro ao aprovar.', 'Fechar', { duration: 3000 });
      },
    });
  }

  removeAnimal(animal: Animal, i: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:        'Remover animal',
        message:      `Remover "${animal.name}" da plataforma? O dono será notificado.`,
        confirmLabel: 'Remover',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.animalLoading = { ...this.animalLoading, [animal.id]: 'remove' };
      this.adminService.removeAnimal(animal.id).subscribe({
        next: () => {
          this.suspectAnimals.update(prev => prev.filter((_, idx) => idx !== i));
          this.animalLoading = { ...this.animalLoading, [animal.id]: '' };
          this.snackBar.open('Animal removido.', 'Fechar', { duration: 3000 });
        },
        error: () => {
          this.animalLoading = { ...this.animalLoading, [animal.id]: '' };
        },
      });
    });
  }

  blockUser(user: User, i: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:        'Bloquear usuário',
        message:      `Bloquear "${user.name}"? Ele não conseguirá mais fazer login.`,
        confirmLabel: 'Bloquear',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.userLoading = { ...this.userLoading, [user.id]: 'block' };
      this.adminService.blockUser(user.id).subscribe({
        next: updated => {
          this.users.update(prev => prev.map((u, idx) => idx === i ? { ...u, blocked: true } : u));
          this.userLoading = { ...this.userLoading, [user.id]: '' };
          this.snackBar.open('Usuário bloqueado.', 'Fechar', { duration: 3000 });
        },
        error: () => { this.userLoading = { ...this.userLoading, [user.id]: '' }; },
      });
    });
  }
}