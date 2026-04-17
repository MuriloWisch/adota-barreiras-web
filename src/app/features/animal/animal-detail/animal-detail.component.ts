import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  AVAILABLE:  { label: 'Disponível',   color: '#fff',    bg: '#4CAF50' },
  EM_ANALISE: { label: 'Em análise',   color: '#fff',    bg: '#FF9800' },
  IN_PROCESS: { label: 'Em processo',  color: '#fff',    bg: '#2196F3' },
  ADOPTED:    { label: 'Adotado',      color: '#fff',    bg: '#9E9E9E' },
};

const SPECIES_MAP: Record<string, string> = { DOG: '🐶 Cão', CAT: '🐱 Gato', OTHER: '🐾 Outro' };
const SIZE_MAP:    Record<string, string> = { SMALL: '📏 Pequeno', MEDIUM: '📏 Médio', LARGE: '📏 Grande' };
const SEX_MAP:     Record<string, string> = { MALE: '♂ Macho', FEMALE: '♀ Fêmea' };

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
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
  template: `
    <div class="skeleton-wrap" *ngIf="pageLoading">
      <div class="skel skel-gallery"></div>
      <div class="detail-layout">
        <div class="skel-left">
          <div class="skel skel-title"></div>
          <div class="skel skel-chips"></div>
          <div class="skel skel-desc"></div>
          <div class="skel skel-desc short"></div>
        </div>
        <div class="skel skel-map"></div>
      </div>
    </div>

    <div class="page-wrap" *ngIf="!pageLoading && animal()">

      <div class="gallery-section" @fadeSlideUp>

        <div class="main-img-wrap">
          <img
            [src]="activeImage()"
            [alt]="animal()!.name"
            class="main-img"
            [@imgSwap]="activeImage()"
          />
          <span
            class="status-badge"
            [style.background]="statusConfig.bg"
            [style.color]="statusConfig.color">
            {{ statusConfig.label }}
          </span>
        </div>

        <div class="thumbnails" *ngIf="images().length > 1">
          <div
            class="thumb"
            *ngFor="let img of images(); let i = index"
            [class.active]="activeIndex() === i"
            (click)="setImage(i)">
            <img [src]="img" [alt]="'Foto ' + (i + 1)">
          </div>
        </div>

      </div>

      <div class="detail-layout">

        <div class="detail-left">

          <div appScrollAnimation>
            <h1 class="animal-name">{{ animal()!.name }}</h1>

            <div class="chips-row">
              <span class="chip">{{ speciesLabel }}</span>
              <span class="chip">{{ sizeLabel }}</span>
              <span class="chip">{{ sexLabel }}</span>
              <span class="chip" *ngIf="animal()!.age != null">
                🎂 {{ animal()!.age }} ano{{ animal()!.age !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <div class="section" appScrollAnimation *ngIf="animal()!.description">
            <h3 class="section-title">Sobre</h3>
            <p class="description">{{ animal()!.description }}</p>
          </div>

          <div class="section donor-card" appScrollAnimation>
            <h3 class="section-title">Sobre o doador</h3>
            <div class="donor-row">
              <div class="donor-avatar">{{ donorInitial }}</div>
              <div>
                <p class="donor-name">{{ animal()!.owner?.name }}</p>
                <p class="donor-since">
                  Membro desde {{ animal()!.owner?.createdAt | date:'MMMM yyyy':'':'pt-BR' }}
                </p>
              </div>
            </div>
          </div>

          <div class="section actions" appScrollAnimation>

            <ng-container *ngIf="isAvailable && !isOwner">
              <button
                mat-raised-button
                class="btn-adopt"
                [disabled]="adoptLoading || adoptDone"
                (click)="requestAdoption()">
                <mat-spinner diameter="18" *ngIf="adoptLoading"></mat-spinner>
                <mat-icon *ngIf="!adoptLoading && !adoptDone">favorite</mat-icon>
                <span>{{ adoptDone ? '✅ Solicitação Enviada' : 'Quero Adotar' }}</span>
              </button>

              <button
                mat-stroked-button
                class="btn-chat"
                [disabled]="chatLoading"
                (click)="startChat()">
                <mat-spinner diameter="18" *ngIf="chatLoading"></mat-spinner>
                <mat-icon *ngIf="!chatLoading">chat</mat-icon>
                <span>Falar com Doador</span>
              </button>

              <p class="action-error" *ngIf="actionError">{{ actionError }}</p>
            </ng-container>

            <ng-container *ngIf="isAvailable && isOwner">
              <button mat-stroked-button class="btn-edit" (click)="editAnimal()">
                <mat-icon>edit</mat-icon> Editar Animal
              </button>
              <button mat-stroked-button class="btn-delete" (click)="deleteAnimal()">
                <mat-icon>delete</mat-icon> Excluir Animal
              </button>
            </ng-container>

            <ng-container *ngIf="!isAvailable">
              <div class="status-info-badge">
                <mat-icon>info</mat-icon>
                <span>{{ statusInfoMessage }}</span>
              </div>
            </ng-container>

          </div>

        </div>

        <div class="detail-right" appScrollAnimation>

          <div class="map-card">
            <h3 class="section-title">Localização aproximada</h3>
            <div class="map-wrap">
              <app-map
                [animals]="[animal()!]"
                [centerLat]="mapLat"
                [centerLng]="mapLng"
                [radius]="0.5">
              </app-map>
            </div>
            <div class="address-row" *ngIf="animal()!.address">
              <mat-icon class="addr-icon">place</mat-icon>
              <span>{{ animal()!.address }}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .skeleton-wrap { max-width: 1100px; margin: 32px auto; padding: 0 24px; }
    .skel {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 12px;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .skel-gallery { height: 360px; margin-bottom: 32px; }
    .detail-layout { display: flex; gap: 32px; }
    .skel-left { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .skel-title { height: 40px; width: 50%; }
    .skel-chips { height: 32px; width: 80%; }
    .skel-desc  { height: 80px; }
    .skel-desc.short { height: 48px; width: 70%; }
    .skel-map  { width: 40%; height: 300px; }

    .page-wrap { max-width: 1100px; margin: 32px auto; padding: 0 24px 64px; }

    .gallery-section { margin-bottom: 36px; }
    .main-img-wrap {
      position: relative; border-radius: 20px; overflow: hidden;
      aspect-ratio: 16/7;
    }
    .main-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .status-badge {
      position: absolute; top: 16px; left: 16px;
      font-size: 12px; font-weight: 700;
      padding: 5px 14px; border-radius: 24px;
      letter-spacing: 0.4px;
    }
    .thumbnails {
      display: flex; gap: 10px; margin-top: 12px;
      overflow-x: auto; padding-bottom: 4px;
    }
    .thumb {
      width: 80px; height: 60px; flex-shrink: 0;
      border-radius: 10px; overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.3s ease, transform 0.2s ease;
    }
    .thumb:hover   { transform: translateY(-2px); }
    .thumb.active  { border-color: #4CAF50; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }

    .detail-layout { display: flex; gap: 36px; align-items: flex-start; }
    .detail-left  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 28px; }
    .detail-right { width: 38%; flex-shrink: 0; }

    .animal-name { font-size: 32px; font-weight: 800; color: #1E3A5F; margin-bottom: 14px; }
    .chips-row   { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      background: #f0fdf4; color: #2e7d32;
      font-size: 13px; font-weight: 600;
      padding: 6px 14px; border-radius: 24px;
    }

    .section { display: flex; flex-direction: column; gap: 12px; }
    .section-title {
      font-size: 16px; font-weight: 700;
      color: #1E3A5F; margin-bottom: 4px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e8f5e9;
    }
    .description { font-size: 15px; color: #555; line-height: 1.7; }

    .donor-card { background: #f8fafc; border-radius: 14px; padding: 16px; }
    .donor-row  { display: flex; align-items: center; gap: 14px; }
    .donor-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: #1E3A5F; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    }
    .donor-name  { font-size: 15px; font-weight: 600; color: #1E3A5F; }
    .donor-since { font-size: 12px; color: #999; margin-top: 2px; }

    .actions { flex-direction: row !important; flex-wrap: wrap; gap: 12px !important; align-items: center; }
    .btn-adopt {
      background: #4CAF50 !important; color: #fff !important;
      border-radius: 12px !important; height: 48px; font-size: 15px !important;
      font-weight: 700 !important; padding: 0 28px !important;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.3s ease !important;
    }
    .btn-adopt:hover:not([disabled]) {
      background: #43A047 !important;
      box-shadow: 0 6px 20px rgba(76,175,80,0.35) !important;
      transform: translateY(-1px);
    }
    .btn-chat {
      border-color: #1E3A5F !important; color: #1E3A5F !important;
      border-radius: 12px !important; height: 48px; font-size: 15px !important;
      font-weight: 600 !important; padding: 0 24px !important;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.3s ease !important;
    }
    .btn-chat:hover:not([disabled]) { background: #f0f4ff !important; }
    .btn-edit {
      border-color: #4CAF50 !important; color: #4CAF50 !important;
      border-radius: 12px !important; height: 44px; font-size: 14px !important;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease !important;
    }
    .btn-delete {
      border-color: #ef4444 !important; color: #ef4444 !important;
      border-radius: 12px !important; height: 44px; font-size: 14px !important;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease !important;
    }
    .btn-edit:hover  { background: #f0fdf4 !important; }
    .btn-delete:hover { background: #fef2f2 !important; }
    .action-error { font-size: 13px; color: #ef4444; width: 100%; }

    .status-info-badge {
      display: flex; align-items: center; gap: 8px;
      background: #f8fafc; border-radius: 12px;
      padding: 12px 16px; color: #666; font-size: 14px;
      border: 1px solid #e2e8f0;
    }

    .map-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      overflow: hidden; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .map-wrap { height: 260px; border-radius: 12px; overflow: hidden; }
    .address-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #666;
    }
    .addr-icon { font-size: 16px; color: #4CAF50; }

    @media (max-width: 768px) {
      .detail-layout { flex-direction: column; }
      .detail-right  { width: 100%; }
      .animal-name   { font-size: 24px; }
      .main-img-wrap { aspect-ratio: 4/3; }
      .actions { flex-direction: column !important; }
      .btn-adopt, .btn-chat { width: 100%; justify-content: center; }
    }
  `],
})
export class AnimalDetailComponent implements OnInit {

