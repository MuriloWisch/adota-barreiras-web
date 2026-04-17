import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnimalService } from '../../../core/services/animal.service';
import { Animal } from '../../../core/models/animal.model';
import { AnimalCardComponent } from '../../../shared/components/animal-card/animal-card.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-my-animals',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    AnimalCardComponent, PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <div class="page-wrap">
      <div class="header-row">
        <app-page-header title="Meus Animais" subtitle="Gerencie os animais que você cadastrou"></app-page-header>
        <button mat-raised-button class="btn-add" routerLink="/animals/create">
          <mat-icon>add</mat-icon> Cadastrar Animal
        </button>
      </div>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <div class="grid" *ngIf="!loading()">
        <app-animal-card
          *ngFor="let a of animals()"
          [animal]="a"
          (onSelect)="router.navigate(['/animals', a.id])">
        </app-animal-card>
      </div>

      <div class="empty" *ngIf="!loading() && !animals().length">
        <span>🐾</span>
        <p>Você ainda não cadastrou nenhum animal.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { max-width: 1100px; margin: 32px auto; padding: 0 24px 64px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .btn-add { background: #4CAF50 !important; color: #fff !important; border-radius: 12px !important; font-weight: 600 !important; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .empty { display: flex; flex-direction: column; align-items: center; padding: 64px 24px; gap: 12px; }
    .empty span { font-size: 48px; }
    .empty p    { font-size: 16px; color: #666; }
  `],
})
export class MyAnimalsComponent implements OnInit {
  animals = signal<Animal[]>([]);
  loading = signal(true);

  constructor(public router: Router, private animalService: AnimalService) {}

  ngOnInit(): void {
    this.animalService.getMyAnimals().subscribe({
      next: a  => { this.animals.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}