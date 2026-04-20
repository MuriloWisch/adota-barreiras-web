import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

import { AnimalService } from '../../../core/services/animal.service';
import { AdoptionService } from '../../../core/services/adoption.service';
import { Animal } from '../../../core/models/animal.model';
import { AdoptionRequest } from '../../../core/models/adoption-request.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface AnimalCard {
  animal: Animal;
  requests: AdoptionRequest[];
  showRequests: boolean;
  loadingRequests: boolean;
  loadingDelete: boolean;
  actionLoading: Record<number, string>;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  EM_ANALISE: { label: 'Em análise',  icon: 'schedule',       color: '#92400e', bg: '#fef3c7' },
  AVAILABLE:  { label: 'Disponível',  icon: 'check_circle',   color: '#166534', bg: '#dcfce7' },
  IN_PROCESS: { label: 'Em processo', icon: 'autorenew',       color: '#1e3a8a', bg: '#dbeafe' },
  ADOPTED:    { label: 'Adotado',     icon: 'favorite',        color: '#6b7280', bg: '#f3f4f6' },
};

const ADOPTION_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'Pendente',  color: '#f97316' },
  ACCEPTED: { label: 'Aceita',    color: '#16a34a' },
  REJECTED: { label: 'Rejeitada', color: '#6b7280' },
};

