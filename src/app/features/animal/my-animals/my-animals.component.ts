import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { forkJoin } from 'rxjs';

import { AnimalService } from '../../../core/services/animal.service';
import { AdoptionService } from '../../../core/services/adoption.service';
import { Animal, AnimalStatus } from '../../../core/models/animal.model';
import { AdoptionRequest } from '../../../core/models/adoption-request.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface AnimalCard {
  animal: Animal;
  requests: AdoptionRequest[];
  loadingRequests: boolean;
  loadingDelete: boolean;
  actionLoading: Record<number, string>;
}

type StatusFilter = 'ALL' | AnimalStatus;

const STATUS_CONFIG: Record<AnimalStatus, { label: string; icon: string; color: string; bg: string }> = {
  EM_ANALISE: { label: 'Em análise',  icon: 'hourglass_top', color: '#b45309', bg: 'rgba(217, 119, 6, 0.12)' },
  AVAILABLE:  { label: 'Disponível',  icon: 'check_circle',  color: '#047857', bg: 'rgba(5, 150, 105, 0.12)' },
  IN_PROCESS: { label: 'Em processo', icon: 'sync',          color: '#1d4ed8', bg: 'rgba(37, 99, 235, 0.12)' },
  ADOPTED:    { label: 'Adotado',     icon: 'favorite',      color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
};

const ADOPTION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pendente',  color: '#c2410c', bg: 'rgba(234, 88, 12, 0.1)' },
  ACCEPTED: { label: 'Aceita',    color: '#047857', bg: 'rgba(5, 150, 105, 0.1)' },
  REJECTED: { label: 'Rejeitada', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
};

const SPECIES_LABEL: Record<string, string> = { DOG: 'Cachorro', CAT: 'Gato', OTHER: 'Outro' };
const SIZE_LABEL:    Record<string, string> = { SMALL: 'Pequeno', MEDIUM: 'Médio', LARGE: 'Grande' };
const SEX_LABEL:     Record<string, string> = { MALE: 'Macho', FEMALE: 'Fêmea' };
const SPECIES_ICON:  Record<string, string> = { DOG: '🐶', CAT: '🐱', OTHER: '🐾' };

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL',         label: 'Todos' },
  { value: 'AVAILABLE',   label: 'Disponíveis' },
  { value: 'EM_ANALISE',  label: 'Em análise' },
  { value: 'IN_PROCESS',  label: 'Em processo' },
  { value: 'ADOPTED',     label: 'Adotados' },
];

@Component({
  selector: 'app-my-animals',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
  ],
  animations: [
    trigger('listIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(60, [animate('320ms ease', style({ opacity: 1, transform: 'translateY(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
    trigger('drawerIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('280ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('220ms ease', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('backdropIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('180ms ease', style({ opacity: 0 })),
      ]),
    ]),
  ],
  templateUrl: './my-animals.component.html',
  styleUrls: ['./my-animals.component.scss'],
})
export class MyAnimalsComponent implements OnInit {

  readonly filters = FILTER_OPTIONS;

  cards        = signal<AnimalCard[]>([]);
  pageLoading  = signal(true);
  activeFilter = signal<StatusFilter>('ALL');
  panelIndex   = signal<number | null>(null);

  filteredCards = computed(() => {
    const filter = this.activeFilter();
    const all = this.cards();
    if (filter === 'ALL') return all;
    return all.filter(c => c.animal.status === filter);
  });

  stats = computed(() => {
    const all = this.cards();
    const pendingRequests = all.reduce(
      (sum, c) => sum + c.requests.filter(r => r.status === 'PENDING').length,
      0,
    );
    return {
      total:     all.length,
      available: all.filter(c => c.animal.status === 'AVAILABLE').length,
      inProcess: all.filter(c => c.animal.status === 'IN_PROCESS').length,
      pendingRequests,
    };
  });

  activePanel = computed(() => {
    const idx = this.panelIndex();
    return idx !== null ? this.cards()[idx] ?? null : null;
  });

  constructor(
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAnimals();
  }

  loadAnimals(): void {
    this.pageLoading.set(true);
    this.animalService.getMyAnimals().subscribe({
      next: animals => {
        this.cards.set(animals.map(a => this.createCard(a)));
        this.pageLoading.set(false);
        this.prefetchRequests();
      },
      error: () => {
        this.pageLoading.set(false);
        this.snackBar.open('Não foi possível carregar seus animais.', 'Fechar', { duration: 4000 });
      },
    });
  }

  setFilter(filter: StatusFilter): void {
    this.activeFilter.set(filter);
    this.closePanel();
  }

  statusCfg(animal: Animal) {
    return STATUS_CONFIG[animal.status] ?? STATUS_CONFIG.EM_ANALISE;
  }

