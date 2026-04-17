import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Animal } from '../../../core/models/animal.model';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  AVAILABLE:  { label: 'Disponível',   color: '#4CAF50' },
  EM_ANALISE: { label: 'Em análise',   color: '#FF9800' },
  IN_PROCESS: { label: 'Em processo',  color: '#2196F3' },
  ADOPTED:    { label: 'Adotado',      color: '#9E9E9E' },
};

const SPECIES_MAP: Record<string, string> = { DOG: '🐶 Cão', CAT: '🐱 Gato', OTHER: '🐾 Outro' };
const SIZE_MAP:    Record<string, string> = { SMALL: 'Pequeno', MEDIUM: 'Médio', LARGE: 'Grande' };
const SEX_MAP:     Record<string, string> = { MALE: 'Macho', FEMALE: 'Fêmea' };

@Component({
  selector: 'app-animal-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule],
  template: `
    <div class="card" (click)="onSelect.emit(animal)">

      <div class="img-wrap">
        <img
          [src]="animal.images[0].imageUrl || 'assets/placeholder-animal.jpg'"
          [alt]="animal.name"
        />
        <span class="badge" [style.background]="status.color">{{ status.label }}</span>
        <span class="dist-chip" *ngIf="distance">📍 {{ distance }}</span>
      </div>

      <div class="body">
        <h3>{{ animal.name }}</h3>
        <div class="tags">
          <span class="tag">{{ speciesLabel }}</span>
          <span class="tag">{{ sizeLabel }}</span>
          <span class="tag">{{ sexLabel }}</span>
          <span class="tag" *ngIf="animal.age != null">{{ animal.age }} ano{{ animal.age !== 1 ? 's' : '' }}</span>
        </div>
        <button mat-raised-button class="btn-detail" (click)="$event.stopPropagation(); onSelect.emit(animal)">
          Ver detalhes
        </button>
      </div>

    </div>
  `,
  styles: [`
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    }
    .img-wrap {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
    }
    img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .card:hover img { transform: scale(1.04); }
    .badge {
      position: absolute; top: 10px; left: 10px;
      color: #fff; font-size: 11px; font-weight: 600;
      padding: 3px 10px; border-radius: 20px;
      letter-spacing: 0.3px;
    }
    .dist-chip {
      position: absolute; bottom: 10px; right: 10px;
      background: rgba(0,0,0,0.55); color: #fff;
      font-size: 11px; padding: 3px 10px; border-radius: 20px;
    }
    .body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    h3 { font-size: 17px; font-weight: 700; color: #1E3A5F; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      background: #f0fdf4; color: #2e7d32;
      font-size: 11px; font-weight: 500;
      padding: 3px 10px; border-radius: 20px;
    }
    .btn-detail {
      background: #4CAF50 !important;
      color: #fff !important;
      border-radius: 10px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      margin-top: auto;
    }
    .btn-detail:hover {
      background: #43A047 !important;
      box-shadow: 0 4px 16px rgba(76,175,80,0.35) !important;
    }
  `],
})
export class AnimalCardComponent {
  @Input() animal!: Animal;
  @Input() distance?: string;
  @Output() onSelect = new EventEmitter<Animal>();

  get status()      { return STATUS_MAP[this.animal.status] ?? STATUS_MAP['EM_ANALISE']; }
  get speciesLabel(){ return SPECIES_MAP[this.animal.species] ?? this.animal.species; }
  get sizeLabel()   { return SIZE_MAP[this.animal.size] ?? this.animal.size; }
  get sexLabel()    { return SEX_MAP[this.animal.sex] ?? this.animal.sex; }
}