@Component({
  selector: 'app-my-animals',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  animations: [
    trigger('stagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(24px)' }),
          stagger(80, [animate('350ms ease', style({ opacity: 1, transform: 'translateY(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
    trigger('expand', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: '0px', overflow: 'hidden' }),
        animate('300ms ease', style({ opacity: 1, maxHeight: '600px' })),
      ]),
      transition(':leave', [
        animate('250ms ease', style({ opacity: 0, maxHeight: '0px' })),
      ]),
    ]),
  ],
  template: `
    <div class="page-wrap">

      <div class="header-row">
        <app-page-header
          title="Meus Animais"
          subtitle="Gerencie os animais que você cadastrou">
        </app-page-header>
        <button mat-raised-button class="btn-add" routerLink="/animals/new">
          <mat-icon>add</mat-icon> Cadastrar Animal
        </button>
      </div>

      <app-loading-spinner *ngIf="pageLoading()"></app-loading-spinner>

      <div class="empty-state" *ngIf="!pageLoading() && !cards().length">
        <span class="empty-icon">🐾</span>
        <h3>Nenhum animal cadastrado</h3>
        <p>Você ainda não cadastrou nenhum animal para adoção.</p>
        <button mat-raised-button class="btn-add" routerLink="/animals/new">
          <mat-icon>add</mat-icon> Cadastrar meu primeiro animal
        </button>
      </div>

      <div class="grid" [@stagger]="cards().length" *ngIf="!pageLoading() && cards().length">

        <div class="animal-card" *ngFor="let card of cards(); let i = index">

          <div class="card-img-wrap">
            <img
              [src]="card.animal.images[0].imageUrl || 'assets/placeholder-animal.jpg'"
              [alt]="card.animal.name">
            <div class="status-badge" [style.background]="statusCfg(card.animal).bg" [style.color]="statusCfg(card.animal).color">
              <mat-icon class="badge-icon">{{ statusCfg(card.animal).icon }}</mat-icon>
              {{ statusCfg(card.animal).label }}
            </div>
            <div class="pending-badge" *ngIf="pendingCount(card) > 0">
              {{ pendingCount(card) }}
            </div>
          </div>

          <div class="card-body">
            <h3>{{ card.animal.name }}</h3>
            <div class="card-tags">
              <span class="tag">{{ card.animal.species }}</span>
              <span class="tag">{{ card.animal.size }}</span>
              <span class="tag">{{ card.animal.sex }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button mat-stroked-button class="btn-edit" [routerLink]="['/animals', card.animal.id, 'edit']">
              <mat-icon>edit</mat-icon> Editar
            </button>

            <button mat-stroked-button class="btn-requests" (click)="toggleRequests(card, i)">
              <mat-icon>list_alt</mat-icon>
              Solicitações
              <span class="req-count" *ngIf="card.requests.length">{{ card.requests.length }}</span>
            </button>

            <button mat-stroked-button class="btn-delete" [disabled]="card.loadingDelete" (click)="deleteAnimal(card, i)">
              <mat-spinner diameter="14" *ngIf="card.loadingDelete"></mat-spinner>
              <mat-icon *ngIf="!card.loadingDelete">delete</mat-icon>
            </button>
          </div>

          <div class="requests-panel" *ngIf="card.showRequests" @expand>

            <div class="requests-loading" *ngIf="card.loadingRequests">
              <mat-spinner diameter="24"></mat-spinner>
            </div>

            <div class="no-requests" *ngIf="!card.loadingRequests && !card.requests.length">
              Nenhuma solicitação ainda.
            </div>

            <div class="request-item" *ngFor="let req of card.requests">
              <div class="req-info">
                <div class="req-avatar">{{ req.requester.name.charAt(0).toUpperCase() }}</div>
                <div class="req-text">
                  <span class="req-name">{{ req.requester.name }}</span>
                  <span class="req-date">{{ req.createdAt | date:'dd/MM/yyyy' }}</span>
                </div>
                <span class="req-status" [style.color]="adoptionStatusCfg(req).color">
                  {{ adoptionStatusCfg(req).label }}
                </span>
              </div>

              <div class="req-actions" *ngIf="req.status === 'PENDING'">
                <button mat-raised-button class="btn-accept"
                  [disabled]="card.actionLoading[req.id]"
                  (click)="acceptRequest(card, req)">
                  <mat-spinner diameter="14" *ngIf="card.actionLoading[req.id] === 'accept'"></mat-spinner>
                  <span *ngIf="card.actionLoading[req.id] !== 'accept'">Aceitar</span>
                </button>
                <button mat-stroked-button class="btn-reject"
                  [disabled]="!!card.actionLoading[req.id]"
                  (click)="rejectRequest(card, req)">
                  <mat-spinner diameter="14" *ngIf="card.actionLoading[req.id] === 'reject'"></mat-spinner>
                  <span *ngIf="card.actionLoading[req.id] !== 'reject'">Recusar</span>
                </button>
              </div>

              <div class="req-actions" *ngIf="req.status === 'ACCEPTED'">
                <button mat-raised-button class="btn-confirm"
                  [disabled]="card.actionLoading[req.id] === 'confirm'"
                  (click)="confirmAdoption(card, req)">
                  <mat-spinner diameter="14" *ngIf="card.actionLoading[req.id] === 'confirm'"></mat-spinner>
                  <span *ngIf="card.actionLoading[req.id] !== 'confirm'">✅ Confirmar Adoção</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width: 1100px; margin: 32px auto; padding: 0 24px 64px; }

    .header-row {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
    }
    .btn-add {
      background: #4CAF50 !important; color: #fff !important;
      border-radius: 12px !important; font-weight: 600 !important;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease !important;
    }
    .btn-add:hover { background: #43A047 !important; box-shadow: 0 4px 14px rgba(76,175,80,0.35) !important; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 80px 24px; gap: 12px; text-align: center;
    }
    .empty-icon { font-size: 64px; }
    h3 { font-size: 20px; font-weight: 700; color: #1E3A5F; }
    .empty-state p { font-size: 14px; color: #888; }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 600px)  { .grid { grid-template-columns: 1fr; } }

    .animal-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: flex; flex-direction: column;
    }
    .animal-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,0.12); }

    .card-img-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; }
    .card-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }

    .status-badge {
      position: absolute; top: 10px; left: 10px;
      font-size: 11px; font-weight: 700; padding: 3px 10px;
      border-radius: 20px; display: flex; align-items: center; gap: 4px;
    }
    .badge-icon { font-size: 12px !important; width: 12px !important; height: 12px !important; }

    .pending-badge {
      position: absolute; top: 10px; right: 10px;
      background: #ef4444; color: #fff;
      font-size: 11px; font-weight: 700;
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }

    .card-body { padding: 14px 16px; flex: 1; }
    .card-body h3 { font-size: 16px; font-weight: 700; color: #1E3A5F; margin-bottom: 8px; }
    .card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { background:#f0fdf4; color:#2e7d32; font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; }

    .card-footer {
      display: flex; gap: 6px; padding: 12px 14px;
      border-top: 1px solid #f0f0f0;
      flex-wrap: wrap;
    }
    .btn-edit {
      border-color: #1E3A5F !important; color: #1E3A5F !important;
      border-radius: 8px !important; font-size: 12px !important; height: 34px;
      display: flex; align-items: center; gap: 4px;
      transition: all 0.3s ease !important;
    }
    .btn-edit:hover { background: #f0f4ff !important; }
    .btn-requests {
      flex: 1; border-color: #9ca3af !important; color: #555 !important;
      border-radius: 8px !important; font-size: 12px !important; height: 34px;
      display: flex; align-items: center; gap: 4px; position: relative;
    }
    .req-count {
      background: #ef4444; color: #fff; border-radius: 10px;
      font-size: 10px; padding: 1px 6px; font-weight: 700;
    }
    .btn-delete {
      border-color: #fca5a5 !important; color: #ef4444 !important;
      border-radius: 8px !important; width: 34px; height: 34px;
      min-width: 34px !important; display: flex; align-items: center; justify-content: center;
      transition: all 0.3s ease !important;
    }
    .btn-delete:hover:not([disabled]) { background: #fef2f2 !important; }

    .requests-panel {
      border-top: 1px solid #f0f0f0;
      background: #fafafa;
      overflow: hidden;
    }
    .requests-loading, .no-requests {
      display: flex; justify-content: center; align-items: center;
      padding: 20px; font-size: 13px; color: #aaa;
    }

    .request-item {
      padding: 12px 14px;
      border-bottom: 1px solid #f0f0f0;
      display: flex; flex-direction: column; gap: 10px;
    }
    .request-item:last-child { border-bottom: none; }

    .req-info { display: flex; align-items: center; gap: 10px; }
    .req-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: #1E3A5F; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .req-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .req-name { font-size: 13px; font-weight: 600; color: #1E3A5F; }
    .req-date { font-size: 11px; color: #aaa; }
    .req-status { font-size: 11px; font-weight: 700; }

    .req-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-accept {
      background: #4CAF50 !important; color: #fff !important;
      border-radius: 8px !important; font-size: 12px !important; height: 32px;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-reject {
      border-color: #ef4444 !important; color: #ef4444 !important;
      border-radius: 8px !important; font-size: 12px !important; height: 32px;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-reject:hover:not([disabled]) { background: #fef2f2 !important; }
    .btn-confirm {
      background: #1E3A5F !important; color: #fff !important;
      border-radius: 8px !important; font-size: 12px !important; height: 32px;
      display: flex; align-items: center; gap: 6px;
    }
  `],
})
export class MyAnimalsComponent implements OnInit {

