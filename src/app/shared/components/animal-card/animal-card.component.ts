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
  templateUrl: './animal-card.component.html',
  styleUrls: ['./animal-card.component.scss'],
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