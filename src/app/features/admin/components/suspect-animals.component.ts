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
  template: `
    <div class="dialog-wrap">
      <h2 mat-dialog-title>{{ animal.name }}</h2>
      <mat-dialog-content>
        <div class="gallery">
          <img [src]="activeImg()" [alt]="animal.name" class="main-img">
          <div class="thumbs" *ngIf="animal.images.length > 1">
            <img
              *ngFor="let img of animal.images; let i = index"
              [src]="img.imageUrl" class="thumb"
              [class.active]="activeIdx === i"
              (click)="activeIdx = i">
          </div>
        </div>

        <div class="info-grid">
          <div class="info-row"><strong>Espécie:</strong> {{ animal.species }}</div>
          <div class="info-row"><strong>Porte:</strong> {{ animal.size }}</div>
          <div class="info-row"><strong>Sexo:</strong> {{ animal.sex }}</div>
          <div class="info-row"><strong>Idade:</strong> {{ animal.age }} anos</div>
          <div class="info-row"><strong>Endereço:</strong> {{ animal.address }}</div>
          <div class="info-row"><strong>Doador:</strong> {{ animal.owner.name }}</div>
          <div class="info-row full"><strong>Descrição:</strong> {{ animal.description }}</div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Fechar</button>
        <button mat-raised-button class="btn-approve" (click)="close('approve')">✅ Aprovar</button>
        <button mat-stroked-button class="btn-remove" (click)="close('remove')">🗑 Remover</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-wrap { min-width: min(600px, 90vw); }
    .gallery { margin-bottom: 16px; }
    .main-img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px; }
    .thumbs { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
    .thumb.active { border-color: #4CAF50; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-row { font-size: 13px; color: #555; }
    .info-row.full { grid-column: 1/-1; }
    .info-row strong { color: #1E3A5F; }
    .btn-approve { background: #4CAF50 !important; color: #fff !important; border-radius: 8px !important; }
    .btn-remove  { border-color: #ef4444 !important; color: #ef4444 !important; border-radius: 8px !important; }
    mat-dialog-actions { gap: 8px; }
  `],
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
  template: `
    <app-page-header 
      title="Animais sob Suspeita" 
      subtitle="Analise denúncias e anúncios marcados como suspeitos pelo sistema.">
    </app-page-header>

    <div class="admin-content">
      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div *ngIf="!loading()" class="fade-in">
        <div class="empty-state" *ngIf="animals().length === 0">
          <mat-icon>verified_user</mat-icon>
          <p>Tudo limpo! Não há animais pendentes de revisão.</p>
        </div>

        <div class="cards-grid">
          <div class="animal-card" *ngFor="let animal of animals(); let i = index" [@cardLeave]>
            <div class="card-image">
              <img [src]="animal.images[0].imageUrl || 'assets/placeholder-animal.jpg'" [alt]="animal.name">
              <div class="badge-suspect">Pendente</div>
            </div>
            
            <div class="card-body">
              <h3>{{ animal.name }}</h3>
              <p><mat-icon>location_on</mat-icon> {{ animal.address }}</p>
              
              <div class="card-footer">
                <button mat-flat-button color="primary" (click)="openDetail(animal, i)">
                  <mat-icon>visibility</mat-icon> Revisar
                </button>
              </div>
            </div>
          </div>
        </div>

        <mat-paginator 
          [length]="totalElements()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          (page)="onPage($event)"
          aria-label="Selecionar página">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .admin-content { padding: 24px; max-width: 1200px; margin: 0 auto; }
    
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .animal-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: transform 0.2s;
    }

    .card-image { position: relative; height: 180px; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    
    .badge-suspect {
      position: absolute; top: 12px; right: 12px;
      background: #fef2f2; color: #ef4444;
      padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
      border: 1px solid #fecaca;
    }

    .card-body { padding: 16px; }
    .card-body h3 { margin: 0 0 8px; color: #1e293b; font-size: 18px; }
    .card-body p { 
      display: flex; align-items: center; gap: 4px;
      color: #64748b; font-size: 13px; margin: 0;
    }
    .card-body mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .card-footer { margin-top: 16px; }
    .card-footer button { width: 100%; border-radius: 10px; }

    .empty-state {
      text-align: center; padding: 60px; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }

    .fade-in { animation: fadeIn 0.5s ease-in; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
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