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
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
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