  cards      = signal<AnimalCard[]>([]);
  pageLoading = signal(true);

  constructor(
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.animalService.getMyAnimals().subscribe({
      next: animals => {
        this.cards.set(animals.map(a => ({
          animal: a, requests: [], showRequests: false,
          loadingRequests: false, loadingDelete: false, actionLoading: {},
        })));
        this.pageLoading.set(false);
      },
      error: () => this.pageLoading.set(false),
    });
  }

  statusCfg(animal: Animal)         { return STATUS_CONFIG[animal.status] ?? STATUS_CONFIG['EM_ANALISE']; }
  adoptionStatusCfg(req: AdoptionRequest) { return ADOPTION_STATUS[req.status] ?? ADOPTION_STATUS['PENDING']; }
  pendingCount(card: AnimalCard)     { return card.requests.filter(r => r.status === 'PENDING').length; }

  toggleRequests(card: AnimalCard, i: number): void {
    if (card.showRequests) {
      this.updateCard(i, { showRequests: false });
      return;
    }
    this.updateCard(i, { showRequests: true, loadingRequests: true });
    this.adoptionService.listByAnimal(card.animal.id).subscribe({
      next: reqs => this.updateCard(i, { requests: reqs, loadingRequests: false }),
      error: ()   => this.updateCard(i, { loadingRequests: false }),
    });
  }

