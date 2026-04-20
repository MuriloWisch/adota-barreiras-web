import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/user.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="section-wrap">

      <app-page-header
        title="Usuários da Plataforma"
        subtitle="Gerencie os usuários cadastrados">
      </app-page-header>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar por nome ou email</mat-label>
        <input matInput [formControl]="searchCtrl">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="skeleton-table" *ngIf="loading()">
        <div class="skel skel-row" *ngFor="let s of skeletons"></div>
      </div>

      <div class="table-wrap" *ngIf="!loading()">
        <table mat-table [dataSource]="filtered()" class="mat-elevation-z0">

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Usuário</th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <div class="avatar">{{ u.name?.charAt(0)?.toUpperCase() }}</div>
                <div>
                  <p class="user-name">{{ u.name }}</p>
                  <p class="user-phone">{{ u.phone || '—' }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let u" class="cell-text">{{ u.email }}</td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u">
              <span class="role-badge" [class.admin]="u.role === 'ADMIN'">{{ u.role }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u">
              <span class="status-badge" [class.blocked]="u.blocked">
                <mat-icon>{{ u.blocked ? 'block' : 'check_circle' }}</mat-icon>
                {{ u.blocked ? 'Bloqueado' : 'Ativo' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="since">
            <th mat-header-cell *matHeaderCellDef>Membro desde</th>
            <td mat-cell *matCellDef="let u" class="cell-text">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let u; let i = index">
              <div class="actions-cell">

                <button mat-stroked-button class="btn-block"
                  *ngIf="!u.blocked"
                  [disabled]="rowLoading[u.id] === 'block'"
                  (click)="blockUser(u, i)">
                  <mat-spinner diameter="12" *ngIf="rowLoading[u.id] === 'block'"></mat-spinner>
                  <mat-icon *ngIf="rowLoading[u.id] !== 'block'">block</mat-icon>
                  Bloquear
                </button>

                <button mat-stroked-button class="btn-unblock"
                  *ngIf="u.blocked"
                  [disabled]="rowLoading[u.id] === 'unblock'"
                  (click)="unblockUser(u, i)">
                  <mat-spinner diameter="12" *ngIf="rowLoading[u.id] === 'unblock'"></mat-spinner>
                  <mat-icon *ngIf="rowLoading[u.id] !== 'unblock'">lock_open</mat-icon>
                  Desbloquear
                </button>

              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"
            [class.blocked-row]="row.blocked"></tr>

        </table>

        <div class="empty-table" *ngIf="!filtered().length">
          <mat-icon>people_outline</mat-icon>
          <p>Nenhum usuário encontrado</p>
        </div>

        <mat-paginator
          [length]="totalElements()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)">
        </mat-paginator>

      </div>
    </div>
  `,
  styles: [`
    .section-wrap { padding: 28px; }

    .search-field { width: 100%; max-width: 420px; margin-bottom: 20px; }

    .skeleton-table { display: flex; flex-direction: column; gap: 8px; }
    .skel {
      background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 8px;
    }
    .skel-row { height: 56px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .table-wrap {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    table { width: 100%; }
    th.mat-header-cell {
      font-size: 12px; font-weight: 700;
      color: #888; text-transform: uppercase;
      letter-spacing: 0.4px; padding: 12px 16px !important;
      background: #f8fafc;
    }
    td.mat-cell { padding: 12px 16px !important; border-bottom-color: #fafafa !important; }

    .blocked-row { background: #fff5f5 !important; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #1E3A5F; color: #fff; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
    }
    .user-name  { font-size: 14px; font-weight: 600; color: #1E3A5F; }
    .user-phone { font-size: 11px; color: #aaa; margin-top: 1px; }
    .cell-text  { font-size: 13px; color: #555; }

    .role-badge {
      font-size: 11px; font-weight: 700; padding: 3px 10px;
      border-radius: 20px; background: #f0f0f0; color: #555;
    }
    .role-badge.admin { background: #dbeafe; color: #1e3a8a; }

    .status-badge {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; color: #16a34a;
    }
    .status-badge mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .status-badge.blocked { color: #ef4444; }

    .actions-cell { display: flex; gap: 6px; }
    .btn-block {
      border-color: #fca5a5 !important; color: #ef4444 !important;
      border-radius: 8px !important; font-size: 12px !important; height: 32px;
      display: flex; align-items: center; gap: 4px;
      transition: background 0.2s ease !important;
    }
    .btn-block:hover:not([disabled]) { background: #fef2f2 !important; }
    .btn-unblock {
      border-color: #86efac !important; color: #16a34a !important;
      border-radius: 8px !important; font-size: 12px !important; height: 32px;
      display: flex; align-items: center; gap: 4px;
      transition: background 0.2s ease !important;
    }
    .btn-unblock:hover:not([disabled]) { background: #f0fdf4 !important; }

    .empty-table {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px; gap: 10px; color: #bbb;
    }
    .empty-table mat-icon { font-size: 36px !important; width: 36px !important; height: 36px !important; }
    .empty-table p { font-size: 14px; }

    @media (max-width: 768px) {
      .section-wrap { padding: 16px; }
      td.mat-cell:nth-child(3),
      th.mat-header-cell:nth-child(3),
      td.mat-cell:nth-child(5),
      th.mat-header-cell:nth-child(5) { display: none; }
    }
  `],
})
export class UserManagementComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  columns       = ['name', 'email', 'role', 'status', 'since', 'actions'];
  users         = signal<User[]>([]);
  filtered      = signal<User[]>([]);
  loading       = signal(true);
  totalElements = signal(0);
  pageIndex     = signal(0);
  pageSize      = 10;
  skeletons     = Array(6);
  rowLoading: Record<number, string> = {};
  searchCtrl    = new FormControl('');

  constructor(
    private adminService: AdminService,
    private api: ApiService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(),
    ).subscribe(q => this.applyFilter(q ?? ''));
  }

  load(): void {
    this.loading.set(true);
    this.adminService.listUsers(this.pageIndex()).subscribe({
      next: r => {
        this.users.set(r.content);
        this.filtered.set(r.content);
        this.totalElements.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter(q: string): void {
    const lower = q.toLowerCase();
    this.filtered.set(
      !lower
        ? this.users()
        : this.users().filter(u =>
            u.name?.toLowerCase().includes(lower) ||
            u.email?.toLowerCase().includes(lower)
          )
    );
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize = e.pageSize;
    this.load();
  }

  blockUser(user: User, i: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Bloquear usuário', message: `Bloquear "${user.name}"? Ele não conseguirá mais fazer login.`, confirmLabel: 'Bloquear' },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.setRowLoading(user.id, 'block');
      this.adminService.blockUser(user.id).subscribe({
        next: () => { this.updateUser(i, { blocked: true }); this.snack.open('Usuário bloqueado.', 'Fechar', { duration: 3000 }); },
        error: () => this.setRowLoading(user.id, ''),
      });
    });
  }

  unblockUser(user: User, i: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Desbloquear usuário', message: `Desbloquear "${user.name}"?`, confirmLabel: 'Desbloquear' },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.setRowLoading(user.id, 'unblock');
      this.api.put(`/admin/users/${user.id}/unblock`, {}).subscribe({
        next: () => { this.updateUser(i, { blocked: false }); this.snack.open('Usuário desbloqueado.', 'Fechar', { duration: 3000 }); },
        error: () => this.setRowLoading(user.id, ''),
      });
    });
  }

  private updateUser(i: number, patch: Partial<User>): void {
    this.users.update(prev => prev.map((u, idx) => idx === i ? { ...u, ...patch } : u));
    this.filtered.update(prev => prev.map((u, idx) => idx === i ? { ...u, ...patch } : u));
    this.setRowLoading(patch.blocked !== undefined ? this.filtered()[i]?.id ?? 0 : 0, '');
  }

  private setRowLoading(id: number, action: string): void {
    this.rowLoading = { ...this.rowLoading, [id]: action };
  }
}