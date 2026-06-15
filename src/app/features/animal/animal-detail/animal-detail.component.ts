import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { AnimalService } from '../../../core/services/animal.service';
import { AdoptionService } from '../../../core/services/adoption.service';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Animal } from '../../../core/models/animal.model';
import { MapComponent } from '../../../shared/components/map/map.component';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const BARREIRAS_LAT = -12.1539;
const BARREIRAS_LNG = -44.9986;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Disponível', color: '#fff', bg: '#4CAF50' },
  EM_ANALISE: { label: 'Em análise', color: '#fff', bg: '#FF9800' },
  IN_PROCESS: { label: 'Em processo', color: '#fff', bg: '#2196F3' },
  ADOPTED: { label: 'Adotado', color: '#fff', bg: '#9E9E9E' },
};

const SPECIES_MAP: Record<string, string> = { DOG: '🐶 Cão', CAT: '🐱 Gato', OTHER: '🐾 Outro' };
const SIZE_MAP: Record<string, string> = { SMALL: '📏 Pequeno', MEDIUM: '📏 Médio', LARGE: '📏 Grande' };
const SEX_MAP: Record<string, string> = { MALE: '♂ Macho', FEMALE: '♀ Fêmea' };

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatTooltipModule, MatProgressSpinnerModule,
    MapComponent, ScrollAnimationDirective,
  ],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('400ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('imgSwap', [
      transition('* => *', [
        style({ opacity: 0 }),
        animate('250ms ease', style({ opacity: 1 })),
      ]),
    ]),
  ],
  templateUrl: './animal-detail.component.html',
  styleUrls: ['./animal-detail.component.scss'],
})
export class AnimalDetailComponent implements OnInit {

  animal = signal<Animal | null>(null);
  activeIndex = signal(0);
  pageLoading = true;
  adoptLoading = false;
  adoptDone = false;
  chatLoading = false;
  actionError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private chatService: ChatService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.animalService.getById(id).subscribe({
      next: a => { this.animal.set(a); this.pageLoading = false; },
      error: () => {
        this.snackBar.open('Animal não encontrado.', 'Fechar', { duration: 3000 });
        this.router.navigate(['/home']);
      },
    });
  }


  get images(): ReturnType<typeof signal<string[]>> {
    const imgs = this.animal()?.images?.map(i => i.imageUrl) ?? [];
    return signal(imgs.length ? imgs : ['assets/placeholder-animal.jpg']);
  }

  activeImage = computed(() => {
    const imgs = this.animal()?.images?.map(i => i.imageUrl) ?? [];
    const list = imgs.length ? imgs : ['assets/placeholder-animal.jpg'];
    return list[this.activeIndex()] ?? list[0];
  });

  get statusConfig() { return STATUS_CONFIG[this.animal()?.status ?? 'EM_ANALISE']; }
  get speciesLabel() { return SPECIES_MAP[this.animal()?.species ?? ''] ?? ''; }
  get sizeLabel() { return SIZE_MAP[this.animal()?.size ?? ''] ?? ''; }
  get sexLabel() { return SEX_MAP[this.animal()?.sex ?? ''] ?? ''; }
  get donorInitial() { return (this.animal()?.owner?.name ?? 'U').charAt(0).toUpperCase(); }

  get isOwner(): boolean {
    const me = this.auth.currentUser$.getValue();
    return !!me && me.id === this.animal()?.owner?.id;
  }

  get isAvailable(): boolean { return this.animal()?.status === 'AVAILABLE'; }

  get mapLat(): number { return this.animal()?.latitude ?? BARREIRAS_LAT; }
  get mapLng(): number { return this.animal()?.longitude ?? BARREIRAS_LNG; }

  get statusInfoMessage(): string {
    const s = this.animal()?.status;
    if (s === 'IN_PROCESS') return 'Este animal já está em processo de adoção.';
    if (s === 'ADOPTED') return 'Este animal já foi adotado. 🎉';
    return 'Este animal não está disponível no momento.';
  }


  setImage(i: number): void { this.activeIndex.set(i); }

  requestAdoption(): void {
    this.adoptLoading = true;
    this.actionError = '';

    this.adoptionService.request(this.animal()!.id).subscribe({
      next: () => { this.adoptDone = true; this.adoptLoading = false; },
      error: (err) => {
        this.actionError = err?.error?.message ?? 'Erro ao enviar solicitação.';
        this.adoptLoading = false;
      },
    });
  }

  startChat(): void {
    this.chatLoading = true;
    this.actionError = '';

    this.chatService.startChat(this.animal()!.id).subscribe({
      next: (chat) => this.router.navigate(['/chat', chat.id]),
      error: (err) => {
        this.actionError = err?.error?.message ?? 'Erro ao iniciar conversa.';
        this.chatLoading = false;
      },
    });
  }

  editAnimal(): void {
    this.router.navigate(['/animals', this.animal()!.id, 'edit']);
  }

  deleteAnimal(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir animal',
        message: `Tem certeza que deseja excluir "${this.animal()!.name}"? Esta ação não pode ser desfeita.`,
        confirmLabel: 'Excluir',
      },
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.animalService.delete(this.animal()!.id).subscribe({
        next: () => {
          this.snackBar.open('Animal excluído com sucesso.', 'Fechar', { duration: 3000 });
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message ?? 'Erro ao excluir.', 'Fechar', { duration: 3000 });
        },
      });
    });
  }
}