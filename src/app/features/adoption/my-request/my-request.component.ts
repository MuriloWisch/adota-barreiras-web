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
  templateUrl: './my-request.component.html',
  styleUrls: ['./my-request.component.scss'],
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