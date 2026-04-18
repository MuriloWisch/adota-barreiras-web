import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';

import { AdoptionService } from '../../../core/services/adoption.service';
import { ChatService } from '../../../core/services/chat.service';
import { AdoptionRequest } from '../../../core/models/adoption-request.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface RequestCard {
  req: AdoptionRequest;
  loadingChat: boolean;
  loadingCancel: boolean;
}

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatTabsModule,
    MatProgressSpinnerModule, MatBadgeModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="page-wrap">

      <app-page-header
        title="Minhas Solicitações"
        subtitle="Acompanhe o status das suas solicitações de adoção">
      </app-page-header>

      <app-loading-spinner *ngIf="pageLoading()"></app-loading-spinner>

      <div *ngIf="!pageLoading()">

        <mat-tab-group animationDuration="200ms" class="tabs">

          <!-- PENDENTES -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span>Pendentes</span>
              <span class="tab-badge pending" *ngIf="pending().length">{{ pending().length }}</span>
            </ng-template>
            <div class="tab-content">
              <div class="empty-tab" *ngIf="!pending().length">
                <span>⏳</span><p>Nenhuma solicitação pendente.</p>
              </div>
              <div class="req-card" *ngFor="let card of pending()" @fadeIn>
                <ng-container *ngTemplateOutlet="reqCard; context: { card: card }"></ng-container>
              </div>
            </div>
          </mat-tab>

          <!-- ACEITAS -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span>Aceitas</span>
              <span class="tab-badge accepted" *ngIf="accepted().length">{{ accepted().length }}</span>
            </ng-template>
            <div class="tab-content">
              <div class="empty-tab" *ngIf="!accepted().length">
                <span>💚</span><p>Nenhuma solicitação aceita ainda.</p>
              </div>
              <div class="req-card" *ngFor="let card of accepted()" @fadeIn>
                <ng-container *ngTemplateOutlet="reqCard; context: { card: card }"></ng-container>
              </div>
            </div>
          </mat-tab>

          <!-- REJEITADAS -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span>Rejeitadas</span>
              <span class="tab-badge rejected" *ngIf="rejected().length">{{ rejected().length }}</span>
            </ng-template>
            <div class="tab-content">
              <div class="empty-tab" *ngIf="!rejected().length">
                <span>🚫</span><p>Nenhuma solicitação rejeitada.</p>
              </div>
              <div class="req-card" *ngFor="let card of rejected()" @fadeIn>
                <ng-container *ngTemplateOutlet="reqCard; context: { card: card }"></ng-container>
              </div>
            </div>
          </mat-tab>

        </mat-tab-group>

      </div>
    </div>

    <!-- ══ Card Template ══ -->
    <ng-template #reqCard let-card="card">
      <div class="card-inner">

        <!-- Thumbnail -->
        <div class="thumb-wrap">
          <img
            [src]="card.req.animal?.images?.[0]?.imageUrl || 'assets/placeholder-animal.jpg'"
            [alt]="card.req.animal?.name">
        </div>

        <!-- Info -->
        <div class="card-info">
          <h3>{{ card.req.animal?.name }}</h3>
          <div class="info-tags">
            <span class="tag">{{ card.req.animal?.species }}</span>
            <span class="tag">{{ card.req.animal?.size }}</span>
          </div>
          <p class="donor-name">🐾 Doador: <strong>{{ card.req.animal?.owner?.name }}</strong></p>
          <p class="req-date">Enviado em {{ card.req.createdAt | date:'dd/MM/yyyy' }}</p>

          <!-- PENDING -->
          <div class="status-msg pending-msg" *ngIf="card.req.status === 'PENDING'">
            <mat-icon>schedule</mat-icon>
            Aguardando resposta do doador
          </div>

          <!-- ACCEPTED -->
          <div class="status-msg accepted-msg" *ngIf="card.req.status === 'ACCEPTED'">
            <mat-icon>check_circle</mat-icon>
            Parabéns! Sua solicitação foi aceita! 🎉
          </div>

          <!-- REJECTED -->
          <div class="status-msg rejected-msg" *ngIf="card.req.status === 'REJECTED'">
            <mat-icon>cancel</mat-icon>
            Solicitação não aprovada
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions">

          <!-- PENDING actions -->
          <ng-container *ngIf="card.req.status === 'PENDING'">
            <button mat-stroked-button class="btn-view" [routerLink]="['/animals', card.req.animal?.id]">
              <mat-icon>visibility</mat-icon> Ver Animal
            </button>
            <button mat-stroked-button class="btn-cancel-req"
              [disabled]="card.loadingCancel"
              (click)="cancelRequest(card)">
              <mat-spinner diameter="14" *ngIf="card.loadingCancel"></mat-spinner>
              <mat-icon *ngIf="!card.loadingCancel">close</mat-icon>
              Cancelar
            </button>
          </ng-container>

          <!-- ACCEPTED actions -->
          <ng-container *ngIf="card.req.status === 'ACCEPTED'">
            <button mat-raised-button class="btn-chat"
              [disabled]="card.loadingChat"
              (click)="openChat(card)">
              <mat-spinner diameter="14" *ngIf="card.loadingChat"></mat-spinner>
              <mat-icon *ngIf="!card.loadingChat">chat</mat-icon>
              <span>Falar com Doador</span>
            </button>
            <button mat-stroked-button class="btn-view" [routerLink]="['/animals', card.req.animal?.id]">
              Ver Animal
            </button>
          </ng-container>

          <!-- REJECTED actions -->
          <ng-container *ngIf="card.req.status === 'REJECTED'">
            <button mat-stroked-button class="btn-view" [routerLink]="['/animals', card.req.animal?.id]">
              <mat-icon>visibility</mat-icon> Ver Animal
            </button>
          </ng-container>

        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-wrap { max-width: 900px; margin: 32px auto; padding: 0 24px 64px; }

    /* Tabs */
    .tabs { margin-top: 8px; }
    ::ng-deep .mat-mdc-tab-body-wrapper { margin-top: 4px; }
    .tab-badge {
      font-size: 11px; font-weight: 700;
      padding: 1px 8px; border-radius: 12px;
      margin-left: 8px;
    }
    .tab-badge.pending  { background: #fef3c7; color: #92400e; }
    .tab-badge.accepted { background: #dcfce7; color: #166534; }
    .tab-badge.rejected { background: #f3f4f6; color: #6b7280; }

    .tab-content { display: flex; flex-direction: column; gap: 14px; padding: 16px 0; }

    /* Empty */
    .empty-tab {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; gap: 10px; color: #aaa; text-align: center;
    }
    .empty-tab span { font-size: 40px; }
    .empty-tab p    { font-size: 14px; }

    /* Card */
    .req-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
      overflow: hidden;
      transition: box-shadow 0.3s ease, transform 0.3s ease;
    }
    .req-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.11); }

    .card-inner {
      display: flex; align-items: flex-start; gap: 16px; padding: 16px;
      flex-wrap: wrap;
    }

    /* Thumbnail */
    .thumb-wrap {
      width: 90px; height: 90px; border-radius: 12px;
      overflow: hidden; flex-shrink: 0;
    }
    .thumb-wrap img { width: 100%; height: 100%; object-fit: cover; }

    /* Info */
    .card-info { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 6px; }
    h3 { font-size: 16px; font-weight: 700; color: #1E3A5F; }
    .info-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { background: #f0fdf4; color: #2e7d32; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px; }
    .donor-name { font-size: 12px; color: #666; }
    .donor-name strong { color: #1E3A5F; }
    .req-date { font-size: 11px; color: #aaa; }

    /* Status msgs */
    .status-msg {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600;
      padding: 6px 10px; border-radius: 8px; margin-top: 4px;
    }
    .status-msg mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .pending-msg  { background: #fef3c7; color: #92400e; }
    .accepted-msg { background: #dcfce7; color: #166534; }
    .rejected-msg { background: #f3f4f6; color: #6b7280; }

    /* Actions */
    .card-actions {
      display: flex; flex-direction: column; gap: 8px;
      justify-content: center; min-width: 150px;
    }
    .btn-view {
      border-color: #1E3A5F !important; color: #1E3A5F !important;
      border-radius: 10px !important; font-size: 13px !important; height: 38px;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease !important;
    }
    .btn-view:hover { background: #f0f4ff !important; }
    .btn-cancel-req {
      border-color: #fca5a5 !important; color: #ef4444 !important;
      border-radius: 10px !important; font-size: 13px !important; height: 38px;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease !important;
    }
    .btn-cancel-req:hover:not([disabled]) { background: #fef2f2 !important; }
    .btn-chat {
      background: #4CAF50 !important; color: #fff !important;
      border-radius: 10px !important; font-size: 13px !important; height: 38px;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease !important;
    }
    .btn-chat:hover:not([disabled]) { background: #43A047 !important; box-shadow: 0 4px 14px rgba(76,175,80,0.35) !important; }

    @media (max-width: 600px) {
      .card-inner { flex-direction: column; }
      .card-actions { flex-direction: row; flex-wrap: wrap; }
    }
  `],
})
export class MyRequestsComponent implements OnInit {

  all        = signal<RequestCard[]>([]);
  pageLoading = signal(true);

  pending  = computed(() => this.all().filter(c => c.req.status === 'PENDING'));
  accepted = computed(() => this.all().filter(c => c.req.status === 'ACCEPTED'));
  rejected = computed(() => this.all().filter(c => c.req.status === 'REJECTED'));

  constructor(
    private adoptionService: AdoptionService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.adoptionService.listMyRequests().subscribe({
      next: reqs => {
        this.all.set(reqs.map(req => ({ req, loadingChat: false, loadingCancel: false })));
        this.pageLoading.set(false);
      },
      error: () => this.pageLoading.set(false),
    });
  }

  cancelRequest(card: RequestCard): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:        'Cancelar solicitação',
        message:      `Tem certeza que deseja cancelar sua solicitação para adotar "${card.req.animal?.name}"?`,
        confirmLabel: 'Cancelar solicitação',
      },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.setLoading(card.req.id, 'cancel', true);
      this.adoptionService.reject(card.req.id).subscribe({
        next: () => {
          this.all.update(prev => prev.filter(c => c.req.id !== card.req.id));
          this.snackBar.open('Solicitação cancelada.', 'Fechar', { duration: 3000 });
        },
        error: () => {
          this.setLoading(card.req.id, 'cancel', false);
          this.snackBar.open('Erro ao cancelar.', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  openChat(card: RequestCard): void {
    this.setLoading(card.req.id, 'chat', true);
    this.chatService.startChat(card.req.animal.id).subscribe({
      next: chat => this.router.navigate(['/chat', chat.id]),
      error: err => {
        this.setLoading(card.req.id, 'chat', false);
        this.snackBar.open(err?.error?.message ?? 'Erro ao abrir chat.', 'Fechar', { duration: 3000 });
      },
    });
  }

  private setLoading(id: number, type: 'chat' | 'cancel', val: boolean): void {
    this.all.update(prev => prev.map(c =>
      c.req.id === id
        ? { ...c, loadingChat: type === 'chat' ? val : c.loadingChat, loadingCancel: type === 'cancel' ? val : c.loadingCancel }
        : c
    ));
  }
}