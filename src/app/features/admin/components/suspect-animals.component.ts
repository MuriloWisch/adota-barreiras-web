import { Component, OnInit, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';

import { AdminService } from '../../../core/services/admin.service';
import { Animal } from '../../../core/models/animal.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-animal-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './animal-detail-dialog.component.html',
  styleUrls: ['./animal-detail-dialog.component.scss'],
})
export class AnimalDetailDialogComponent {
  activeIdx = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public animal: Animal,
    private dialogRef: MatDialogRef<AnimalDetailDialogComponent>
  ) {}

  activeImg() {
    return this.animal.images?.[this.activeIdx]?.imageUrl ?? 'assets/placeholder-animal.jpg';
  }

  close(action: string) {
    this.dialogRef.close(action);
  }
}

@Component({
  selector: 'app-suspect-animals',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
  ],
  animations: [
    trigger('cardLeave', [
      transition(':leave', [
        animate('300ms ease', style({ opacity: 0, transform: 'scale(0.9)' })),
      ]),
    ]),
  ],
  templateUrl: './suspect-animals.component.html',
  styleUrls: ['./suspect-animals.component.scss'],
})
export class SuspectAnimalsComponent implements OnInit {

  animals       = signal<Animal[]>([]);
  loading       = signal(true);
  totalElements = signal(0);
  pageIndex     = signal(0);
  pageSize      = 12;
  actionLoading: Record<number, string> = {};

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminService.listSuspectAnimals(this.pageIndex()).subscribe({
      next: r => {
        this.animals.set(r.content);
        this.totalElements.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Erro ao carregar animais.', 'Fechar', { duration: 3000 });
      },
    });
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.load();
  }

  openDetail(animal: Animal, i: number): void {
    const ref = this.dialog.open(AnimalDetailDialogComponent, {
      data: animal,
      maxWidth: '680px',
      width: '95vw',
    });

    ref.afterClosed().subscribe(action => {
      if (action === 'approve') this.approve(animal, i);
      if (action === 'remove')  this.remove(animal, i);
    });
  }

  approve(animal: Animal, i: number): void {
    this.setLoading(animal.id, 'approving');
    this.adminService.approveAnimal(animal.id).subscribe({
      next: () => {
        this.snack.open(`${animal.name} aprovado com sucesso!`, 'OK', { duration: 3000 });
        this.removeCard(i);
      },
      error: () => this.snack.open('Erro ao aprovar.', 'Fechar')
    });
  }

  remove(animal: Animal, i: number): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: { 
        title: 'Remover Anúncio', 
        message: `Tem certeza que deseja remover o anúncio de ${animal.name}?` 
      }
    });

    confirmRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.adminService.removeAnimal(animal.id).subscribe({
          next: () => {
            this.snack.open('Anúncio removido.', 'OK', { duration: 3000 });
            this.removeCard(i);
          },
          error: () => this.snack.open('Erro ao remover.', 'Fechar')
        });
      }
    });
  }

  private removeCard(i: number): void {
    this.animals.update(prev => prev.filter((_, idx) => idx !== i));
    this.totalElements.update(t => t - 1);
  }

  private setLoading(id: number, action: string): void {
    this.actionLoading = { ...this.actionLoading, [id]: action };
  }
}