  animal     = signal<Animal | null>(null);
  activeIndex = signal(0);
  pageLoading = true;
  adoptLoading = false;
  adoptDone    = false;
  chatLoading  = false;
  actionError  = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private chatService: ChatService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.animalService.getById(id).subscribe({
      next: a  => { this.animal.set(a); this.pageLoading = false; },
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

  get statusConfig()  { return STATUS_CONFIG[this.animal()?.status ?? 'EM_ANALISE']; }
  get speciesLabel()  { return SPECIES_MAP[this.animal()?.species ?? ''] ?? ''; }
  get sizeLabel()     { return SIZE_MAP[this.animal()?.size ?? ''] ?? ''; }
  get sexLabel()      { return SEX_MAP[this.animal()?.sex ?? ''] ?? ''; }
  get donorInitial()  { return (this.animal()?.owner?.name ?? 'U').charAt(0).toUpperCase(); }

  get isOwner(): boolean {
    const me = this.auth.currentUser$.getValue();
    return !!me && me.id === this.animal()?.owner?.id;
  }

  get isAvailable(): boolean { return this.animal()?.status === 'AVAILABLE'; }

  get mapLat(): number { return this.animal()?.latitude  ?? BARREIRAS_LAT; }
  get mapLng(): number { return this.animal()?.longitude ?? BARREIRAS_LNG; }

  get statusInfoMessage(): string {
    const s = this.animal()?.status;
    if (s === 'IN_PROCESS') return 'Este animal já está em processo de adoção.';
    if (s === 'ADOPTED')    return 'Este animal já foi adotado. 🎉';
    return 'Este animal não está disponível no momento.';
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  setImage(i: number): void { this.activeIndex.set(i); }

  requestAdoption(): void {
    this.adoptLoading = true;
    this.actionError  = '';

    this.adoptionService.request(this.animal()!.id).subscribe({
      next: () => { this.adoptDone = true; this.adoptLoading = false; },
      error: (err) => {
        this.actionError  = err?.error?.message ?? 'Erro ao enviar solicitação.';
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
        title:        'Excluir animal',
        message:      `Tem certeza que deseja excluir "${this.animal()!.name}"? Esta ação não pode ser desfeita.`,
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