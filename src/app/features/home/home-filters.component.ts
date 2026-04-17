import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, takeUntil } from 'rxjs';

export interface HomeFilters {
  species: string;
  size: string;
  sex: string;
  radius: number;
}

@Component({
  selector: 'app-home-filters',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonToggleModule, MatSliderModule,
    MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="filters-wrap">

      <form [formGroup]="form">

        <div class="filter-row">

          <div class="filter-group">
            <span class="filter-label">Espécie</span>
            <mat-button-toggle-group formControlName="species" class="toggle-group">
              <mat-button-toggle value="">Todos</mat-button-toggle>
              <mat-button-toggle value="DOG">🐶 Cão</mat-button-toggle>
              <mat-button-toggle value="CAT">🐱 Gato</mat-button-toggle>
              <mat-button-toggle value="OTHER">🐾 Outro</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <div class="filter-group">
            <span class="filter-label">Porte</span>
            <mat-button-toggle-group formControlName="size" class="toggle-group">
              <mat-button-toggle value="">Todos</mat-button-toggle>
              <mat-button-toggle value="SMALL">Pequeno</mat-button-toggle>
              <mat-button-toggle value="MEDIUM">Médio</mat-button-toggle>
              <mat-button-toggle value="LARGE">Grande</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <div class="filter-group">
            <span class="filter-label">Sexo</span>
            <mat-button-toggle-group formControlName="sex" class="toggle-group">
              <mat-button-toggle value="">Todos</mat-button-toggle>
              <mat-button-toggle value="MALE">Macho</mat-button-toggle>
              <mat-button-toggle value="FEMALE">Fêmea</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

        </div>

        <div class="filter-row radius-row">
          <div class="filter-group radius-group">
            <span class="filter-label">Raio: <strong>{{ form.get('radius')?.value }} km</strong></span>
            <mat-slider min="1" max="50" step="1" class="radius-slider">
              <input matSliderThumb formControlName="radius">
            </mat-slider>
          </div>

          <button mat-button class="clear-btn" type="button" (click)="clear()">
            <mat-icon>close</mat-icon> Limpar filtros
          </button>
        </div>

      </form>

    </div>
  `,
  styles: [`
    .filters-wrap {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 12px;
    }
    .filter-row:last-child { margin-bottom: 0; }
    .filter-group { display: flex; flex-direction: column; gap: 6px; }
    .filter-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .filter-label strong { color: #4CAF50; }

    .toggle-group {
      border-radius: 10px !important;
      overflow: hidden;
    }
    ::ng-deep .mat-button-toggle {
      font-size: 12px !important;
      font-family: 'Inter', sans-serif !important;
    }
    ::ng-deep .mat-button-toggle-checked {
      background: #4CAF50 !important;
      color: #fff !important;
    }

    .radius-row { align-items: center; }
    .radius-group { flex: 1; min-width: 200px; }
    .radius-slider { width: 100%; }

    .clear-btn {
      color: #999 !important;
      font-size: 13px !important;
      transition: color 0.3s ease !important;
    }
    .clear-btn:hover { color: #ef4444 !important; }

    @media (max-width: 640px) {
      .filter-row { flex-direction: column; }
      .toggle-group { flex-wrap: wrap; }
    }
  `],
})
export class HomeFiltersComponent implements OnInit, OnDestroy {
  @Output() filtersChange = new EventEmitter<HomeFilters>();

  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      species: [''],
      size:    [''],
      sex:     [''],
      radius:  [10],
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(
      debounceTime(400),
      takeUntil(this.destroy$),
    ).subscribe(values => this.filtersChange.emit(values));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clear(): void {
    this.form.setValue({ species: '', size: '', sex: '', radius: 10 });
  }
}