  acceptRequest(card: AnimalCard, req: AdoptionRequest): void {
    const i = this.cards().indexOf(card);
    this.setActionLoading(i, req.id, 'accept');
    this.adoptionService.accept(req.id).subscribe({
      next: updated => {
        const reqs = card.requests.map(r => r.id === req.id ? updated : r);
        this.updateCard(i, { requests: reqs, actionLoading: { ...card.actionLoading, [req.id]: '' } });
        this.snackBar.open('Solicitação aceita!', 'Fechar', { duration: 3000 });
      },
      error: () => { this.setActionLoading(i, req.id, ''); this.snackBar.open('Erro ao aceitar.', 'Fechar', { duration: 3000 }); },
    });
  }

  rejectRequest(card: AnimalCard, req: AdoptionRequest): void {
    const i = this.cards().indexOf(card);
    this.setActionLoading(i, req.id, 'reject');
    this.adoptionService.reject(req.id).subscribe({
      next: updated => {
        const reqs = card.requests.map(r => r.id === req.id ? updated : r);
        this.updateCard(i, { requests: reqs, actionLoading: { ...card.actionLoading, [req.id]: '' } });
        this.snackBar.open('Solicitação recusada.', 'Fechar', { duration: 3000 });
      },
      error: () => { this.setActionLoading(i, req.id, ''); },
    });
  }

  confirmAdoption(card: AnimalCard, req: AdoptionRequest): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:        'Confirmar adoção',
        message:      `Confirmar que ${req.requester?.name} adotou ${card.animal.name}? O status do animal será atualizado para Adotado.`,
        confirmLabel: 'Confirmar',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      const i = this.cards().indexOf(card);
      this.setActionLoading(i, req.id, 'confirm');
      this.adoptionService.confirm(req.id).subscribe({
        next: () => {
          const updatedAnimal = { ...card.animal, status: 'ADOPTED' as any };
          this.updateCard(i, { animal: updatedAnimal, actionLoading: { ...card.actionLoading, [req.id]: '' } });
          this.snackBar.open('Adoção confirmada! 🎉', 'Fechar', { duration: 4000 });
        },
        error: () => { this.setActionLoading(i, req.id, ''); },
      });
    });
  }

  deleteAnimal(card: AnimalCard, i: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:        'Excluir animal',
        message:      `Tem certeza que deseja excluir "${card.animal.name}"?`,
        confirmLabel: 'Excluir',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.updateCard(i, { loadingDelete: true });
      this.animalService.delete(card.animal.id).subscribe({
        next: () => {
          this.cards.update(prev => prev.filter((_, idx) => idx !== i));
          this.snackBar.open('Animal excluído.', 'Fechar', { duration: 3000 });
        },
        error: () => { this.updateCard(i, { loadingDelete: false }); },
      });
    });
  }

  private updateCard(i: number, patch: Partial<AnimalCard>): void {
    this.cards.update(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  }

  private setActionLoading(i: number, reqId: number, action: string): void {
    this.cards.update(prev => prev.map((c, idx) =>
      idx === i ? { ...c, actionLoading: { ...c.actionLoading, [reqId]: action } } : c
    ));
  }
}