  adoptionStatusCfg(req: AdoptionRequest) {
    return ADOPTION_STATUS[req.status] ?? ADOPTION_STATUS['PENDING'];
  }

  speciesLabel(species: string) { return SPECIES_LABEL[species] ?? species; }
  sizeLabel(size: string)       { return SIZE_LABEL[size] ?? size; }
  sexLabel(sex: string)         { return SEX_LABEL[sex] ?? sex; }
  speciesIcon(species: string)  { return SPECIES_ICON[species] ?? '🐾'; }

  pendingCount(card: AnimalCard) {
    return card.requests.filter(r => r.status === 'PENDING').length;
  }

  filterCount(filter: StatusFilter): number {
    if (filter === 'ALL') return this.cards().length;
    return this.cards().filter(c => c.animal.status === filter).length;
  }

  openPanel(index: number): void {
    this.panelIndex.set(index);
    const card = this.cards()[index];
    if (!card || card.requests.length || card.loadingRequests) return;

    this.updateCard(index, { loadingRequests: true });
    this.adoptionService.listByAnimal(card.animal.id).subscribe({
      next: reqs => this.updateCard(index, { requests: reqs, loadingRequests: false }),
      error: () => {
        this.updateCard(index, { loadingRequests: false });
        this.snackBar.open('Erro ao carregar solicitações.', 'Fechar', { duration: 3000 });
      },
    });
  }

  closePanel(): void {
    this.panelIndex.set(null);
  }

  refreshPanelRequests(): void {
    const idx = this.panelIndex();
    if (idx === null) return;
    const card = this.cards()[idx];
    if (!card) return;

    this.updateCard(idx, { loadingRequests: true });
    this.adoptionService.listByAnimal(card.animal.id).subscribe({
      next: reqs => this.updateCard(idx, { requests: reqs, loadingRequests: false }),
      error: () => this.updateCard(idx, { loadingRequests: false }),
    });
  }

  acceptRequest(card: AnimalCard, req: AdoptionRequest): void {
    const i = this.cards().indexOf(card);
    this.setActionLoading(i, req.id, 'accept');
    this.adoptionService.accept(req.id).subscribe({
      next: updated => {
        const reqs = card.requests.map(r => r.id === req.id ? updated : r);
        this.updateCard(i, {
          requests: reqs,
          animal: { ...card.animal, status: 'IN_PROCESS' },
          actionLoading: { ...card.actionLoading, [req.id]: '' },
        });
        this.snackBar.open('Solicitação aceita!', 'Fechar', { duration: 3000 });
      },
      error: () => {
        this.setActionLoading(i, req.id, '');
        this.snackBar.open('Erro ao aceitar solicitação.', 'Fechar', { duration: 3000 });
      },
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
      error: () => {
        this.setActionLoading(i, req.id, '');
        this.snackBar.open('Erro ao recusar solicitação.', 'Fechar', { duration: 3000 });
      },
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
          this.updateCard(i, {
            animal: { ...card.animal, status: 'ADOPTED' },
            actionLoading: { ...card.actionLoading, [req.id]: '' },
          });
          this.snackBar.open('Adoção confirmada!', 'Fechar', { duration: 4000 });
        },
        error: () => {
          this.setActionLoading(i, req.id, '');
          this.snackBar.open('Erro ao confirmar adoção.', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  deleteAnimal(card: AnimalCard, index: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:        'Excluir animal',
        message:      `Tem certeza que deseja excluir "${card.animal.name}"? Esta ação não pode ser desfeita.`,
        confirmLabel: 'Excluir',
      },
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.updateCard(index, { loadingDelete: true });
      this.animalService.delete(card.animal.id).subscribe({
        next: () => {
          if (this.panelIndex() === index) this.closePanel();
          this.cards.update(prev => prev.filter((_, idx) => idx !== index));
          this.snackBar.open('Animal excluído.', 'Fechar', { duration: 3000 });
        },
        error: () => {
          this.updateCard(index, { loadingDelete: false });
          this.snackBar.open('Erro ao excluir animal.', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/placeholder-animal.svg';
  }

  cardIndex(card: AnimalCard): number {
    return this.cards().indexOf(card);
  }

  private createCard(animal: Animal): AnimalCard {
    return {
      animal,
      requests: [],
      loadingRequests: false,
      loadingDelete: false,
      actionLoading: {},
    };
  }

  private prefetchRequests(): void {
    const cards = this.cards();
    if (!cards.length) return;

    forkJoin(cards.map(c => this.adoptionService.listByAnimal(c.animal.id))).subscribe({
      next: results => {
        this.cards.update(prev => prev.map((c, i) => ({ ...c, requests: results[i] ?? [] })));
      },
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
