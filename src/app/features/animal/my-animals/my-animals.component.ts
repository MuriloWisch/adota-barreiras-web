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
  templateUrl: './my-animals.component.html',
  styleUrls: ['./my-animals.component.scss'],
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