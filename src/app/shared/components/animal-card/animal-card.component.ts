import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Animal } from '../../../core/models/animal.model';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  AVAILABLE:  { label: 'Disponível',   color: '#4CAF50' },
  EM_ANALISE: { label: 'Em análise',   color: '#FF9800' },
  IN_PROCESS: { label: 'Em processo',  color: '#2196F3' },
  ADOPTED:    { label: 'Adotado',      color: '#9E9E9E' },
};

const SPECIES_ICON: Record<string, string> = { DOG: '🐶', CAT: '🐱', OTHER: '🐾' };
const SIZE_MAP:    Record<string, string> = { SMALL: 'Pequeno', MEDIUM: 'Médio', LARGE: 'Grande' };
const SEX_MAP:     Record<string, string> = { MALE: 'Macho', FEMALE: 'Fêmea' };

const PLACEHOLDER =
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#E8F5E9" width="400" height="300"/>
      <text x="200" y="160" text-anchor="middle" font-size="64">🐾</text>
    </svg>`
  );

@Component({
  selector: 'app-animal-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-card.component.html',
  styleUrls: ['./animal-card.component.scss'],
})
export class AnimalCardComponent {
  @Input() animal!: Animal;
  @Input() distance?: string;
  @Input() selected = false;
  @Output() onSelect = new EventEmitter<Animal>();

  get status()       { return STATUS_MAP[this.animal.status] ?? STATUS_MAP['EM_ANALISE']; }
  get speciesIcon()  { return SPECIES_ICON[this.animal.species] ?? '🐾'; }
  get sizeLabel()    { return SIZE_MAP[this.animal.size] ?? this.animal.size; }
  get sexLabel()     { return SEX_MAP[this.animal.sex] ?? this.animal.sex; }
  get ageLabel()     {
    const n = this.animal.age;
    return `${n} ano${n !== 1 ? 's' : ''}`;
  }
  get imageUrl()     { return this.animal.images?.[0]?.imageUrl || PLACEHOLDER; }

   onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder-animal.jpg';
  }
}
